use axum::{Router, middleware, extract::DefaultBodyLimit};
use std::{net::SocketAddr, path::Path};
use tokio::net::TcpListener;
use tower_http::services::fs::{ServeDir, ServeFile};
use tracing::info;

use crate::rate_limit::rate_limit;
use crate::pow::pow_challenge;

use state::AppState;
use state::{spawn_restore_strikes_task, spawn_cleanup_task};

mod bin;
mod cal;
mod ask;
mod storage;
mod state;
mod pow;
mod rate_limit;
mod abuse;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    // ---- Storage configuration ----
    let storage_backend = std::env::var("STORAGE_BACKEND").unwrap_or_else(|_| "memory".into());

    let state = match storage_backend.as_str() {
        "sqlite" => {
            let sqlite_path =
                std::env::var("SQLITE_PATH").unwrap_or_else(|_| "polly.sqlite".into());

            info!("Using SQLite storage at {}", sqlite_path);

            AppState::new(true, Some(&sqlite_path)).await?
        }
        _ => {
            info!("Using in-memory storage");

            AppState::new(false, None).await?
        }
    };

    spawn_restore_strikes_task(state.clone());
    spawn_cleanup_task(state.clone());

    // ---- Build app ----
    let app = app(state.clone());

    let bind_addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "127.0.0.1".into());
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".into())
        .parse()
        .expect("Invalid PORT");

    let addr: SocketAddr = format!("{}:{}", bind_addr, port).parse()?;

    // let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    let listener = TcpListener::bind(addr).await?;

    info!("Polly backend running at http://{}", addr);

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;

    Ok(())
}

fn app(state: AppState) -> Router {
    let static_path = if Path::new("../static").exists() {
        "../static"
    } else {
        "static"
    };

    let static_files = ServeDir::new(static_path);
    let fallback_file = ServeFile::new(Path::new(static_path).join("404.html"));

    /*
     * --- Limits ---
     */

    const MAX_BODY_SIZE: usize = 256 * 1024; // 256 KB

Router::new()
    // --- Bin routes ---
    .route("/bin", axum::routing::get(bin::bin_html)) 
    .route("/bin", axum::routing::post(bin::create_paste)
            .layer(middleware::from_fn_with_state(state.clone(), pow_challenge)))
    .route("/bin/:id", axum::routing::get(bin::get_paste)) 

    // --- Cal routes ---
    .route("/cal", axum::routing::get(cal::cal_html))
    .route("/cal", axum::routing::post(cal::create_event)
            .layer(middleware::from_fn_with_state(state.clone(), pow_challenge)))
    .route("/cal/:id", axum::routing::get(cal::get_event))

    // --- Ask routes ---
    .route("/ask", axum::routing::get(ask::ask_html))
    .route("/ask", axum::routing::post(ask::create_survey)
            .layer(middleware::from_fn_with_state(state.clone(), pow_challenge)))
    .route("/ask/:id/vote", axum::routing::post(ask::vote_survey)
            .layer(middleware::from_fn_with_state(state.clone(), pow_challenge)))
    .route("/ask/:id", axum::routing::get(ask::get_survey))

    // --- Static files ---
    .nest_service("/", static_files)
    .fallback_service(fallback_file)
    
    // --- Global middleware ---
    .layer(DefaultBodyLimit::max(MAX_BODY_SIZE))
    .layer(middleware::from_fn_with_state(state.clone(), rate_limit)) 
    .with_state(state.clone())
}
