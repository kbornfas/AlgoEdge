-- Migration: Enhance seller media table with additional columns
-- Adds thumbnail support and visibility control

-- Add missing columns to seller_media if they don't exist
ALTER TABLE seller_media ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE seller_media ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE seller_media ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

-- If url column exists but media_url doesn't have data, copy from url to media_url
UPDATE seller_media SET media_url = url WHERE media_url IS NULL AND url IS NOT NULL;

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_seller_media_user ON seller_media(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_media_type ON seller_media(user_id, media_type);
CREATE INDEX IF NOT EXISTS idx_seller_media_featured ON seller_media(user_id, is_featured) WHERE is_featured = TRUE;

-- Add profile_video_url to users table for seller intro video
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_video_url TEXT;

-- Add banner_image_url for seller profile banner
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
