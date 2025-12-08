-- Migration: Create ip_whitelist table
CREATE TABLE IF NOT EXISTS ip_whitelist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_user_ip ON ip_whitelist(user_id, ip_address);