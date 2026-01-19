-- Add reset_code columns to users table for password reset functionality
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_attempts INTEGER DEFAULT 0;
