-- Add bio and date_of_birth columns to users table for profile settings
-- Run: psql -f migrations/032_user_profile_fields.sql

-- Add bio column for user biography/description
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add date_of_birth column
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add index for date_of_birth (useful for age verification queries)
CREATE INDEX IF NOT EXISTS idx_users_date_of_birth ON users(date_of_birth);
