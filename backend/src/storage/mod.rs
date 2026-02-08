use async_trait::async_trait;
use crate::bin::{Paste, BinError};
use crate::cal::{Event, CalError};
use crate::ask::{Survey, StoredVote, AskError};

pub mod memory;
pub mod sqlite;
pub mod ban;

#[async_trait]
pub trait PasteStore: Send + Sync {
    async fn create_paste(&self, paste: Paste) -> Result<(), BinError>;
    async fn get_paste(&self, id: &str) -> Result<Paste, BinError>;
    async fn consume_paste(&self, id: &str) -> Result<Paste, BinError>;
    async fn cleanup_expired(&self) -> Result<(), Box<dyn std::error::Error + Send>>;
}

#[async_trait]
pub trait EventStore: Send + Sync {
    async fn create_event(&self, event: Event) -> Result<(), CalError>;
    async fn get_event(&self, id: &str) -> Result<Event, CalError>;
    async fn consume_event(&self, id: &str) -> Result<Event, CalError>;
    async fn cleanup_expired(&self) -> Result<(), Box<dyn std::error::Error + Send>>;
}

#[async_trait]
pub trait SurveyStore: Send + Sync {
    async fn create_survey(&self, survey: Survey) -> Result<(), AskError>;
    async fn get_survey(&self, id: &str) -> Result<Survey, AskError>;
    async fn add_vote(&self, id: &str, vote: StoredVote) -> Result<Survey, AskError>;
    async fn cleanup_expired(&self) -> Result<(), Box<dyn std::error::Error + Send>>;
    async fn cleanup_loose_votes(&self) -> Result<(), Box<dyn std::error::Error + Send>>;
}
