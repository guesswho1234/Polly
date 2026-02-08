use std::collections::HashMap;
use tokio::sync::RwLock;
use async_trait::async_trait;
use crate::bin::{Paste, BinError};
use crate::cal::{Event, CalError};
use crate::ask::{Survey, StoredVote, AskError};
use crate::storage::PasteStore;
use crate::storage::EventStore;
use crate::storage::SurveyStore;

pub struct MemoryPasteStore {
    pastes: RwLock<HashMap<String, Paste>>,
}

pub struct MemoryEventStore {
    events: RwLock<HashMap<String, Event>>,
}

pub struct MemorySurveyStore {
    surveys: RwLock<HashMap<String, Survey>>,
}

impl MemoryPasteStore {
    pub fn new() -> Self {
        Self {
            pastes: RwLock::new(HashMap::new()),
        }
    }
}

impl MemoryEventStore {
    pub fn new() -> Self {
        Self {
            events: RwLock::new(HashMap::new()),
        }
    }
}

impl MemorySurveyStore {
    pub fn new() -> Self {
        Self {
            surveys: RwLock::new(HashMap::new()),
        }
    }
}

#[async_trait]
impl PasteStore for MemoryPasteStore {
    async fn create_paste(&self, paste: Paste) -> Result<(), BinError> {
        let mut pastes = self.pastes.write().await;
        pastes.insert(paste.id.clone(), paste);
        Ok(())
    }

    async fn get_paste(&self, id: &str) -> Result<Paste, BinError> {
        let pastes = self.pastes.read().await;
        pastes.get(id).cloned().ok_or(BinError::NotFound)
    }

    async fn consume_paste(&self, id: &str) -> Result<Paste, BinError> {
        let mut pastes = self.pastes.write().await;

        let mut paste = pastes.remove(id).ok_or(BinError::NotFound)?;

        if paste.uses > 0 {
            paste.uses -= 1;
        }

        let exhausted = paste.uses == 0;

        if !exhausted {
            pastes.insert(id.to_string(), paste.clone());
        }

        Ok(paste)
    } 

    async fn cleanup_expired(&self) -> Result<(), Box<dyn std::error::Error + Send>> {
        Ok(())
    }
}

#[async_trait]
impl EventStore for MemoryEventStore {
    async fn create_event(&self, event: Event) -> Result<(), CalError> {
        let mut events = self.events.write().await;
        events.insert(event.id.clone(), event);
        Ok(())
    }

    async fn get_event(&self, id: &str) -> Result<Event, CalError> {
        let events = self.events.read().await;
        events.get(id).cloned().ok_or(CalError::NotFound)
    }

    async fn consume_event(&self, id: &str) -> Result<Event, CalError> {
        let mut events = self.events.write().await;

        let mut event = events.remove(id).ok_or(CalError::NotFound)?;

        if event.uses > 0 {
            event.uses -= 1;
        }

        let exhausted = event.uses == 0;

        if !exhausted {
            events.insert(id.to_string(), event.clone());
        }

        Ok(event)
    }

    async fn cleanup_expired(&self) -> Result<(), Box<dyn std::error::Error + Send>> {
        Ok(())
    }
}

#[async_trait]
impl SurveyStore for MemorySurveyStore {
    async fn create_survey(&self, survey: Survey) -> Result<(), AskError> {
        let mut surveys = self.surveys.write().await;
        surveys.insert(survey.id.clone(), survey);
        Ok(())
    }

    async fn get_survey(&self, id: &str) -> Result<Survey, AskError> {
        let surveys = self.surveys.read().await;
        surveys.get(id).cloned().ok_or(AskError::NotFound)
    }

    async fn add_vote(&self, id: &str, vote: StoredVote) -> Result<Survey, AskError> {
        let mut surveys = self.surveys.write().await;
    
        let updated = {
            let survey = surveys.get_mut(id).ok_or(AskError::NotFound)?;
            survey.votes.push(vote);
            survey.clone()
        };
    
        Ok(updated)
    }

    async fn cleanup_expired(&self) -> Result<(), Box<dyn std::error::Error + Send>> {
        Ok(())
    }

    async fn cleanup_loose_votes(&self) -> Result<(), Box<dyn std::error::Error + Send>> {
        Ok(())
    }
}
