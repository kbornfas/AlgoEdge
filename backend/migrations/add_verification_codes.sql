-- Add verification code columns to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS verification_code_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(verification_code);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Add comment
COMMENT ON COLUMN users.verification_code IS '6-digit verification code for email/SMS verification';
COMMENT ON COLUMN users.verification_code_expires IS 'Expiration timestamp for verification code (10 minutes)';
COMMENT ON COLUMN users.verification_code_attempts IS 'Number of failed verification attempts (max 5)';
COMMENT ON COLUMN users.phone IS 'User phone number for SMS verification';
