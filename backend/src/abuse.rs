use std::{
    collections::HashMap,
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::sync::Mutex;
use tracing::{info, warn};

/*
 * --- Configuration ---
 */

pub const STRIKE_WINDOW: Duration = Duration::from_secs(60);
pub const BAN_LEVELS: &[(u32, Duration)] = &[
    (5,  Duration::from_secs(10 * 60)),        // 10 minutes
    (10, Duration::from_secs(24 * 60 * 60)),   // 24 hours
];
pub const PERMANENT_BAN_AFTER: u32 = 20;

/*
 * --- Abuse tracker states ---
 */

#[derive(Debug)]
pub struct AbuseEntry {
    pub strikes: u32,
    pub last_violation: Instant,
    pub banned_until: Option<Instant>,
    pub permanent: bool,
}

pub struct AbuseTracker {
    pub entries: HashMap<String, AbuseEntry>,
}

impl AbuseTracker {
    pub fn new() -> Self {
        Self {
            entries: HashMap::new(),
        }
    }
}

impl AbuseTracker {
    fn cleanup_ban(entry: &mut AbuseEntry, now: Instant) -> bool {
        if entry.permanent {
            return true;
        }
    
        if let Some(until) = entry.banned_until {
            if now < until {
                return true;
            } else {
                entry.banned_until = None;
            }
        }
    
        false
    }

    pub fn set_strikes(&mut self, ip: &str, strikes: u32) {
        let entry = self.entries.entry(ip.to_string())
            .or_insert(AbuseEntry {
                strikes: 0,
                last_violation: Instant::now(),
                banned_until: None,
                permanent: false,
            });
        entry.strikes = strikes;
    }
}

impl AbuseTracker {
    pub fn is_banned(&mut self, ip: &str, now: Instant) -> bool {
        if let Some(entry) = self.entries.get_mut(ip) {
            return Self::cleanup_ban(entry, now);
        }
        false
    }
}

impl AbuseTracker {
    pub fn register_strike(&mut self, ip: &str, now: Instant) -> (u32, bool) {
        let entry = self.entries.entry(ip.to_string()).or_insert(
            AbuseEntry {
                strikes: 0,
                last_violation: now,
                banned_until: None,
                permanent: false,
            }
        );

        // If already banned, do nothing
        if Self::cleanup_ban(entry, now) {
            return (entry.strikes, true);
        }

        // Decay strike burst window (but not total strikes)
        if now.duration_since(entry.last_violation) > STRIKE_WINDOW {
            entry.last_violation = now;
        }

        entry.strikes += 1;
        entry.last_violation = now;


        // Permanent ban
        if entry.strikes >= PERMANENT_BAN_AFTER {
            entry.permanent = true;

            warn!(
                ip = %ip,
                strikes = entry.strikes,
                "IP permanently banned due to repeated rate limit violations"
            );

            return (entry.strikes, true);
        }

        // Escalating temporary bans
        for (threshold, duration) in BAN_LEVELS {
            if entry.strikes == *threshold {
                entry.banned_until = Some(now + *duration);

                warn!(
                    ip = %ip,
                    strikes = entry.strikes,
                    duration = ?duration,
                    "IP temporarily banned due to repeated rate limit violations"
                );

                return (entry.strikes, true);
            }
        }

        info!(ip = %ip, strikes = entry.strikes, "IP strike registered");

        (entry.strikes, false)
    }
}

pub type SharedAbuseTracker = Arc<Mutex<AbuseTracker>>;
