use axum::{
    http::StatusCode,
    extract::{Path, State},
    response::{Redirect, IntoResponse, Response, Html},
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
use std::time::{SystemTime, Duration, fs};
use std::collections::HashMap;

use crate::state::AppState;

/*
 * --- Limits ---
 */

const MAX_TITLE_LEN: usize = 255;
const MAX_ITEM_LEN: usize = 255;
const MAX_ITEMS: usize = 100;
const MAX_VOTER_LEN: usize = 64; 
const MAX_PASSWORD_LENGTH: usize = 256;

/*
 * --- Data Types ---
 */

#[derive(Clone, Serialize, Deserialize)]
pub struct Survey {
    pub id: String,
    pub content: SurveyContent,
    pub password_hash: Option<String>,
    pub expiry: u32,
    pub created_at: SystemTime,
    pub votes: Vec<StoredVote>,
}


#[derive(Deserialize)]
pub struct NewSurvey {
    pub survey_type: SurveyType,
    pub title: String,
    pub items: Vec<String>,
    #[serde(default)]
    pub password: String,
    pub expiry: u32,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SurveyContent {
    pub title: String,
    pub survey_type: SurveyType,
    pub items: Vec<String>,
}

#[derive(Serialize)]
pub struct CreateSurveyResponse {
    pub status: SurveyStatus,
    pub id: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct SurveyData {
    pub id: String,
    pub content: Option<SurveyContent>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub votes: Vec<StoredVote>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct StoredVote {
    pub vote: HashMap<usize, i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub voter: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "lowercase")] 
pub enum SurveyStatus {
    Success,
    Protected,
    // Error, // never used
}

#[derive(Serialize)]
pub struct SurveyResponse {
    pub status: SurveyStatus,
    pub data: Option<SurveyData>,
    pub message: String,
}

#[derive(Deserialize)]
pub struct VoteRequest {
    pub vote: HashMap<usize, i32>,
    #[serde(default)]
    pub voter: Option<String>,
}

#[derive(Debug)]
pub enum AskError {
    Internal(String),
    InvalidInput(String), 
    PasswordHashError(String),
    NotFound,
    Expired,
}
/*
 * --- Trait implementations ---
 */

impl IntoResponse for AskError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AskError::Internal(e) =>
                (StatusCode::INTERNAL_SERVER_ERROR, e),
            AskError::InvalidInput(e) =>
                (StatusCode::BAD_REQUEST, e),
            AskError::PasswordHashError(e) => 
                (StatusCode::INTERNAL_SERVER_ERROR, e),
            AskError::NotFound => 
                (StatusCode::NOT_FOUND, "Survey not found".into()),
            AskError::Expired => 
                (StatusCode::GONE, "Survey expired".into()),
        };

        let body = Json(json!({
            "status": "error",
            "message": message,
        }));

        (status, body).into_response()
    }
}

impl From<rusqlite::Error> for AskError {
    fn from(err: rusqlite::Error) -> Self {
        AskError::Internal(err.to_string())
    }
}

/*
 * --- Helper Functions ---
 */

