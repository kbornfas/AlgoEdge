-- Migration: Add Google authentication fields
-- Date: 2026-01-05

-- Add Google ID column for OAuth users
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

-- Add profile picture column for Google users
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Make password_hash optional (for Google users who don't have passwords)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add index for faster Google ID lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
