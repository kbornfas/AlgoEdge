-- Seller verification columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_pending BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add profile_image to signal_providers
ALTER TABLE signal_providers ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Ensure seller_transactions has the right columns
ALTER TABLE seller_transactions ADD COLUMN IF NOT EXISTS description TEXT;

-- Index for quick lookup of pending verifications
CREATE INDEX IF NOT EXISTS idx_users_verification_pending ON users(verification_pending) WHERE verification_pending = TRUE;
