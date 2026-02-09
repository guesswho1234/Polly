use std::sync::Arc;
use tokio::{
    sync::Mutex,
    time::{interval, Duration},
};
use rand::RngCore;
use tracing::{info, warn};

use crate::rate_limit::{GlobalRateLimiter, SharedGlobalRateLimiter, IPRateLimiter, SharedIPRateLimiter};
use crate::abuse::{AbuseTracker, SharedAbuseTracker, BAN_LEVELS, PERMANENT_BAN_AFTER};
use crate::storage::{PasteStore, EventStore, SurveyStore};
use crate::storage::memory::{MemoryPasteStore, MemoryEventStore, MemorySurveyStore};
use crate::storage::sqlite::SqliteStorage;
use crate::storage::ban::BanStore;

pub const CLEANUP_INTERVAL: Duration = Duration::from_secs(60 * 10); // every 10 minutes

#[derive(Clone)]
pub struct AppState {
    pub bin: Arc<dyn PasteStore>,
    pub cal: Arc<dyn EventStore>,
    pub ask: Arc<dyn SurveyStore>,
    pub pow_secret: [u8; 32],
    pub global_rate_limiter: SharedGlobalRateLimiter,
    pub ip_rate_limiter: SharedIPRateLimiter,
    pub abuse_tracker: SharedAbuseTracker,
    pub ban_store: Option<Arc<dyn BanStore>>,
}

impl Default for AppState {
    fn default() -> Self {
        let mut secret = [0u8; 32];
        rand::thread_rng().fill_bytes(&mut secret);

        Self {
            bin: Arc::new(MemoryPasteStore::new()),
            cal: Arc::new(MemoryEventStore::new()),
            ask: Arc::new(MemorySurveyStore::new()),
            pow_secret: secret,
            global_rate_limiter: Arc::new(Mutex::new(
                GlobalRateLimiter::new()
            )),
            ip_rate_limiter: Arc::new(Mutex::new(
                IPRateLimiter::new()
            )),
            abuse_tracker: Arc::new(Mutex::new(
                AbuseTracker::new()
            )),
            ban_store: None,
        }
    }
}

impl AppState {
    pub async fn new(
        use_sqlite: bool,
        sqlite_path: Option<&str>,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        let mut secret = [0u8; 32];
        rand::thread_rng().fill_bytes(&mut secret);

        let bin: Arc<dyn PasteStore>;
        let cal: Arc<dyn EventStore>;
        let ask: Arc<dyn SurveyStore>;
        let ban_store: Option<Arc<dyn BanStore>>;

        if use_sqlite {
            let path = sqlite_path.unwrap_or("polly.sqlite");

            let storage = Arc::new(SqliteStorage::new(path)?);

            bin = storage.clone();
            cal = storage.clone();
            ask = storage.clone();
            ban_store = Some(storage.clone());
        } else {
            bin = Arc::new(MemoryPasteStore::new());
            cal = Arc::new(MemoryEventStore::new());
            ask = Arc::new(MemorySurveyStore::new());
            ban_store = None;
        }

        Ok(Self {
            bin,
            cal,
            ask,
            pow_secret: secret,
            global_rate_limiter: Arc::new(Mutex::new(GlobalRateLimiter::new())),
            ip_rate_limiter: Arc::new(Mutex::new(IPRateLimiter::new())),
            abuse_tracker: Arc::new(Mutex::new(AbuseTracker::new())),
            ban_store,
        })
    }

    pub async fn check_ban(&self, ip: &str) -> Result<bool, Box<dyn std::error::Error + Send>> {
        // check persistent ban
        if let Some(ban_store) = &self.ban_store {
            if ban_store.is_banned(ip).await? {
                return Ok(true);
            }
        }
    
        // fallback: check in-memory AbuseTracker
        let now = std::time::Instant::now();
        let mut tracker = self.abuse_tracker.lock().await;
        Ok(tracker.is_banned(ip, now))
    }
    
    pub async fn register_strike(&self, ip: &str) -> Result<bool, Box<dyn std::error::Error + Send>> {
        let now = std::time::Instant::now();
    
        // in-memory tracking
        let mut tracker = self.abuse_tracker.lock().await;
        let (_strikes, banned_in_memory) = tracker.register_strike(ip, now);

        if let Some(ban_store) = &self.ban_store {
            if banned_in_memory {
                if _strikes >= PERMANENT_BAN_AFTER {
                    ban_store.set_permanent_ban(ip, _strikes).await?;
                } else {
                    for (threshold, duration) in BAN_LEVELS {
                        if _strikes == *threshold {
                            let until = chrono::Utc::now().timestamp() + duration.as_secs() as i64;
                            ban_store.set_temp_ban(ip, until, _strikes).await?;
                        }
                    }
                }
            } else {
                ban_store.set_temp_ban(ip, 0, _strikes).await.ok(); // 0 = not banned yet
            }
        }
    
        Ok(banned_in_memory)
    }
}

pub fn spawn_restore_strikes_task(state: AppState) {
    tokio::spawn(async move {
        if let Some(ban_store) = &state.ban_store {
            match ban_store.all_ips_with_strikes().await {
                Ok(ips) => {
                    let mut tracker = state.abuse_tracker.lock().await;
                    for (ip, strikes) in ips {
                        tracker.set_strikes(&ip, strikes);
                    }
                    tracing::info!("Restored strikes from persistent store");
                }
                Err(e) => {
                    tracing::warn!("Failed to restore strikes: {}", e);
                }
            }
        }
    });
}

pub fn spawn_cleanup_task(state: AppState) {
    tokio::spawn(async move {
        let mut ticker = interval(CLEANUP_INTERVAL);

        loop {
            ticker.tick().await;

            info!("Running periodic cleanup task");

            if let Err(e) = state.bin.cleanup_expired().await {
                warn!("Paste cleanup failed: {}", e);
            }

            if let Err(e) = state.cal.cleanup_expired().await {
                warn!("Event cleanup failed: {}", e);
            }

            if let Err(e) = state.ask.cleanup_expired().await {
                warn!("Survey cleanup failed: {}", e);
            }

            if let Err(e) = state.ask.cleanup_loose_votes().await {
                warn!("Survey votes cleanup failed: {}", e);
            }

            if let Some(ban_store) = &state.ban_store {
                if let Err(e) = ban_store.cleanup_expired().await {
                    warn!("Ban cleanup failed: {}", e);
                }
            }
        }
    });
}
