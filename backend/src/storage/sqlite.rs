use std::sync::{Arc, Mutex};
use std::time::UNIX_EPOCH;
use rusqlite::params;
use async_trait::async_trait;

use crate::bin::{Paste, BinError};
use crate::cal::{Event, EventContent, CalError};
use crate::ask::{Survey, SurveyContent, StoredVote, AskError};
use crate::storage::PasteStore;
use crate::storage::EventStore;
use crate::storage::SurveyStore;
use crate::storage::ban::BanStore;

pub struct SqliteStorage {
    conn: Arc<Mutex<rusqlite::Connection>>,
}

impl SqliteStorage {
    pub fn new(path: &str) -> Result<Self, rusqlite::Error> {
        let conn = rusqlite::Connection::open(path)?;

        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS pastes (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                password_hash TEXT,
                expiry INTEGER NOT NULL,
                uses INTEGER NOT NULL,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                password_hash TEXT,
                expiry INTEGER NOT NULL,
                uses INTEGER NOT NULL,
                created_system INTEGER NOT NULL,
                created_utc INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS surveys (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                password_hash TEXT,
                expiry INTEGER NOT NULL,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS survey_votes (
                survey_id TEXT NOT NULL,
                vote TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS bans (
                ip TEXT PRIMARY KEY,
                banned_until INTEGER, -- unix timestamp, NULL = no temp ban
                permanent INTEGER NOT NULL, -- 0 or 1
                strikes INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_bans_banned_until ON bans(banned_until);
            "#
        )?;

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }
}

#[async_trait]
impl PasteStore for SqliteStorage {
    async fn create_paste(&self, paste: Paste) -> Result<(), BinError> {
        let paste = paste.clone();
        let conn = self.conn.clone();

        tokio::task::spawn_blocking(move || {
            let created_at = paste.created_at
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|_| BinError::InvalidInput("Invalid timestamp".into()))?
                .as_secs() as i64;

            let conn = conn
                .lock()
                .map_err(|_| BinError::Internal("database mutex poisoned".into()))?;

            conn.execute(
                r#"
                INSERT INTO pastes (id, content, password_hash, expiry, uses, created_at)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                "#,
                (
                    paste.id,
                    paste.content,
                    paste.password_hash,
                    paste.expiry as i64,
                    paste.uses as i64,
                    created_at,
                ),
            )?;

            Ok::<(), BinError>(())
        })
        .await
        .map_err(|e| BinError::InvalidInput(e.to_string()))?
    }

    async fn get_paste(&self, id: &str) -> Result<Paste, BinError> {
        let id = id.to_owned();
        let conn = self.conn.clone();

        tokio::task::spawn_blocking(move || {
            let conn = conn
                .lock()
                .map_err(|_| BinError::Internal("database mutex poisoned".into()))?;

            let mut stmt = conn.prepare(
                r#"
                SELECT id, content, password_hash, expiry, uses, created_at
                FROM pastes WHERE id = ?1
                "#
            )?;

            let paste = stmt.query_row([&id], |row| {
                Ok(Paste {
                    id: row.get(0)?,
                    content: row.get(1)?,
                    password_hash: row.get(2)?,
                    expiry: row.get::<_, i64>(3)? as u32,
                    uses: row.get::<_, i64>(4)? as u32,
                    created_at: std::time::UNIX_EPOCH
                        + std::time::Duration::from_secs(row.get::<_, i64>(5)? as u64),
                })
            }).map_err(|_| BinError::NotFound)?;

            Ok::<Paste, BinError>(paste)
        })
        .await
        .map_err(|e| BinError::InvalidInput(e.to_string()))?
    }

    async fn consume_paste(&self, id: &str) -> Result<Paste, BinError> {
        let id = id.to_owned();
        let conn = self.conn.clone();

        tokio::task::spawn_blocking(move || {
            let mut conn = conn.lock().unwrap();
            let tx = conn.transaction()?;

            let mut paste: Paste = tx.query_row(
                "SELECT id, content, password_hash, expiry, uses, created_at FROM pastes WHERE id = ?1",
                [&id],
                |row| {
                    Ok(Paste {
                        id: row.get(0)?,
                        content: row.get(1)?,
                        password_hash: row.get(2)?,
                        expiry: row.get::<_, i64>(3)? as u32,
                        uses: row.get::<_, i64>(4)? as u32,
                        created_at: std::time::UNIX_EPOCH
                            + std::time::Duration::from_secs(row.get::<_, i64>(5)? as u64),
                    })
                },
            ).map_err(|_| BinError::NotFound)?;

            if paste.uses > 0 {
                paste.uses -= 1;
            }

            if paste.uses == 0 {
                tx.execute("DELETE FROM pastes WHERE id = ?1", [&id])?;
            } else {
                tx.execute(
                    "UPDATE pastes SET uses = ?1 WHERE id = ?2",
                    (paste.uses as i64, &id),
                )?;
            }

            tx.commit()?;
            Ok::<Paste, BinError>(paste)
        })
        .await
        .map_err(|e| BinError::InvalidInput(e.to_string()))?
    }

    async fn cleanup_expired(&self) -> Result<(), Box<dyn std::error::Error + Send>> {
        let conn_clone = self.conn.clone();

        tokio::task::spawn_blocking(move || {
            let conn = conn_clone.lock().unwrap();
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs() as i64)
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?;
        
            conn.execute("DELETE FROM pastes WHERE (created_at + expiry * 3600) < ?1", params![now])
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?;
        
            Ok::<(), Box<dyn std::error::Error + Send>>(())
        })
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)??;
    
        Ok(())
    }
}

