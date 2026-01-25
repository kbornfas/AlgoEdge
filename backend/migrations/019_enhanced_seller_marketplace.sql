-- Migration 019: Enhanced Seller Marketplace with Checkout Links
-- Removes free tiers, adds checkout link system, enhances seller dashboard

-- ============================================================================
-- 1. ADD CHECKOUT LINK TO ALL PRODUCT TABLES
-- ============================================================================

-- Add checkout_url to marketplace_products
ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS checkout_url TEXT,
ADD COLUMN IF NOT EXISTS checkout_provider VARCHAR(50) DEFAULT 'stripe', -- stripe, gumroad, whop, paypal
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS seller_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);

-- Add checkout_url to marketplace_bots
ALTER TABLE marketplace_bots 
ADD COLUMN IF NOT EXISTS checkout_url TEXT,
ADD COLUMN IF NOT EXISTS checkout_provider VARCHAR(50) DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS seller_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);

-- Add checkout_url to signal_providers
ALTER TABLE signal_providers 
ADD COLUMN IF NOT EXISTS checkout_url TEXT,
ADD COLUMN IF NOT EXISTS checkout_provider VARCHAR(50) DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS seller_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);

-- ============================================================================
-- 2. ENHANCE SELLER WALLETS
-- ============================================================================

-- Ensure seller_wallets has all necessary columns
ALTER TABLE seller_wallets
ADD COLUMN IF NOT EXISTS payout_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS payout_method VARCHAR(50) DEFAULT 'bank_transfer', -- bank_transfer, paypal, crypto
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_routing_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS paypal_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS crypto_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS crypto_network VARCHAR(50),
ADD COLUMN IF NOT EXISTS minimum_payout DECIMAL(10,2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_payout_at TIMESTAMP;

-- ============================================================================
-- 3. CREATE SELLER PAYOUT REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_payout_requests (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id INTEGER REFERENCES seller_wallets(id),
    
    -- Request Details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payout_method VARCHAR(50) NOT NULL,
    
    -- Bank/Payment Details (snapshot at time of request)
    payout_details JSONB NOT NULL,
    
    -- Processing
    status VARCHAR(30) DEFAULT 'pending', -- pending, processing, completed, rejected
    processed_at TIMESTAMP,
    processed_by INTEGER REFERENCES users(id),
    
    -- Transaction Reference
    transaction_reference VARCHAR(255),
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. CREATE SELLER COMMISSION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_commissions (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Sale Reference
    sale_type VARCHAR(50) NOT NULL, -- bot, product, signal
    sale_id INTEGER NOT NULL,
    purchase_id INTEGER,
    
    -- Amounts
    sale_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    seller_earnings DECIMAL(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(30) DEFAULT 'pending', -- pending, cleared, paid_out
    cleared_at TIMESTAMP, -- When commission becomes available for withdrawal
    paid_out_at TIMESTAMP,
    payout_id INTEGER, -- Will be set when paid out
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. REMOVE FREE TIER FROM SIGNAL SUBSCRIPTIONS
-- ============================================================================

-- Update existing free tier to basic with minimum price
UPDATE signal_tiers 
SET name = 'Starter', 
    slug = 'starter',
    price = 9.00,
    description = 'Get started with essential trading signals',
    features = '["5 signals per day", "10-minute delay", "Entry + SL/TP", "Email support"]',
    max_signals_per_day = 5,
    signal_delay_minutes = 10,
    includes_sl_tp = TRUE
WHERE slug = 'free';

-- Update sort orders
UPDATE signal_tiers SET sort_order = 1 WHERE slug = 'starter';
UPDATE signal_tiers SET sort_order = 2 WHERE slug = 'basic';
UPDATE signal_tiers SET sort_order = 3 WHERE slug = 'premium';
UPDATE signal_tiers SET sort_order = 4 WHERE slug = 'vip';

-- ============================================================================
-- 6. CREATE TELEGRAM CHANNEL ACCESS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS telegram_channel_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    telegram_chat_id VARCHAR(100),
    telegram_username VARCHAR(100),
    channel_type VARCHAR(50) DEFAULT 'free', -- free, signals, vip
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id)
);

-- ============================================================================
-- 7. CREATE LISTING SUBMISSION LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS listing_submissions (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_type VARCHAR(50) NOT NULL, -- bot, product, signal
    listing_id INTEGER NOT NULL,
    
    -- Seller's Preferred Details
    preferred_name VARCHAR(255) NOT NULL,
    preferred_description TEXT NOT NULL,
    preferred_price DECIMAL(10,2),
    seller_notes TEXT,
    
    -- Admin Processing
    status VARCHAR(30) DEFAULT 'pending', -- pending, under_review, approved, rejected
    reviewed_by INTEGER REFERENCES users(id),
    checkout_url_assigned TEXT,
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    
    UNIQUE(listing_type, listing_id)
);

-- ============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payout_requests_seller ON seller_payout_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON seller_payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_seller_commissions_seller ON seller_commissions(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_commissions_status ON seller_commissions(status);
CREATE INDEX IF NOT EXISTS idx_listing_submissions_seller ON listing_submissions(seller_id);
CREATE INDEX IF NOT EXISTS idx_listing_submissions_status ON listing_submissions(status);
CREATE INDEX IF NOT EXISTS idx_telegram_channel_members_user ON telegram_channel_members(user_id);

-- ============================================================================
-- 9. UPDATE COMMISSION RATE CONFIGURATION
-- ============================================================================

-- Platform takes 20% commission by default (Admin: 20%, Seller: 80%)
-- This can be stored in a settings table or env variable
-- seller_earnings = sale_amount * (1 - 0.20)
