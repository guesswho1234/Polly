use std::{
    collections::HashMap,
    sync::Arc,
    net::{SocketAddr, IpAddr},
    time::{Duration, Instant},
};

use axum::{
    body::Body,
    extract::{ConnectInfo, State},
    http::{Request, StatusCode, HeaderMap},
    middleware::Next,
    response::IntoResponse,
};
use tokio::sync::Mutex;

use crate::state::AppState;

/*
 * --- Configuration ---
 */

pub const GLOBAL_MAX_REQUESTS: usize = 1000;
pub const GLOBAL_WINDOW: Duration = Duration::from_secs(60);

pub const IP_MAX_REQUESTS: usize = 100; 
pub const IP_WINDOW: Duration = Duration::from_secs(60);

/*
 * --- Rate limiter states ---
 */

pub struct GlobalRateLimiter {
    pub hits: Vec<Instant>,
}

impl GlobalRateLimiter {
    pub fn new() -> Self {
        Self {
            hits: Vec::new(),
        }
    }
}

pub struct IPRateLimiter {
    pub hits: HashMap<String, Vec<Instant>>,
}

impl IPRateLimiter {
    pub fn new() -> Self {
        Self {
            hits: HashMap::new(),
        }
    }
}

pub type SharedGlobalRateLimiter = Arc<Mutex<GlobalRateLimiter>>;
pub type SharedIPRateLimiter = Arc<Mutex<IPRateLimiter>>;

/*
 * --- Helper functions ---
 */

fn extract_real_ip(headers: &HeaderMap, addr: SocketAddr) -> String {
    let peer = addr.ip().to_string();

    // If request comes from Docker bridge (172.x.x.x), trust proxy headers instead
    if peer.starts_with("172.") {
        if let Some(forwarded) = headers.get("x-forwarded-for") {
            if let Ok(s) = forwarded.to_str() {
                if let Some(ip) = s.split(',').next() {
                    return ip.trim().to_string();
                }
            }
        }

        if let Some(real) = headers.get("x-real-ip") {
            if let Ok(ip) = real.to_str() {
                return ip.to_string();
            }
        }
    }

    peer
}


fn normalize_ip(ip: &str) -> String {
    if let Ok(addr) = ip.parse::<IpAddr>() {
        match addr {
            IpAddr::V4(v4) => v4.to_string(),
            IpAddr::V6(v6) => {
                let segments = v6.segments();
                format!(
                    "{:x}:{:x}:{:x}:{:x}::",
                    segments[0],
                    segments[1],
                    segments[2],
                    segments[3],
                )
            }
        }
    } else {
        ip.to_string()
    }
}

/*
 * --- Middleware ---
 */

pub async fn rate_limit(
    State(state): State<AppState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    req: Request<Body>,
    next: Next,
) -> impl IntoResponse {
    let now = Instant::now();
    let ip_raw = extract_real_ip(req.headers(), addr);
    let ip = normalize_ip(&ip_raw);

    tracing::info!(
        "peer_addr = {}, extracted_ip = {}",
        addr.ip(),
        ip
    );

    // ---- ENFORCE EXISTING BANS ----
    if state.check_ban(&ip).await.unwrap_or(false) {
        return (
            StatusCode::FORBIDDEN,
            "Your IP has been banned.",
        )
        .into_response();
    }
    
    // ---- ENFORCE GLOBAL RATE LIMIT ----
    let mut global = state.global_rate_limiter.lock().await;

    global.hits.retain(|t| now.duration_since(*t) < GLOBAL_WINDOW);

    if global.hits.len() >= GLOBAL_MAX_REQUESTS {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            "Server is busy, please try again later.",
        )        
        .into_response();
    }

    global.hits.push(now);

    // ---- ENFORCE IP RATE LIMIT AND APPLY NEW BANS IF NECESSARY ----
    let ip_over_limit = {
        let mut limiter = state.ip_rate_limiter.lock().await;
        let entry = limiter.hits.entry(ip.clone()).or_default();
    
        entry.retain(|t| now.duration_since(*t) < IP_WINDOW);
    
        if entry.len() >= IP_MAX_REQUESTS {
            true
        } else {
            entry.push(now);
            false
        }
    };
    

    if ip_over_limit {
        let banned = state.register_strike(&ip).await.unwrap_or(false);
    
        if banned {
            return (
                StatusCode::FORBIDDEN, 
                "Your IP has been banned."
            )
            .into_response();
        } else {
            return (
                StatusCode::TOO_MANY_REQUESTS, 
                "Too many requests, please slow down."
            )
            .into_response();
        }
    }
    
    next.run(req).await.into_response()
}