#[async_trait]
impl EventStore for SqliteStorage {
    async fn create_event(&self, event: Event) -> Result<(), CalError> {
        let conn = self.conn.clone();

        tokio::task::spawn_blocking(move || {
            let content = serde_json::to_string(&event.content)
                .map_err(|e| CalError::InvalidInput(e.to_string()))?;

            let created_system = event.created_system
                .duration_since(UNIX_EPOCH)
                .map_err(|_| CalError::InvalidInput("Invalid timestamp".into()))?
                .as_secs() as i64;

            let created_utc = event.created_utc.timestamp();

            let conn = conn
                .lock()
                .map_err(|_| CalError::Internal("database mutex poisoned".into()))?;

            conn.execute(
                r#"
                INSERT INTO events
                (id, content, password_hash, expiry, uses, created_system, created_utc)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
                "#,
                params![
                    event.id,
                    content,
                    event.password_hash,
                    event.expiry as i64,
                    event.uses as i64,
                    created_system,
                    created_utc
                ],
            )?;

            Ok::<(), CalError>(())
        })
        .await
        .map_err(|e| CalError::InvalidInput(e.to_string()))?
    }

    async fn get_event(&self, id: &str) -> Result<Event, CalError> {
        let id = id.to_owned();
        let conn = self.conn.clone();

        tokio::task::spawn_blocking(move || {
            let conn = conn
                .lock()
                .map_err(|_| CalError::Internal("database mutex poisoned".into()))?;

            conn.query_row(
                r#"
                SELECT id, content, password_hash, expiry, uses, created_system, created_utc
                FROM events WHERE id = ?1
                "#,
                [&id],
                |row| {
                    let content: String = row.get(1)?;
                    let content: EventContent = serde_json::from_str(&content)
                        .map_err(|_| rusqlite::Error::InvalidQuery)?;
                    let created_utc_ts: i64 = row.get(6)?;
                    let created_utc = chrono::DateTime::<chrono::Utc>::from_timestamp(created_utc_ts, 0)
                        .ok_or(rusqlite::Error::InvalidQuery)?;

                    Ok(Event {
                        id: row.get(0)?,
                        content,
                        password_hash: row.get(2)?,
                        expiry: row.get::<_, i64>(3)? as u32,
                        uses: row.get::<_, i64>(4)? as u32,
                        created_system: UNIX_EPOCH + std::time::Duration::from_secs(row.get::<_, i64>(5)? as u64),
                        created_utc,
                    })
                },
            )
            .map_err(|_| CalError::NotFound)
        })
        .await
        .map_err(|e| CalError::InvalidInput(e.to_string()))?
    }

