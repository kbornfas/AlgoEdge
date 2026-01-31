-- Migration 036: Add seller display name for custom trading aliases
-- ============================================================================

-- Add seller_display_name column to users table
-- This allows sellers to use their trading alias/brand name instead of their email-derived username
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_display_name VARCHAR(100);

-- Add to seller_applications table for approval workflow
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

-- Comment explaining the field
COMMENT ON COLUMN users.seller_display_name IS 'Optional custom display name for sellers (e.g. trading alias). If not set, username is used.';
COMMENT ON COLUMN seller_applications.display_name IS 'Optional preferred display name submitted by seller applicant.';
