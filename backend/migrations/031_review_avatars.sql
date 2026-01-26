-- Migration: Add reviewer display name and avatar to review tables
-- This allows showing reviews with consistent display names and avatars even if users don't have profile pictures

-- Bot reviews
ALTER TABLE marketplace_bot_reviews 
ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS reviewer_avatar VARCHAR(500);

-- Product reviews
ALTER TABLE marketplace_product_reviews 
ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS reviewer_avatar VARCHAR(500);

-- Signal provider reviews
ALTER TABLE signal_provider_reviews 
ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS reviewer_avatar VARCHAR(500);