    async fn consume_event(&self, id: &str) -> Result<Event, CalError> {
        let id = id.to_owned();
        let conn = self.conn.clone();

        tokio::task::spawn_blocking(move || {
            let mut conn = conn.lock().unwrap();
            let tx = conn.transaction()?;

            let mut event: Event = tx.query_row(
                "SELECT id, content, password_hash, expiry, uses, created_system, created_utc FROM events WHERE id = ?1",
                [&id],
                |row| {
                    let content: String = row.get(1)?;
                    let content: EventContent = serde_json::from_str(&content)
                        .map_err(|_| rusqlite::Error::InvalidQuery)?;
                    let created_utc_ts: i64 = row.get(6)?;
                    let created_utc = chrono::DateTime::<chrono::Utc>::from_timestamp(created_utc_ts, 0)
                        .ok_or(rusqlite::Error::InvalidQuery)?;

                    Ok(Event {
                        id: row.get(0)?,
                        content,
                        password_hash: row.get(2)?,
                        expiry: row.get::<_, i64>(3)? as u32,
                        uses: row.get::<_, i64>(4)? as u32,
                        created_system: UNIX_EPOCH + std::time::Duration::from_secs(row.get::<_, i64>(5)? as u64),
                        created_utc,
                    })
                },
            ).map_err(|_| CalError::NotFound)?;

            if event.uses > 0 {
                event.uses -= 1;
            }

            if event.uses == 0 {
                tx.execute("DELETE FROM events WHERE id = ?1", [&id])?;
            } else {
                tx.execute("UPDATE events SET uses = ?1 WHERE id = ?2", params![event.uses as i64, &id])?;
            }

            tx.commit()?;
            Ok::<Event, CalError>(event)
        })
        .await
        .map_err(|e| CalError::InvalidInput(e.to_string()))?
    }

    async fn cleanup_expired(&self) -> Result<(), Box<dyn std::error::Error + Send>> {
        let conn_clone = self.conn.clone();

        tokio::task::spawn_blocking(move || {
            let conn = conn_clone.lock().unwrap();
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs() as i64)
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?;
        
            conn.execute("DELETE FROM events WHERE (created_system + expiry * 3600) < ?1", params![now])
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?;
        
            Ok::<(), Box<dyn std::error::Error + Send>>(())
        })
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)??;
    
        Ok(())
    }
}

#[async_trait]
impl SurveyStore for SqliteStorage {
    async fn create_survey(&self, survey: Survey) -> Result<(), AskError> {
        let conn = self.conn.clone();

        tokio::task::spawn_blocking(move || {
            let content = serde_json::to_string(&survey.content)
                .map_err(|e| AskError::InvalidInput(e.to_string()))?;

            let created_at = survey.created_at
                .duration_since(UNIX_EPOCH)
                .map_err(|_| AskError::InvalidInput("Invalid timestamp".into()))?
                .as_secs() as i64;

            let conn = conn
                .lock()
                .map_err(|_| AskError::Internal("database mutex poisoned".into()))?;
            
            conn.execute(
                r#"
                INSERT INTO surveys (id, content, password_hash, expiry, created_at)
                VALUES (?1, ?2, ?3, ?4, ?5)
                "#,
                params![
                    survey.id,
                    content,
                    survey.password_hash,
                    survey.expiry as i64,
                    created_at
                ],
            )?;

            Ok::<(), AskError>(())
        })
        .await
        .map_err(|e| AskError::InvalidInput(e.to_string()))?
    }

