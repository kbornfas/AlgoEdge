-- Migration: Add whop_user_id to users table
-- This allows auto-creating users when they pay via Whop without registering first

ALTER TABLE users ADD COLUMN IF NOT EXISTS whop_user_id VARCHAR(255);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_whop_user_id ON users(whop_user_id);
