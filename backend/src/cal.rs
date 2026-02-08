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
use chrono::{NaiveDate, NaiveTime, TimeZone, DateTime, Utc};
use chrono_tz::Tz;

use crate::state::AppState;

/*
 * --- Limits ---
 */

const MAX_TITLE_LEN: usize = 255;
const MAX_LOCATION_LEN: usize = 255;
const MAX_DESCRIPTION_LEN: usize = 4096;
const MAX_PASSWORD_LENGTH: usize = 256;

/*
 * --- Data Types ---
 */

#[derive(Clone, Serialize)]
pub struct Event {
    pub id: String,
    pub content: EventContent,
    pub password_hash: Option<String>,
    pub expiry: u32,
    pub uses: u32,
    pub created_system: SystemTime,
    pub created_utc: DateTime<Utc>,
}


#[derive(Deserialize)]
pub struct NewEvent {
    pub title: String,
    pub location: Option<String>,
    pub from: String,
    pub to: String,
    pub start: String,
    pub end: String,
    pub timezone: String,
    pub description: Option<String>,
    #[serde(default)]
    pub password: String,
    pub expiry: u32,
    pub uses: u32,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct EventContent {
    pub title: String,
    pub location: Option<String>,
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
    pub timezone: String,
    pub description: Option<String>,
}

#[derive(Serialize)]
pub struct CreateEventResponse {
    pub status: EventStatus,
    pub id: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct EventData {
    pub id: String,
    pub content: Option<EventContent>,
    pub ics: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "lowercase")] 
pub enum EventStatus {
    Success,
    Protected,
    // Error, // never used
}

#[derive(Serialize)]
pub struct EventResponse {
    pub status: EventStatus,
    pub data: Option<EventData>,
    pub message: String,
}

#[derive(Debug)]
pub enum CalError {
    Internal(String),
    InvalidInput(String),
    InvalidDate,
    InvalidTime,
    InvalidTimezone,
    InvalidDateTime,
    InvalidDateRange,
    PasswordHashError(String),
    NotFound,
    Expired,
}

/*
 * --- Trait implementations ---
 */

impl IntoResponse for CalError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            CalError::Internal(e) =>
                (StatusCode::INTERNAL_SERVER_ERROR, e),
            CalError::InvalidInput(e) =>
                (StatusCode::BAD_REQUEST, e),
            CalError::InvalidDate => 
                (StatusCode::BAD_REQUEST, "Invalid date format".into()),
            CalError::InvalidTime => 
                (StatusCode::BAD_REQUEST, "Invalid time format".into()),
            CalError::InvalidTimezone => 
                (StatusCode::BAD_REQUEST, "Invalid timezone".into()),
            CalError::InvalidDateTime => 
                (StatusCode::BAD_REQUEST, "Invalid date/time combination".into()),
            CalError::InvalidDateRange => 
                (StatusCode::BAD_REQUEST, "End date must be after start date".into()),
            CalError::PasswordHashError(e) => 
                (StatusCode::INTERNAL_SERVER_ERROR, e),
            CalError::NotFound => 
                (StatusCode::NOT_FOUND, "Event not found".into()),
            CalError::Expired => 
                (StatusCode::GONE, "Event expired".into()),
        };

        let body = Json(json!({
            "status": "error",
            "message": message,
        }));

        (status, body).into_response()
    }
}

impl From<rusqlite::Error> for CalError {
    fn from(err: rusqlite::Error) -> Self {
        CalError::Internal(err.to_string())
    }
}

impl EventContent {
    pub fn to_ics_string(&self, uid: &str, dtstamp: DateTime<Utc>) -> String {
        let dtstart = self.start.format("%Y%m%dT%H%M%SZ").to_string();
        let dtend = self.end.format("%Y%m%dT%H%M%SZ").to_string();
        let dtstamp = dtstamp.format("%Y%m%dT%H%M%SZ").to_string();
        let description = self.description.as_deref().unwrap_or("");

        format!(
            "BEGIN:VCALENDAR\r\n\
             VERSION:2.0\r\n\
             PRODID:-//Polly//Cal//EN\r\n\
             BEGIN:VEVENT\r\n\
             UID:{uid}\r\n\
             DTSTAMP:{dtstamp}\r\n\
             DTSTART:{dtstart}\r\n\
             DTEND:{dtend}\r\n\
             SUMMARY:{summary}\r\n\
             DESCRIPTION:{description}\r\n\
             END:VEVENT\r\n\
             END:VCALENDAR",
            uid = uid,
            dtstamp = dtstamp,
            dtstart = dtstart,
            dtend = dtend,
            summary = self.title,
            description = description
        )
    }
}

/*
 * --- Helper Functions ---
 */