    async fn get_survey(&self, id: &str) -> Result<Survey, AskError> {
        let id = id.to_owned();
        let conn = self.conn.clone();

        tokio::task::spawn_blocking(move || {
            let conn = conn
                .lock()
                .map_err(|_| AskError::Internal("database mutex poisoned".into()))?;

            let survey = conn.query_row(
                "SELECT id, content, password_hash, expiry, created_at FROM surveys WHERE id = ?1",
                [&id],
                |row| {
                    let content: String = row.get(1)?;
                    let content: SurveyContent = serde_json::from_str(&content)
                        .map_err(|_| rusqlite::Error::InvalidQuery)?;

                    Ok(Survey {
                        id: row.get(0)?,
                        content,
                        password_hash: row.get(2)?,
                        expiry: row.get::<_, i64>(3)? as u32,
                        created_at: UNIX_EPOCH + std::time::Duration::from_secs(row.get::<_, i64>(4)? as u64),
                        votes: Vec::new(),
                    })
                },
            ).map_err(|_| AskError::NotFound)?;

            let mut stmt = conn.prepare("SELECT vote FROM survey_votes WHERE survey_id = ?1")?;
            let votes = stmt.query_map([&id], |row| {
                let vote: String = row.get(0)?;
                serde_json::from_str::<StoredVote>(&vote)
                    .map_err(|_| rusqlite::Error::InvalidQuery)
            })?;

            let mut survey = survey;
            survey.votes = votes.collect::<Result<Vec<_>, _>>()?;

            Ok::<Survey, AskError>(survey)
        })
        .await
        .map_err(|e| AskError::InvalidInput(e.to_string()))?
    }

    async fn add_vote(&self, id: &str, vote: StoredVote) -> Result<Survey, AskError> {
        let id = id.to_owned();
        let id_for_closure = id.clone();
        let conn = self.conn.clone();

        let _ = tokio::task::spawn_blocking(move || {
            let vote_json = serde_json::to_string(&vote)
                .map_err(|e| AskError::InvalidInput(e.to_string()))?;

            let conn = conn
                .lock()
                .map_err(|_| AskError::Internal("database mutex poisoned".into()))?;

            conn.execute(
                "INSERT INTO survey_votes (survey_id, vote) VALUES (?1, ?2)",
                params![&id, vote_json],
            )?;

            Ok::<(), AskError>(())
        })
        .await
        .map_err(|e| AskError::InvalidInput(e.to_string()))?;

        self.get_survey(&id_for_closure).await
    }

    async fn cleanup_expired(&self) -> Result<(), Box<dyn std::error::Error + Send>> {
        let conn_clone = self.conn.clone();
    
        tokio::task::spawn_blocking(move || {
            let conn = conn_clone.lock().unwrap();
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs() as i64)
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?;
        
            conn.execute("DELETE FROM surveys WHERE (created_at + expiry * 3600) < ?1", params![now])
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?;
        
            Ok::<(), Box<dyn std::error::Error + Send>>(())
        })
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)??;
     
        Ok(())
    }

    async fn cleanup_loose_votes(&self) -> Result<(), Box<dyn std::error::Error + Send>> {
        let conn_clone = self.conn.clone();
    
        tokio::task::spawn_blocking(move || {
            let conn = conn_clone.lock().unwrap();
            conn.execute("DELETE FROM survey_votes 
                WHERE survey_id IN (
                    SELECT sv.survey_id
                    FROM survey_votes sv
                    LEFT JOIN surveys s ON sv.survey_id = s.id
                    WHERE s.id IS NULL
                )", [])
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?;
        
            Ok::<(), Box<dyn std::error::Error + Send>>(())
        })
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)??;
     
        Ok(())
    }
}

#[async_trait]
impl BanStore for SqliteStorage {
    async fn is_banned(&self, ip: &str) -> Result<bool, Box<dyn std::error::Error + Send>> {
        let ip = ip.to_string();
        let conn = self.conn.clone();

        tokio::task::spawn_blocking(move || {
            let conn = conn.lock().unwrap();
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?
                .as_secs() as i64;

            let mut stmt = conn.prepare(
                r#"
                SELECT permanent, banned_until
                FROM bans
                WHERE ip = ?1
                "#
            ).map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?;

            let result: rusqlite::Result<(i64, Option<i64>)> =
                stmt.query_row([&ip], |row| {
                    Ok((row.get(0)?, row.get(1)?))
                });

            match result {
                Ok((permanent, banned_until)) => Ok(
                    permanent == 1 ||
                    banned_until.map(|u| u > now).unwrap_or(false)
                ),
                Err(rusqlite::Error::QueryReturnedNoRows) => Ok(false),
                Err(e) => Err(Box::new(e) as Box<dyn std::error::Error + Send>),
            }
        })
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?
    }