fn verify_password(survey: &Survey, auth: &Option<TypedHeader<Authorization<Basic>>>) -> Result<(), PasswordError> {
    if let Some(stored_hash) = &survey.password_hash {
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

fn success_response(survey: &Survey) -> SurveyResponse {
       SurveyResponse {
        status: SurveyStatus::Success,
        data: Some(SurveyData {
            id: survey.id.clone(),
            content: Some(survey.content.clone()),
            votes: survey.votes.clone(),
        }),
        message: "Survey retrieved successfully.".into(),
    }
}

fn protected_response(message: &str) -> SurveyResponse {
    SurveyResponse {
        status: SurveyStatus::Protected,
        data: None,
        message: message.into(),
    }
}

fn is_expired(survey: &Survey) -> bool {
    if let Ok(elapsed) = survey.created_at.elapsed() {
        elapsed > Duration::from_secs(survey.expiry as u64 * 3600)
    } else {
        true // treat weird timestamps as expired
    }
}

/*
 * --- Enums / Small types ---
 */

#[derive(Clone, Copy, Deserialize, Serialize, Debug, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SurveyType {
    SingleChoice,
    MultipleChoice,
    RankChoice,
    MatrixChoice,
}

/*
 * --- Handlers ---
 */

// Redirect /ask to /ask.html
pub async fn ask_html() -> impl IntoResponse {
    Redirect::to("/ask.html")
}

pub async fn serve_ask_html() -> impl IntoResponse {
    let html = fs::read_to_string("static/ask.html")
        .expect("ask.html not found");
    Html(html)
}

// Create new survey 
pub async fn create_survey(
    State(state): State<AppState>,
    Json(new_survey): Json<NewSurvey>,
) -> Result<Json<CreateSurveyResponse>, AskError>{
    let id = Uuid::new_v4().to_string();

    // Sanitize and validate settings values 
    if new_survey.expiry == 0 || new_survey.expiry > 9999 {
        return Err(AskError::InvalidInput("Invalid expiry value".into()));
    }
    
    // Sanitize and validate title
    let title = new_survey.title.trim().to_string();
    if title.is_empty() {
        return Err(AskError::InvalidInput("Title cannot be empty".into()));
    }
    if title.len() > MAX_TITLE_LEN {
        return Err(AskError::InvalidInput(format!("Title too long (max {} chars)", MAX_TITLE_LEN)));
    }

    // Sanitize and validate items
    let items: Vec<String> = new_survey
        .items
        .into_iter()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    if items.is_empty() {
        return Err(AskError::InvalidInput("At least one choice item is required".into()));
    }
    if items.len() > MAX_ITEMS {
        return Err(AskError::InvalidInput(format!("Too many items (max {})", MAX_ITEMS)));
    }
    for item in &items {
        if item.len() > MAX_ITEM_LEN {
            return Err(AskError::InvalidInput(format!("Choice item too long (max {} chars)", MAX_ITEM_LEN)));
        }
    }

    // Validate password length
    if new_survey.password.len() > MAX_PASSWORD_LENGTH {
        return Err(AskError::InvalidInput("Password too long".into()));
    }

    // Create password hash if a password was set
    let password_hash = if !new_survey.password.is_empty() {
        let mut rng = OsRng;
        let salt = SaltString::generate(&mut rng);
        let argon2 = Argon2::default();
        let hash = argon2
            .hash_password(new_survey.password.as_bytes(), &salt)
            .map_err(|e| AskError::PasswordHashError(e.to_string()))?
            .to_string();
        Some(hash)
    } else {
        None
    };

    // Build content
    let survey_content = SurveyContent {
        survey_type: new_survey.survey_type,
        title,
        items,
    };
    
    // Create proper survey
    let survey = Survey {
        id: id.clone(),
        content: survey_content,
        password_hash,
        expiry: new_survey.expiry,
        created_at: SystemTime::now(),
        votes: Vec::new(),
    };

    state.ask.create_survey(survey).await?;

    // Return the survey id to the frontend
    Ok(Json(CreateSurveyResponse {
        status: SurveyStatus::Success,
        id,
        message: "Survey created successfully.".into(),
    }))
}

// Retrieve existing survey
pub async fn get_survey(
    Path(id): Path<String>,
    State(state): State<AppState>,
    auth: Option<TypedHeader<Authorization<Basic>>>,
) -> Result<Json<SurveyResponse>, AskError> {
    let survey = state.ask.get_survey(&id).await?;

    // Expiry check 
    if is_expired(&survey) {
        return Err(AskError::Expired);
    }

    // Password check 
    match verify_password(&survey, &auth) {
        Ok(()) => {
            Ok(Json(success_response(&survey)))
        }
        Err(PasswordError::Missing) => {
            Ok(Json(protected_response("This survey is password protected.")))
        }
        Err(PasswordError::Incorrect) => {
            Ok(Json(protected_response("Incorrect password.")))
        }
    }
}

pub async fn vote_survey(
    Path(id): Path<String>,
    State(state): State<AppState>,
    auth: Option<TypedHeader<Authorization<Basic>>>,
    Json(vote_req): Json<VoteRequest>,
) -> Result<Json<SurveyResponse>, AskError> {
    let survey = state.ask.get_survey(&id).await?;
    
    // Expiry check
    if is_expired(&survey) {
        return Err(AskError::Expired);
    }

    // Password check
    match verify_password(&survey, &auth) {
        Ok(()) => {},
        Err(PasswordError::Missing) => return Ok(Json(protected_response("This survey is password protected."))),
        Err(PasswordError::Incorrect) => return Ok(Json(protected_response("Incorrect password."))),
    }

    // Validation: make sure vote indices exist
    let num_items = survey.content.items.len();
    for &index in vote_req.vote.keys() {
        if index >= num_items {
            return Err(AskError::InvalidInput(format!("Invalid vote index: {}", index)));
        }
    }

    // Add vote to survey only if it's not empty
    if vote_req.vote.is_empty() {
        return Err(AskError::InvalidInput("Cannot submit empty vote.".into()));
    }

    // Matrix-only voter name validation
    match survey.content.survey_type {
        SurveyType::MatrixChoice => {
            let name = vote_req.voter.as_ref().ok_or_else(|| {
                AskError::InvalidInput(
                    "Voter name is required for matrix surveys.".into()
                )
            })?;

            if name.trim().is_empty() {
                return Err(AskError::InvalidInput(
                    "Voter name cannot be empty.".into()
                ));
            }

            if name.len() > MAX_VOTER_LEN {
                return Err(AskError::InvalidInput
                    ("Voter name too long.".into()
                ));
            }

            if survey.votes.iter().any(|v| {
                v.voter
                    .as_ref()
                    .map(|existing| existing.trim().to_lowercase() == name.to_lowercase().trim())
                    .unwrap_or(false)
            }) {
                return Err(AskError::InvalidInput(
                    "Voter name has already been used.".into(),
                ));
            }
        }
        _ => {
            if vote_req.voter.is_some() {
                return Err(AskError::InvalidInput(
                    "Voter name is only allowed for matrix surveys.".into(),
                ));
            }
        }
    }

    // Add vote to survey
    let stored_vote = StoredVote {
        vote: vote_req.vote,
        voter: vote_req.voter,
    };

    let survey = state.ask.add_vote(&id, stored_vote).await?;

    // Respond
    Ok(Json(success_response(&survey)))
}