fn verify_password(event: &Event, auth: &Option<TypedHeader<Authorization<Basic>>>) -> Result<(), PasswordError> {
    if let Some(stored_hash) = &event.password_hash {
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

fn success_response(event: &Event) -> EventResponse {
    EventResponse {
        status: EventStatus::Success,
        data: Some(EventData {
            id: event.id.clone(),
            content: Some(event.content.clone()),
            ics: Some(event.content.to_ics_string(&event.id, event.created_utc)),
        }),
        message: "Event retrieved successfully.".into(),
    }
}

fn protected_response(message: &str) -> EventResponse {
    EventResponse {
        status: EventStatus::Protected,
        data: None,
        message: message.into(),
    }
}

fn is_expired(event: &Event) -> bool {
    if let Ok(elapsed) = event.created_system.elapsed() {
        elapsed > Duration::from_secs(event.expiry as u64 * 3600)
    } else {
        true // treat weird timestamps as expired
    }
}

/*
 * --- Handlers ---
 */

// Redirect /cal to /cal.html
pub async fn cal_html() -> impl IntoResponse {
    Redirect::to("/cal.html")
}

// Create new event 
pub async fn create_event(
    State(state): State<AppState>,
    Json(new_event): Json<NewEvent>,
) -> Result<Json<CreateEventResponse>, CalError>{
    let id = Uuid::new_v4().to_string();

    // Sanitize and validate settings values 
    if new_event.expiry == 0 || new_event.expiry > 9999 {
        return Err(CalError::InvalidInput("Invalid expiry value".into()));
    }
    
    if new_event.uses == 0 || new_event.uses > 9999 {
        return Err(CalError::InvalidInput("Invalid uses value".into()));
    }

    // Sanitize and validate title, location and description
    let title = new_event.title.trim().to_string();
    if title.is_empty() {
        return Err(CalError::InvalidInput("Title cannot be empty".into()));
    }

    if title.len() > MAX_TITLE_LEN {
        return Err(CalError::InvalidInput(format!("Title too long (max {} chars)", MAX_TITLE_LEN)));
    }

    let location = new_event.location
    .unwrap_or_default()
    .trim()
    .to_string();

    if location.len() > MAX_LOCATION_LEN {
        return Err(CalError::InvalidInput(format!("Location too long (max {} chars)", MAX_LOCATION_LEN)));
    }

    let description = new_event.description
    .unwrap_or_default()
    .trim()
    .to_string();

    if description.len() > MAX_DESCRIPTION_LEN {
        return Err(CalError::InvalidInput(format!("Description too long (max {} chars)", MAX_DESCRIPTION_LEN)));
    }

    // Sanitize and validate dates and times
    let date_from = NaiveDate::parse_from_str(&new_event.from, "%Y-%m-%d")
    .map_err(|_| CalError::InvalidDate)?;

    let date_to = NaiveDate::parse_from_str(&new_event.to, "%Y-%m-%d")
    .map_err(|_| CalError::InvalidDate)?;

    let time_start = NaiveTime::parse_from_str(&new_event.start, "%H:%M")
    .map_err(|_| CalError::InvalidTime)?;

    let time_end = NaiveTime::parse_from_str(&new_event.end, "%H:%M")
    .map_err(|_| CalError::InvalidTime)?;

    // Combine dates + times
    let start_naive = date_from.and_time(time_start);
    let end_naive = date_to.and_time(time_end);

    // Sanitize and validate timezone
    let tz_str = new_event.timezone.trim();
    let tz: Tz = if tz_str.trim().is_empty() {
        chrono_tz::UTC
    } else {
        tz_str
            .parse()
            .map_err(|_| CalError::InvalidTimezone)?
    };

    // Convert to UTC
    let start_dt: DateTime<Utc> = tz
        .from_local_datetime(&start_naive)
        .single()
        .ok_or(CalError::InvalidDateTime)?
        .with_timezone(&Utc);

    let end_dt: DateTime<Utc> = tz
        .from_local_datetime(&end_naive)
        .single()
        .ok_or(CalError::InvalidDateTime)?
        .with_timezone(&Utc);

    if end_dt <= start_dt {
        return Err(CalError::InvalidDateRange);
    }

    // Validate password length
    if new_event.password.len() > MAX_PASSWORD_LENGTH {
        return Err(CalError::InvalidInput("Password too long".into()));
    }

    // Create password hash if a password was set
    let password_hash = if !new_event.password.is_empty() {
        let mut rng = OsRng;
        let salt = SaltString::generate(&mut rng);
        let argon2 = Argon2::default();
        let hash = argon2
            .hash_password(new_event.password.as_bytes(), &salt)
            .map_err(|e| CalError::PasswordHashError(e.to_string()))?
            .to_string();
        Some(hash)
    } else {
        None
    };
    
    // Build content
    let event_content = EventContent {
        title,
        location: Some(location),
        start: start_dt,
        end: end_dt,
        timezone: tz_str.to_string(),
        description: Some(description),
    };

    // Create proper event
    let event = Event {
        id: id.clone(),
        content: event_content,
        password_hash,
        expiry: new_event.expiry,
        uses: new_event.uses,
        created_system: SystemTime::now(),
        created_utc: Utc::now(),
    };

    state.cal.create_event(event).await?;

    // Return the event id to the frontend
    Ok(Json(CreateEventResponse {
        status: EventStatus::Success,
        id,
        message: "Event created successfully.".into(),
    }))
}

// Retrieve existing event
pub async fn get_event(
    Path(id): Path<String>,
    State(state): State<AppState>,
    auth: Option<TypedHeader<Authorization<Basic>>>,
) -> Result<Json<EventResponse>, CalError> {
    let preview = state.cal.get_event(&id).await?;
    
    // Expiry check 
    if is_expired(&preview) {
        return Err(CalError::Expired);
    }

    // Password check 
    match verify_password(&preview, &auth) {
        Ok(()) => {
            let consumed = state.cal.consume_event(&id).await?;
            Ok(Json(success_response(&consumed)))
        }
        Err(PasswordError::Missing) => {
            Ok(Json(protected_response("This event is password protected.")))
        }
        Err(PasswordError::Incorrect) => {
            Ok(Json(protected_response("Incorrect password.")))
        }
    }
}