    async fn set_temp_ban(&self, ip: &str, until: i64, strikes: u32) -> Result<(), Box<dyn std::error::Error + Send>> {
        let ip = ip.to_string();
        let conn = self.conn.clone();

        tokio::task::spawn_blocking(move || {
            let conn = conn.lock().unwrap();
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?
                .as_secs() as i64;

            conn.execute(
                r#"
                INSERT INTO bans (ip, banned_until, permanent, strikes, created_at)
                VALUES (?1, ?2, 0, ?3, ?4)
                ON CONFLICT(ip) DO UPDATE SET
                    banned_until = excluded.banned_until,
                    permanent = 0,
                    strikes = excluded.strikes
                "#,
                params![ip, until, strikes as i64, now],
            )
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?;
        
            Ok::<(), Box<dyn std::error::Error + Send>>(())
        })
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)??;

        Ok(())
    }

    async fn set_permanent_ban(&self, ip: &str, strikes: u32) -> Result<(), Box<dyn std::error::Error + Send>> {
        let ip = ip.to_string();
        let conn = self.conn.clone();

        tokio::task::spawn_blocking(move || {
            let conn = conn.lock().unwrap();
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?
                .as_secs() as i64;

            conn.execute(
                r#"
                INSERT INTO bans (ip, banned_until, permanent, strikes, created_at)
                VALUES (?1, NULL, 1, ?2, ?3)
                ON CONFLICT(ip) DO UPDATE SET
                    permanent = 1,
                    banned_until = NULL,
                    strikes = excluded.strikes
                "#,
                params![ip, strikes as i64, now],
            )
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?;
        
            Ok::<(), Box<dyn std::error::Error + Send>>(())
        })
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)??;

        Ok(())
    }

    async fn all_ips_with_strikes(&self) -> Result<Vec<(String, u32)>, Box<dyn std::error::Error + Send>> {
        let conn = self.conn.clone();
    
        tokio::task::spawn_blocking(move || {
            let conn = conn.lock().unwrap();
    
            let mut stmt = conn
                .prepare("SELECT ip, strikes FROM bans")
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?;
    
            // query_map closure must only return rusqlite::Error
            let rows = stmt.query_map([], |row| {
                // map errors manually
                let ip: String = row.get(0)?;
                let strikes: i64 = row.get(1)?;
                Ok((ip, strikes as u32))
            });
    
            // Handle query_map error manually
            let rows = match rows {
                Ok(r) => r,
                Err(e) => return Err(Box::new(e) as Box<dyn std::error::Error + Send>),
            };
    
            // Collect into Vec and map row errors to Box<dyn Error>
            let mut ips = Vec::new();
            for row_result in rows {
                match row_result {
                    Ok((ip, strikes)) => ips.push((ip, strikes)),
                    Err(e) => return Err(Box::new(e) as Box<dyn std::error::Error + Send>),
                }
            }
    
            Ok::<Vec<(String, u32)>, Box<dyn std::error::Error + Send>>(ips)
        })
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?
    }

    async fn cleanup_expired(&self) -> Result<(), Box<dyn std::error::Error + Send>> {
        let conn = self.conn.clone();

        tokio::task::spawn_blocking(move || {
            let conn = conn.lock().unwrap();
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?
                .as_secs() as i64;

            conn.execute(
                "UPDATE bans SET banned_until = 0 WHERE permanent = 0 AND banned_until <= ?1",
                params![now],
            )
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)?;
        
            Ok::<(), Box<dyn std::error::Error + Send>>(())
        })
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send>)??;

        Ok(())
    }
}
