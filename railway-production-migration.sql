-- AlgoEdge Production Database Migration
-- Run this on Railway PostgreSQL database
-- Date: 2026-01-16

-- =============================================
-- ADD MISSING COLUMNS TO USERS TABLE
-- =============================================

-- Google OAuth fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Password reset fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP;

-- Admin and approval workflow fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_activated BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Payment fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS activated_by INTEGER;

-- Make password_hash nullable for Google OAuth users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_is_activated ON users(is_activated);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_users_payment_status ON users(payment_status);

-- =============================================
-- UPDATE EXISTING USERS TO BE ACTIVATED
-- (So existing users can still log in)
-- =============================================
UPDATE users 
SET is_activated = true, 
    approval_status = 'approved',
    payment_status = 'approved'
WHERE is_activated IS NULL OR is_activated = false;

-- =============================================
-- TELEGRAM PENDING CONNECTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS telegram_pending_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_pending_token ON telegram_pending_connections(token);
CREATE INDEX IF NOT EXISTS idx_telegram_pending_expires ON telegram_pending_connections(expires_at);

-- Add telegram_username to user_settings if not exists
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100);
