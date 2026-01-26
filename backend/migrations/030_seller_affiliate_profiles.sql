-- Migration 030: Seller and Affiliate Profiles with Public Links
-- ============================================================================

-- Add seller-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_slug VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_tagline VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_website VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_telegram VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_twitter VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_instagram VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_youtube VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_discord VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_experience_years INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_specialties TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_trading_style VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_joined_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_total_sales INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_total_revenue DECIMAL(12,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_rating_average DECIMAL(3,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_rating_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_banner_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_featured BOOLEAN DEFAULT FALSE;

-- Add affiliate-related columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_affiliate BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_slug VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_joined_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_total_earnings DECIMAL(12,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_total_referrals INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_payout_method VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_payout_details JSONB;

-- Create indexes for public profile lookups
CREATE INDEX IF NOT EXISTS idx_users_seller_slug ON users(seller_slug) WHERE seller_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_affiliate_slug ON users(affiliate_slug) WHERE affiliate_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_seller ON users(is_seller) WHERE is_seller = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_is_affiliate ON users(is_affiliate) WHERE is_affiliate = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_has_blue_badge ON users(has_blue_badge) WHERE has_blue_badge = TRUE;

-- Create seller applications table for becoming a seller
CREATE TABLE IF NOT EXISTS seller_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    country VARCHAR(100),
    bio TEXT NOT NULL,
    tagline VARCHAR(255),
    experience_years INTEGER DEFAULT 0,
    trading_style VARCHAR(50),
    specialties TEXT[],
    website VARCHAR(255),
    telegram VARCHAR(100),
    twitter VARCHAR(100),
    instagram VARCHAR(100),
    youtube VARCHAR(255),
    discord VARCHAR(100),
    portfolio_links TEXT[],
    sample_work_urls TEXT[],
    why_join TEXT,
    terms_accepted BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create affiliate applications table
CREATE TABLE IF NOT EXISTS affiliate_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    country VARCHAR(100),
    promotion_methods TEXT[],
    website VARCHAR(255),
    social_media JSONB,
    audience_size VARCHAR(50),
    why_join TEXT,
    terms_accepted BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Add product slug uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_bots_slug_unique ON marketplace_bots(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_products_slug_unique ON marketplace_products(slug);

-- Update existing sellers (users with seller_wallets) to be marked as sellers
UPDATE users SET is_seller = TRUE, seller_joined_at = NOW()
WHERE id IN (SELECT DISTINCT user_id FROM seller_wallets);

-- Generate seller slugs for existing sellers
UPDATE users 
SET seller_slug = LOWER(REPLACE(COALESCE(username, 'seller-' || id), ' ', '-'))
WHERE is_seller = TRUE AND seller_slug IS NULL;

-- Update existing affiliates (users with referral_code) to be marked as affiliates
UPDATE users SET is_affiliate = TRUE, affiliate_joined_at = NOW()
WHERE referral_code IS NOT NULL AND referral_code != '';

-- Generate affiliate slugs for existing affiliates
UPDATE users 
SET affiliate_slug = LOWER(REPLACE(COALESCE(username, 'affiliate-' || id), ' ', '-'))
WHERE is_affiliate = TRUE AND affiliate_slug IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_seller_applications_user ON seller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON seller_applications(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_user ON affiliate_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_status ON affiliate_applications(status);
