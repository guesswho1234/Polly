use axum::{
    http::StatusCode,
    extract::{Path, State},
    response::{Redirect, IntoResponse, Response},
    Json
};
use axum_extra::TypedHeader; 
use axum_extra::headers::{Authorization, authorization::Basic}; 
use serde::{Deserialize, Serialize};
use serde_json::json;
use argon2::{
    Argon2,
    password_hash::{SaltString, PasswordHasher, PasswordHash, PasswordVerifier}
}; 
use rand_core::OsRng;
use uuid::Uuid;
use std::time::{SystemTime, Duration};

use crate::state::AppState;

/*
 * --- Limits ---
 */

const MAX_PASTE_SIZE: usize = 256 * 1024; // 256 KB
const MAX_PASSWORD_LENGTH: usize = 256;

/*
 * --- Data Types ---
 */

#[derive(Clone, Serialize)]
pub struct Paste {
    pub id: String,
    pub content: String,
    pub password_hash: Option<String>,
    pub expiry: u32,
    pub uses: u32,
    pub created_at: SystemTime,
}

#[derive(Deserialize)]
pub struct NewPaste {
    pub content: String,
    #[serde(default)]
    pub password: String,
    pub expiry: u32,
    pub uses: u32,
}

#[derive(Serialize)]
pub struct CreatePasteResponse {
    pub status: PasteStatus,
    pub id: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct PasteData {
    pub id: String,
    pub content: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "lowercase")] 
pub enum PasteStatus {
    Success,
    Protected,
    // Error, // never used
}

#[derive(Serialize)]
pub struct PasteResponse {
    pub status: PasteStatus,
    pub data: Option<PasteData>,
    pub message: String,
}

#[derive(Debug)]
pub enum BinError {
    Internal(String),
    InvalidInput(String),
    PasswordHashError(String),
    NotFound,
    Expired,
}

/*
 * --- Trait implementations ---
 */

impl IntoResponse for BinError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            BinError::Internal(e) =>
                (StatusCode::INTERNAL_SERVER_ERROR, e),
            BinError::InvalidInput(e) =>
                (StatusCode::BAD_REQUEST, e),
            BinError::PasswordHashError(e) => 
                (StatusCode::INTERNAL_SERVER_ERROR, e),
            BinError::NotFound => 
                (StatusCode::NOT_FOUND, "Paste not found".into()),
            BinError::Expired => 
                (StatusCode::GONE, "Paste expired".into()),
        };

        let body = Json(json!({
            "status": "error",
            "message": message,
        }));

        (status, body).into_response()
    }
}

impl From<rusqlite::Error> for BinError {
    fn from(err: rusqlite::Error) -> Self {
        BinError::Internal(err.to_string())
    }
}

/*
 * --- Helper Functions ---
 */

fn verify_password(paste: &Paste, auth: &Option<TypedHeader<Authorization<Basic>>>) -> Result<(), PasswordError> {
    if let Some(stored_hash) = &paste.password_hash {
        if let Some(TypedHeader(Authorization(basic))) = auth {
            let provided_pw = basic.password();
            let parsed_hash = PasswordHash::new(stored_hash);
            let argon2 = Argon2::default();

            if parsed_hash
                .ok()
                .map_or(false, |ph| argon2.verify_password(provided_pw.as_bytes(), &ph).is_ok())
            {
                Ok(())
            } else {
                Err(PasswordError::Incorrect)
            }
        } else {
            Err(PasswordError::Missing)
        }
    } else {
        Ok(()) // No password protection at all
    }
}

enum PasswordError {
    Missing,
    Incorrect,
}

fn success_response(paste: &Paste) -> PasteResponse {
    PasteResponse {
        status: PasteStatus::Success,
        data: Some(PasteData {
            id: paste.id.clone(),
            content: Some(paste.content.clone()),
        }),
        message: "Paste retrieved successfully.".into(),
    }
}

fn protected_response(message: &str) -> PasteResponse {
    PasteResponse {
        status: PasteStatus::Protected,
        data: None,
        message: message.into(),
    }
}

fn is_expired(paste: &Paste) -> bool {
    if let Ok(elapsed) = paste.created_at.elapsed() {
        elapsed > Duration::from_secs(paste.expiry as u64 * 3600)
    } else {
        true // treat weird timestamps as expired
    }
}

/*
 * --- Handlers ---
 */

// Redirect /bin to /bin.html
pub async fn bin_html() -> impl IntoResponse {
    Redirect::to("/bin.html")
}

// Create new paste 
pub async fn create_paste(
    State(state): State<AppState>,
    Json(new_paste): Json<NewPaste>,
) -> Result<Json<CreatePasteResponse>, BinError>{
    let id = Uuid::new_v4().to_string();

    // Sanitize and validate settings values 
    if new_paste.expiry == 0 || new_paste.expiry > 9999 {
        return Err(BinError::InvalidInput("Invalid expiry value".into()));
    }
    
    if new_paste.uses == 0 || new_paste.uses > 9999 {
        return Err(BinError::InvalidInput("Invalid uses value".into()));
    }

    // Sanitize and validate content
    let content = new_paste.content.trim().to_string();
    
    if content.is_empty() {
        return Err(BinError::InvalidInput("Content cannot be empty".into()));
    }
    
    if content.len() > MAX_PASTE_SIZE {
        return Err(BinError::InvalidInput(format!("Paste content exceeds maximum size of {} bytes", MAX_PASTE_SIZE)));
    }

    // Validate password length
    if new_paste.password.len() > MAX_PASSWORD_LENGTH {
        return Err(BinError::InvalidInput("Password too long".into()));
    }

    // Create password hash if a password was set
    let password_hash = if !new_paste.password.is_empty() {
        let mut rng = OsRng;
        let salt = SaltString::generate(&mut rng);
        let argon2 = Argon2::default();
        let hash = argon2
            .hash_password(new_paste.password.as_bytes(), &salt)
            .map_err(|e| BinError::PasswordHashError(e.to_string()))?
            .to_string();
        Some(hash)
    } else {
        None
    };

    // Create proper paste
    let paste = Paste {
        id: id.clone(),
        content: content,
        password_hash,
        expiry: new_paste.expiry,
        uses: new_paste.uses,
        created_at: SystemTime::now(),
    };

    state.bin.create_paste(paste).await?;

    // Return the paste id to the frontend
    Ok(Json(CreatePasteResponse {
        status: PasteStatus::Success,
        id,
        message: "Paste created successfully.".into(),
    }))
}

// Retrieve existing paste
pub async fn get_paste(
    Path(id): Path<String>,
    State(state): State<AppState>,
    auth: Option<TypedHeader<Authorization<Basic>>>,
) -> Result<Json<PasteResponse>, BinError> {
    let preview = state.bin.get_paste(&id).await?;

    // Expiry check 
    if is_expired(&preview) {
        return Err(BinError::Expired);
    }

    // Password check 
    match verify_password(&preview, &auth) {
        Ok(()) => {
            let consumed = state.bin.consume_paste(&id).await?;
            Ok(Json(success_response(&consumed)))
        }
        Err(PasswordError::Missing) => {
            Ok(Json(protected_response("This paste is password protected.")))
        }
        Err(PasswordError::Incorrect) => {
            Ok(Json(protected_response("Incorrect password.")))
        }
    }
}
