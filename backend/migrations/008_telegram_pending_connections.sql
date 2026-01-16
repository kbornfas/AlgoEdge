-- Migration: Add Telegram pending connections table
-- This table stores temporary tokens for Telegram account linking

CREATE TABLE IF NOT EXISTS telegram_pending_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add telegram_username column to user_settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_telegram_pending_token ON telegram_pending_connections(token);

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_telegram_pending_expires ON telegram_pending_connections(expires_at);

-- Comment
COMMENT ON TABLE telegram_pending_connections IS 'Temporary tokens for linking Telegram accounts';
