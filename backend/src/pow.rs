use std::time::{SystemTime, UNIX_EPOCH};

use axum::{
    body::Body,
    extract::State,
    http::{Request, StatusCode, HeaderMap, HeaderValue},
    middleware::Next,
    response::IntoResponse,
};
use sha2::{Digest, Sha256};

use crate::state::AppState;

/*
 * --- Configuration ---
 */

const POW_DIFFICULTY: u32 = 12;
const POW_EXPIRY_SECS: u64 = 30;

/*
 * --- Proof of work states ---
 */

fn make_challenge(secret: &[u8], now: u64) -> String {
    let mut hasher = Sha256::new();
    hasher.update(secret);
    hasher.update(now.to_be_bytes());
    hex::encode(hasher.finalize())
}

fn hash_ok(hash: &[u8], difficulty: u32) -> bool {
    let mut zero_bits = 0;
    for b in hash {
        if *b == 0 {
            zero_bits += 8;
        } else {
            zero_bits += b.leading_zeros() as usize; // partial bits
            break;
        }
    }

    zero_bits >= difficulty as usize
}

pub async fn pow_challenge(
    State(state): State<AppState>,
    req: Request<Body>,
    next: Next,
) -> impl IntoResponse {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let headers = req.headers();

    let challenge = headers.get("X-POW-Challenge");
    let nonce = headers.get("X-POW-Nonce");
    let hash = headers.get("X-POW-Hash");

    // No PoW provided: demand one
    if challenge.is_none() || nonce.is_none() || hash.is_none() {
        let challenge = make_challenge(&state.pow_secret, now);
        let mut headers = HeaderMap::new();

        headers.insert(
            "X-POW-Challenge",
            HeaderValue::from_str(&challenge).unwrap(),
        );

        headers.insert(
            "X-POW-Difficulty",
            HeaderValue::from_str(&POW_DIFFICULTY.to_string()).unwrap(),
        );

        return (StatusCode::PRECONDITION_REQUIRED, headers).into_response();
    }

    let challenge_str = match challenge.unwrap().to_str() {
        Ok(v) => v,
        Err(_) => return StatusCode::FORBIDDEN.into_response(),
    };

    let nonce_str = match nonce.unwrap().to_str() {
        Ok(v) => v,
        Err(_) => return StatusCode::FORBIDDEN.into_response(),
    };

    let mut valid = false;
    
    // Verify challenge time window
    for ts in (now.saturating_sub(POW_EXPIRY_SECS))..=now {
        let expected = make_challenge(&state.pow_secret, ts);
        if expected == challenge_str {
            valid = true;
            break;
        }
    }
    
    if !valid {
        return StatusCode::FORBIDDEN.into_response();
    }

    // Verify hash
    let mut hasher = Sha256::new();
    hasher.update(challenge_str.as_bytes());
    hasher.update(nonce_str.as_bytes());

    let result = hasher.finalize();

    if !hash_ok(&result, POW_DIFFICULTY) {
        return StatusCode::FORBIDDEN.into_response();
    }

    next.run(req).await
}

