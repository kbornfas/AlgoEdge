-- ============================================================================
-- AlgoEdge Product Delivery System
-- Migration 017: Enhanced product delivery, downloads, and seller price management
-- ============================================================================

-- ============================================================================
-- 1. PRODUCT DELIVERABLES TABLE
-- Tracks what buyers actually receive when they purchase
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_deliverables (
    id SERIAL PRIMARY KEY,
    
    -- Links to the product (one of these will be set)
    bot_id INTEGER REFERENCES marketplace_bots(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES marketplace_products(id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES signal_providers(id) ON DELETE CASCADE,
    
    -- Deliverable type
    deliverable_type VARCHAR(50) NOT NULL, 
    -- Types: 'download_file', 'license_key', 'course_access', 'telegram_invite', 
    -- 'discord_invite', 'api_key', 'setup_guide', 'video_tutorial', 'indicator_file',
    -- 'ea_file', 'source_code', 'support_access', 'community_access'
    
    -- Deliverable details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- For downloadable files
    file_url TEXT, -- Encrypted storage URL
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    file_type VARCHAR(50), -- pdf, zip, ex5, mq5, mp4, etc.
    
    -- For links/invites
    access_url TEXT,
    invite_code VARCHAR(255),
    
    -- For API keys
    api_endpoint TEXT,
    
    -- Access control
    requires_license BOOLEAN DEFAULT FALSE,
    max_downloads INTEGER, -- NULL = unlimited
    access_duration_days INTEGER, -- NULL = lifetime
    
    -- Order for display
    display_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one product type is set
    CONSTRAINT check_single_product CHECK (
        (bot_id IS NOT NULL)::int + 
        (product_id IS NOT NULL)::int + 
        (provider_id IS NOT NULL)::int = 1
    )
);

-- ============================================================================
-- 2. USER PRODUCT ACCESS TABLE
-- Tracks what users have access to after purchase
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_product_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- What they purchased
    bot_purchase_id INTEGER REFERENCES marketplace_bot_purchases(id) ON DELETE CASCADE,
    product_purchase_id INTEGER REFERENCES marketplace_product_purchases(id) ON DELETE CASCADE,
    signal_subscription_id INTEGER REFERENCES signal_subscriptions(id) ON DELETE CASCADE,
    
    -- Access details
    access_type VARCHAR(50) NOT NULL, -- 'lifetime', 'subscription', 'time_limited'
    access_granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_expires_at TIMESTAMP, -- NULL for lifetime
    
    -- License info
    license_key VARCHAR(100),
    license_type VARCHAR(50), -- 'single', 'multi_account', 'enterprise'
    max_activations INTEGER DEFAULT 1,
    current_activations INTEGER DEFAULT 0,
    
    -- Download tracking
    total_downloads INTEGER DEFAULT 0,
    last_download_at TIMESTAMP,
    download_limit INTEGER, -- NULL = unlimited
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'revoked', 'suspended'
    revoked_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one purchase type is set
    CONSTRAINT check_single_purchase CHECK (
        (bot_purchase_id IS NOT NULL)::int + 
        (product_purchase_id IS NOT NULL)::int + 
        (signal_subscription_id IS NOT NULL)::int = 1
    )
);

-- ============================================================================
-- 3. DOWNLOAD LOGS TABLE
-- Track every download for security and analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS download_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deliverable_id INTEGER NOT NULL REFERENCES product_deliverables(id) ON DELETE CASCADE,
    access_id INTEGER REFERENCES user_product_access(id),
    
    -- Download details
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    
    -- Security tracking
    ip_address INET,
    user_agent TEXT,
    download_token VARCHAR(255), -- Unique token for this download
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed', -- 'initiated', 'completed', 'failed', 'expired'
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. PRICE HISTORY TABLE
-- Track all price changes for transparency
-- ============================================================================

CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    
    -- Product reference
    bot_id INTEGER REFERENCES marketplace_bots(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES marketplace_products(id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES signal_providers(id) ON DELETE CASCADE,
    
    -- Price change details
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2) NOT NULL,
    old_price_type VARCHAR(20),
    new_price_type VARCHAR(20),
    
    -- Who made the change
    changed_by INTEGER NOT NULL REFERENCES users(id),
    change_reason TEXT,
    
    -- For promotions/sales
    is_promotional BOOLEAN DEFAULT FALSE,
    promotion_name VARCHAR(100),
    promotion_ends_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_single_product_price CHECK (
        (bot_id IS NOT NULL)::int + 
        (product_id IS NOT NULL)::int + 
        (provider_id IS NOT NULL)::int = 1
    )
);

-- ============================================================================
-- 5. ADD ENHANCED DELIVERY COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add delivery-related columns to marketplace_bots
ALTER TABLE marketplace_bots ADD COLUMN IF NOT EXISTS 
    setup_instructions TEXT;
ALTER TABLE marketplace_bots ADD COLUMN IF NOT EXISTS 
    installation_guide_url TEXT;
ALTER TABLE marketplace_bots ADD COLUMN IF NOT EXISTS 
    documentation_url TEXT;
ALTER TABLE marketplace_bots ADD COLUMN IF NOT EXISTS 
    support_email VARCHAR(255);
ALTER TABLE marketplace_bots ADD COLUMN IF NOT EXISTS 
    support_telegram VARCHAR(100);
ALTER TABLE marketplace_bots ADD COLUMN IF NOT EXISTS 
    includes_source_code BOOLEAN DEFAULT FALSE;
ALTER TABLE marketplace_bots ADD COLUMN IF NOT EXISTS 
    license_type VARCHAR(50) DEFAULT 'single'; -- single, multi, unlimited
ALTER TABLE marketplace_bots ADD COLUMN IF NOT EXISTS 
    max_accounts INTEGER DEFAULT 1;
ALTER TABLE marketplace_bots ADD COLUMN IF NOT EXISTS 
    updates_included BOOLEAN DEFAULT TRUE;
ALTER TABLE marketplace_bots ADD COLUMN IF NOT EXISTS 
    update_period_months INTEGER; -- NULL = lifetime updates
ALTER TABLE marketplace_bots ADD COLUMN IF NOT EXISTS
    whop_product_id VARCHAR(255); -- Whop product ID for payment integration
ALTER TABLE marketplace_bots ADD COLUMN IF NOT EXISTS
    whop_price_id VARCHAR(255); -- Whop price ID

-- Add delivery-related columns to marketplace_products  
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS 
    instant_delivery BOOLEAN DEFAULT TRUE;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS 
    delivery_instructions TEXT;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS 
    support_email VARCHAR(255);
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS 
    support_included_days INTEGER; -- 0 = no support, NULL = lifetime
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS 
    refund_period_days INTEGER DEFAULT 30;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS
    whop_product_id VARCHAR(255);
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS
    whop_price_id VARCHAR(255);

-- Add to signal_providers
ALTER TABLE signal_providers ADD COLUMN IF NOT EXISTS 
    signal_delivery_method VARCHAR(50)[] DEFAULT ARRAY['telegram']; -- telegram, discord, email, webhook, app
ALTER TABLE signal_providers ADD COLUMN IF NOT EXISTS 
    telegram_invite_link TEXT;
ALTER TABLE signal_providers ADD COLUMN IF NOT EXISTS 
    discord_invite_link TEXT;
ALTER TABLE signal_providers ADD COLUMN IF NOT EXISTS 
    webhook_url_template TEXT;
ALTER TABLE signal_providers ADD COLUMN IF NOT EXISTS 
    signals_per_day_avg DECIMAL(5,2);
ALTER TABLE signal_providers ADD COLUMN IF NOT EXISTS 
    analysis_included BOOLEAN DEFAULT TRUE;
ALTER TABLE signal_providers ADD COLUMN IF NOT EXISTS 
    educational_content BOOLEAN DEFAULT FALSE;
ALTER TABLE signal_providers ADD COLUMN IF NOT EXISTS
    whop_product_id VARCHAR(255);
ALTER TABLE signal_providers ADD COLUMN IF NOT EXISTS
    whop_price_id VARCHAR(255);

-- ============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_deliverables_bot ON product_deliverables(bot_id) WHERE bot_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deliverables_product ON product_deliverables(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deliverables_provider ON product_deliverables(provider_id) WHERE provider_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_access_user ON user_product_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_status ON user_product_access(status);
CREATE INDEX IF NOT EXISTS idx_user_access_expires ON user_product_access(access_expires_at) WHERE access_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_download_logs_user ON download_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_deliverable ON download_logs(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_created ON download_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_price_history_bot ON price_history(bot_id) WHERE bot_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_price_history_provider ON price_history(provider_id) WHERE provider_id IS NOT NULL;

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has valid access to a product
CREATE OR REPLACE FUNCTION check_user_product_access(
    p_user_id INTEGER,
    p_bot_id INTEGER DEFAULT NULL,
    p_product_id INTEGER DEFAULT NULL,
    p_provider_id INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_product_access upa
        LEFT JOIN marketplace_bot_purchases mbp ON upa.bot_purchase_id = mbp.id
        LEFT JOIN marketplace_product_purchases mpp ON upa.product_purchase_id = mpp.id
        LEFT JOIN signal_subscriptions ss ON upa.signal_subscription_id = ss.id
        WHERE upa.user_id = p_user_id
        AND upa.status = 'active'
        AND (upa.access_expires_at IS NULL OR upa.access_expires_at > NOW())
        AND (
            (p_bot_id IS NOT NULL AND mbp.bot_id = p_bot_id) OR
            (p_product_id IS NOT NULL AND mpp.product_id = p_product_id) OR
            (p_provider_id IS NOT NULL AND ss.provider_id = p_provider_id)
        )
    ) INTO has_access;
    
    RETURN has_access;
END;
$$ LANGUAGE plpgsql;

-- Function to record a price change
CREATE OR REPLACE FUNCTION record_price_change() RETURNS TRIGGER AS $$
BEGIN
    -- For bots
    IF TG_TABLE_NAME = 'marketplace_bots' AND (OLD.price IS DISTINCT FROM NEW.price OR OLD.price_type IS DISTINCT FROM NEW.price_type) THEN
        INSERT INTO price_history (bot_id, old_price, new_price, old_price_type, new_price_type, changed_by)
        VALUES (NEW.id, OLD.price, NEW.price, OLD.price_type, NEW.price_type, NEW.seller_id);
    END IF;
    
    -- For products
    IF TG_TABLE_NAME = 'marketplace_products' AND OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO price_history (product_id, old_price, new_price, changed_by)
        VALUES (NEW.id, OLD.price, NEW.price, NEW.seller_id);
    END IF;
    
    -- For signal providers
    IF TG_TABLE_NAME = 'signal_providers' AND OLD.monthly_price IS DISTINCT FROM NEW.monthly_price THEN
        INSERT INTO price_history (provider_id, old_price, new_price, changed_by)
        VALUES (NEW.id, OLD.monthly_price, NEW.monthly_price, NEW.user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for price tracking
DROP TRIGGER IF EXISTS track_bot_price_changes ON marketplace_bots;
CREATE TRIGGER track_bot_price_changes
    AFTER UPDATE ON marketplace_bots
    FOR EACH ROW
    EXECUTE FUNCTION record_price_change();

DROP TRIGGER IF EXISTS track_product_price_changes ON marketplace_products;
CREATE TRIGGER track_product_price_changes
    AFTER UPDATE ON marketplace_products
    FOR EACH ROW
    EXECUTE FUNCTION record_price_change();

DROP TRIGGER IF EXISTS track_provider_price_changes ON signal_providers;
CREATE TRIGGER track_provider_price_changes
    AFTER UPDATE ON signal_providers
    FOR EACH ROW
    EXECUTE FUNCTION record_price_change();

-- ============================================================================
-- 8. INSERT SAMPLE DELIVERABLES FOR OFFICIAL PRODUCTS
-- ============================================================================

-- Note: Run after seeding official products
-- This would be populated by the seed script or when sellers list products

COMMENT ON TABLE product_deliverables IS 'Tracks what buyers actually receive when they purchase a product';
COMMENT ON TABLE user_product_access IS 'Tracks user access rights to purchased products';
COMMENT ON TABLE download_logs IS 'Security and analytics log for all downloads';
COMMENT ON TABLE price_history IS 'Audit trail of all price changes for transparency';
