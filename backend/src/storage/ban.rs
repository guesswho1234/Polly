use async_trait::async_trait;

#[async_trait]
pub trait BanStore: Send + Sync {
    async fn is_banned(&self, ip: &str) -> Result<bool, Box<dyn std::error::Error + Send>>;
    async fn set_temp_ban(&self, ip: &str, until: i64, strikes: u32) -> Result<(), Box<dyn std::error::Error + Send>>;
    async fn set_permanent_ban(&self, ip: &str, strikes: u32) -> Result<(), Box<dyn std::error::Error + Send>>;
    async fn cleanup_expired(&self) -> Result<(), Box<dyn std::error::Error + Send>>;
    async fn all_ips_with_strikes(&self) -> Result<Vec<(String, u32)>, Box<dyn std::error::Error + Send>>;
}
