-- ============================================================================
-- AlgoEdge Marketplace Database Schema
-- Migration 015: Bot Marketplace, Signal Marketplace, Digital Products, API Access
-- ============================================================================

-- ============================================================================
-- 1. BOT MARKETPLACE
-- ============================================================================

-- Trading bots available for sale/subscription
CREATE TABLE IF NOT EXISTS marketplace_bots (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Bot Information
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    short_description VARCHAR(255),
    
    -- Bot Files & Configuration
    bot_file_url TEXT, -- Encrypted storage URL for MT5/MT4 EA file
    bot_version VARCHAR(20) DEFAULT '1.0.0',
    supported_platforms VARCHAR(50)[] DEFAULT ARRAY['MT5'], -- MT4, MT5, cTrader
    supported_pairs VARCHAR(20)[] DEFAULT ARRAY['XAUUSD'],
    recommended_timeframes VARCHAR(10)[] DEFAULT ARRAY['H1'],
    minimum_balance DECIMAL(10,2) DEFAULT 100.00,
    
    -- Performance Metrics (verified by platform)
    total_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    profit_factor DECIMAL(5,2) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    monthly_return DECIMAL(5,2) DEFAULT 0,
    verified_performance BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP,
    
    -- Pricing
    price_type VARCHAR(20) DEFAULT 'one_time', -- one_time, subscription, free
    price DECIMAL(10,2) DEFAULT 0,
    subscription_period VARCHAR(20), -- monthly, quarterly, yearly
    trial_days INTEGER DEFAULT 0,
    
    -- Media
    thumbnail_url TEXT,
    screenshots TEXT[], -- Array of image URLs
    demo_video_url TEXT,
    
    -- Category & Tags
    category VARCHAR(50) DEFAULT 'general', -- scalping, swing, news, grid, martingale, hedge
    tags VARCHAR(50)[],
    
    -- Stats
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    active_subscriptions INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, suspended
    rejection_reason TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id)
);

-- Bot purchases/subscriptions
CREATE TABLE IF NOT EXISTS marketplace_bot_purchases (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL REFERENCES marketplace_bots(id) ON DELETE CASCADE,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Purchase Details
    purchase_type VARCHAR(20) NOT NULL, -- one_time, subscription
    price_paid DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Commission
    platform_commission DECIMAL(10,2) NOT NULL,
    seller_earnings DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    
    -- Subscription Details
    subscription_status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired
    subscription_start TIMESTAMP,
    subscription_end TIMESTAMP,
    auto_renew BOOLEAN DEFAULT TRUE,
    
    -- Download/Access
    download_count INTEGER DEFAULT 0,
    last_download_at TIMESTAMP,
    license_key VARCHAR(100),
    
    -- Payment
    payment_provider VARCHAR(30) DEFAULT 'whop',
    payment_reference VARCHAR(255),
    payment_status VARCHAR(20) DEFAULT 'completed',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(bot_id, buyer_id)
);

-- Bot reviews
CREATE TABLE IF NOT EXISTS marketplace_bot_reviews (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL REFERENCES marketplace_bots(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purchase_id INTEGER REFERENCES marketplace_bot_purchases(id),
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(100),
    review TEXT,
    
    -- Verified purchase
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    
    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'published', -- published, hidden, flagged
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(bot_id, user_id)
);

-- ============================================================================
-- 2. SIGNAL MARKETPLACE
-- ============================================================================

-- Signal providers (users who sell signals)
CREATE TABLE IF NOT EXISTS signal_providers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Provider Info
    display_name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    
    -- Trading Style
    trading_style VARCHAR(50), -- scalping, day_trading, swing, position
    main_instruments VARCHAR(20)[], -- XAUUSD, EURUSD, etc.
    risk_level VARCHAR(20) DEFAULT 'moderate', -- conservative, moderate, aggressive
    
    -- Verified Performance
    total_signals INTEGER DEFAULT 0,
    winning_signals INTEGER DEFAULT 0,
    losing_signals INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    average_pips DECIMAL(8,2) DEFAULT 0,
    total_pips DECIMAL(12,2) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(5,2) DEFAULT 0,
    verified_since TIMESTAMP,
    
    -- Subscription
    is_free BOOLEAN DEFAULT FALSE,
    monthly_price DECIMAL(10,2) DEFAULT 0,
    quarterly_price DECIMAL(10,2) DEFAULT 0,
    yearly_price DECIMAL(10,2) DEFAULT 0,
    trial_days INTEGER DEFAULT 0,
    
    -- Stats
    subscriber_count INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, suspended
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Social
    telegram_channel VARCHAR(100),
    twitter_handle VARCHAR(100),
    website_url TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Signal subscriptions
CREATE TABLE IF NOT EXISTS signal_subscriptions (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES signal_providers(id) ON DELETE CASCADE,
    subscriber_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Subscription Details
    plan_type VARCHAR(20) NOT NULL, -- monthly, quarterly, yearly, lifetime
    price_paid DECIMAL(10,2) NOT NULL,
    
    -- Commission
    platform_commission DECIMAL(10,2) NOT NULL,
    provider_earnings DECIMAL(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired, paused
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT TRUE,
    
    -- Payment
    payment_provider VARCHAR(30) DEFAULT 'whop',
    payment_reference VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(provider_id, subscriber_id)
);

-- Signals sent by providers
CREATE TABLE IF NOT EXISTS marketplace_signals (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES signal_providers(id) ON DELETE CASCADE,
    
    -- Signal Details
    symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(10) NOT NULL, -- BUY, SELL
    entry_price DECIMAL(12,5) NOT NULL,
    stop_loss DECIMAL(12,5),
    take_profit_1 DECIMAL(12,5),
    take_profit_2 DECIMAL(12,5),
    take_profit_3 DECIMAL(12,5),
    
    -- Analysis
    timeframe VARCHAR(10),
    analysis TEXT,
    chart_image_url TEXT,
    
    -- Results
    status VARCHAR(20) DEFAULT 'active', -- active, tp1_hit, tp2_hit, tp3_hit, sl_hit, closed, cancelled
    exit_price DECIMAL(12,5),
    pips_result DECIMAL(8,2),
    closed_at TIMESTAMP,
    
    -- Visibility
    is_free BOOLEAN DEFAULT FALSE, -- Free signals for marketing
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provider reviews
CREATE TABLE IF NOT EXISTS signal_provider_reviews (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES signal_providers(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES signal_subscriptions(id),
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(100),
    review TEXT,
    
    is_verified_subscriber BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(provider_id, user_id)
);

-- ============================================================================
-- 3. DIGITAL PRODUCTS MARKETPLACE
-- ============================================================================

-- Digital products (e-books, courses, indicators, templates)
CREATE TABLE IF NOT EXISTS marketplace_products (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Product Info
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(170) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    short_description VARCHAR(255),
    
    -- Product Type
    product_type VARCHAR(30) NOT NULL, -- ebook, course, indicator, template, strategy_guide, video_course
    
    -- Files
    file_url TEXT, -- Primary file (encrypted storage)
    file_size_bytes BIGINT,
    file_type VARCHAR(50), -- pdf, zip, mp4, etc.
    additional_files JSONB, -- [{name, url, size, type}]
    
    -- For Courses
    course_modules JSONB, -- [{title, description, video_url, duration, order}]
    total_duration_minutes INTEGER,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2), -- Original price for showing discounts
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Media
    thumbnail_url TEXT,
    preview_images TEXT[],
    preview_video_url TEXT,
    
    -- Category
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    tags VARCHAR(50)[],
    
    -- Stats
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, suspended
    rejection_reason TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product purchases
CREATE TABLE IF NOT EXISTS marketplace_product_purchases (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES users(id),
    
    price_paid DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Commission
    platform_commission DECIMAL(10,2) NOT NULL,
    seller_earnings DECIMAL(10,2) NOT NULL,
    
    -- Access
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP,
    
    -- For Courses - Progress
    course_progress JSONB, -- {module_id: {completed: bool, progress_percent: int}}
    completion_percent INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    
    -- Payment
    payment_provider VARCHAR(30) DEFAULT 'whop',
    payment_reference VARCHAR(255),
    payment_status VARCHAR(20) DEFAULT 'completed',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(product_id, buyer_id)
);

-- Product reviews
CREATE TABLE IF NOT EXISTS marketplace_product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purchase_id INTEGER REFERENCES marketplace_product_purchases(id),
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(100),
    review TEXT,
    
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(product_id, user_id)
);

-- ============================================================================
-- 4. API MONETIZATION
-- ============================================================================

-- API plans/tiers
CREATE TABLE IF NOT EXISTS api_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    
    -- Limits
    requests_per_minute INTEGER NOT NULL,
    requests_per_day INTEGER NOT NULL,
    requests_per_month INTEGER NOT NULL,
    
    -- Features
    features JSONB, -- {signals: bool, historical_data: bool, webhooks: bool, etc}
    
    -- Pricing
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default API plans
INSERT INTO api_plans (name, description, requests_per_minute, requests_per_day, requests_per_month, price_monthly, price_yearly, features) VALUES
('Free', 'Basic API access for testing', 10, 100, 1000, 0, 0, '{"signals": false, "historical_data": false, "webhooks": false, "support": "community"}'),
('Developer', 'For individual developers and small projects', 60, 5000, 100000, 29, 290, '{"signals": true, "historical_data": true, "webhooks": true, "support": "email"}'),
('Business', 'For businesses and production applications', 120, 50000, 1000000, 99, 990, '{"signals": true, "historical_data": true, "webhooks": true, "priority_support": true, "sla": "99.9%"}'),
('Enterprise', 'Custom solutions for large organizations', 500, 500000, 10000000, 499, 4990, '{"signals": true, "historical_data": true, "webhooks": true, "dedicated_support": true, "custom_endpoints": true, "sla": "99.99%"}')
ON CONFLICT (name) DO NOTHING;

-- API keys
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES api_plans(id),
    
    -- Key Details
    key_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed API key (never store plain)
    key_prefix VARCHAR(10) NOT NULL, -- First 8 chars for identification (ae_xxxx)
    name VARCHAR(100), -- User-friendly name
    
    -- Permissions
    permissions JSONB DEFAULT '{"read": true, "write": false}',
    allowed_ips TEXT[], -- IP whitelist (null = all IPs)
    allowed_origins TEXT[], -- CORS origins
    
    -- Usage
    requests_today INTEGER DEFAULT 0,
    requests_this_month INTEGER DEFAULT 0,
    last_request_at TIMESTAMP,
    last_request_ip VARCHAR(45),
    
    -- Subscription
    subscription_status VARCHAR(20) DEFAULT 'active',
    subscription_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subscription_end TIMESTAMP,
    
    -- Payment
    payment_provider VARCHAR(30) DEFAULT 'whop',
    payment_reference VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMP,
    revoke_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API usage logs (for billing and analytics)
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id BIGSERIAL PRIMARY KEY,
    api_key_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    
    -- Request Details
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    
    -- Metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast usage queries
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_key_created ON api_usage_logs(api_key_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created ON api_usage_logs(created_at);

-- ============================================================================
-- 5. SELLER PAYOUTS / EARNINGS
-- ============================================================================

-- Seller earnings wallet
CREATE TABLE IF NOT EXISTS seller_wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Balances
    total_earned DECIMAL(12,2) DEFAULT 0,
    pending_balance DECIMAL(12,2) DEFAULT 0, -- Awaiting clearance
    available_balance DECIMAL(12,2) DEFAULT 0, -- Ready for withdrawal
    withdrawn_balance DECIMAL(12,2) DEFAULT 0,
    
    -- Stats
    total_sales INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    
    -- Payout Settings
    payout_method VARCHAR(30), -- crypto_usdt, crypto_btc, mpesa, paypal
    payout_details JSONB, -- {wallet_address, phone_number, email, etc}
    minimum_payout DECIMAL(10,2) DEFAULT 50,
    auto_payout BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seller payout requests
CREATE TABLE IF NOT EXISTS seller_payouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id INTEGER NOT NULL REFERENCES seller_wallets(id),
    
    amount DECIMAL(10,2) NOT NULL,
    fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    
    payout_method VARCHAR(30) NOT NULL,
    payout_details JSONB NOT NULL,
    
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, rejected, failed
    
    -- Admin Processing
    processed_by INTEGER REFERENCES users(id),
    processed_at TIMESTAMP,
    transaction_hash VARCHAR(255), -- For crypto payouts
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seller transaction history
CREATE TABLE IF NOT EXISTS seller_transactions (
    id SERIAL PRIMARY KEY,
    wallet_id INTEGER NOT NULL REFERENCES seller_wallets(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    
    type VARCHAR(30) NOT NULL, -- sale, commission, payout, refund, adjustment
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    
    -- Reference
    reference_type VARCHAR(30), -- bot_purchase, signal_subscription, product_purchase, payout
    reference_id INTEGER,
    
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Bot marketplace indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_bots_seller ON marketplace_bots(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_bots_status ON marketplace_bots(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_bots_category ON marketplace_bots(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_bots_featured ON marketplace_bots(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_marketplace_bot_purchases_buyer ON marketplace_bot_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_bot_purchases_seller ON marketplace_bot_purchases(seller_id);

-- Signal marketplace indexes
CREATE INDEX IF NOT EXISTS idx_signal_providers_user ON signal_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_providers_status ON signal_providers(status);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_provider ON signal_subscriptions(provider_id);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_subscriber ON signal_subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_signals_provider ON marketplace_signals(provider_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_signals_created ON marketplace_signals(created_at);

-- Digital products indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller ON marketplace_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_type ON marketplace_products(product_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_product_purchases_buyer ON marketplace_product_purchases(buyer_id);

-- API indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- Seller wallet indexes
CREATE INDEX IF NOT EXISTS idx_seller_transactions_wallet ON seller_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_seller_transactions_created ON seller_transactions(created_at);

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get or create seller wallet
CREATE OR REPLACE FUNCTION get_or_create_seller_wallet(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    wallet_id INTEGER;
BEGIN
    SELECT id INTO wallet_id FROM seller_wallets WHERE user_id = p_user_id;
    
    IF wallet_id IS NULL THEN
        INSERT INTO seller_wallets (user_id)
        VALUES (p_user_id)
        RETURNING id INTO wallet_id;
    END IF;
    
    RETURN wallet_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record a sale and credit seller
CREATE OR REPLACE FUNCTION record_marketplace_sale(
    p_seller_id INTEGER,
    p_sale_amount DECIMAL,
    p_commission_rate DECIMAL,
    p_reference_type VARCHAR,
    p_reference_id INTEGER,
    p_description TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_wallet_id INTEGER;
    v_commission DECIMAL;
    v_earnings DECIMAL;
    v_new_balance DECIMAL;
BEGIN
    -- Get or create wallet
    v_wallet_id := get_or_create_seller_wallet(p_seller_id);
    
    -- Calculate commission and earnings
    v_commission := p_sale_amount * (p_commission_rate / 100);
    v_earnings := p_sale_amount - v_commission;
    
    -- Update wallet (add to pending, will clear after refund period)
    UPDATE seller_wallets
    SET pending_balance = pending_balance + v_earnings,
        total_earned = total_earned + v_earnings,
        total_sales = total_sales + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_wallet_id
    RETURNING pending_balance INTO v_new_balance;
    
    -- Record transaction
    INSERT INTO seller_transactions (wallet_id, user_id, type, amount, balance_after, reference_type, reference_id, description)
    VALUES (v_wallet_id, p_seller_id, 'sale', v_earnings, v_new_balance, p_reference_type, p_reference_id, 
            COALESCE(p_description, 'Sale earnings'));
END;
$$ LANGUAGE plpgsql;

-- Function to clear pending earnings (run daily via cron)
CREATE OR REPLACE FUNCTION clear_pending_seller_earnings(p_days_to_clear INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    cleared_count INTEGER := 0;
BEGIN
    -- Move pending to available for transactions older than X days
    UPDATE seller_wallets sw
    SET available_balance = available_balance + subq.amount_to_clear,
        pending_balance = pending_balance - subq.amount_to_clear,
        updated_at = CURRENT_TIMESTAMP
    FROM (
        SELECT wallet_id, SUM(amount) as amount_to_clear
        FROM seller_transactions
        WHERE type = 'sale'
          AND created_at < CURRENT_TIMESTAMP - (p_days_to_clear || ' days')::INTERVAL
          AND reference_id NOT IN (
              -- Exclude if there's a refund for this sale
              SELECT reference_id FROM seller_transactions WHERE type = 'refund' AND reference_id IS NOT NULL
          )
        GROUP BY wallet_id
    ) subq
    WHERE sw.id = subq.wallet_id;
    
    GET DIAGNOSTICS cleared_count = ROW_COUNT;
    RETURN cleared_count;
END;
$$ LANGUAGE plpgsql;

-- Update bot rating when review is added
CREATE OR REPLACE FUNCTION update_bot_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE marketplace_bots
    SET rating_average = (
            SELECT AVG(rating)::DECIMAL(3,2) FROM marketplace_bot_reviews WHERE bot_id = NEW.bot_id
        ),
        rating_count = (
            SELECT COUNT(*) FROM marketplace_bot_reviews WHERE bot_id = NEW.bot_id
        )
    WHERE id = NEW.bot_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_bot_rating
AFTER INSERT OR UPDATE ON marketplace_bot_reviews
FOR EACH ROW EXECUTE FUNCTION update_bot_rating();

-- Update product rating when review is added
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE marketplace_products
    SET rating_average = (
            SELECT AVG(rating)::DECIMAL(3,2) FROM marketplace_product_reviews WHERE product_id = NEW.product_id
        ),
        rating_count = (
            SELECT COUNT(*) FROM marketplace_product_reviews WHERE product_id = NEW.product_id
        )
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_product_rating
AFTER INSERT OR UPDATE ON marketplace_product_reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Update provider rating when review is added
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE signal_providers
    SET rating_average = (
            SELECT AVG(rating)::DECIMAL(3,2) FROM signal_provider_reviews WHERE provider_id = NEW.provider_id
        ),
        rating_count = (
            SELECT COUNT(*) FROM signal_provider_reviews WHERE provider_id = NEW.provider_id
        )
    WHERE id = NEW.provider_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_provider_rating
AFTER INSERT OR UPDATE ON signal_provider_reviews
FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- ============================================================================
-- 8. INITIAL PRODUCT CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(60) NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER REFERENCES marketplace_categories(id),
    icon VARCHAR(50),
    marketplace_type VARCHAR(20) NOT NULL, -- bots, signals, products, api
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO marketplace_categories (name, slug, description, marketplace_type, icon, display_order) VALUES
-- Bot Categories
('Scalping', 'scalping-bots', 'High-frequency short-term trading bots', 'bots', 'zap', 1),
('Swing Trading', 'swing-trading-bots', 'Medium-term position trading bots', 'bots', 'trending-up', 2),
('Grid Trading', 'grid-trading-bots', 'Grid and DCA strategy bots', 'bots', 'grid', 3),
('News Trading', 'news-trading-bots', 'Economic news event trading bots', 'bots', 'newspaper', 4),
('Arbitrage', 'arbitrage-bots', 'Price difference arbitrage bots', 'bots', 'shuffle', 5),

-- Product Categories
('E-Books', 'ebooks', 'Trading education e-books and guides', 'products', 'book-open', 1),
('Video Courses', 'video-courses', 'Comprehensive video trading courses', 'products', 'video', 2),
('MT5 Indicators', 'mt5-indicators', 'Custom MetaTrader 5 indicators', 'products', 'activity', 3),
('MT4 Indicators', 'mt4-indicators', 'Custom MetaTrader 4 indicators', 'products', 'activity', 4),
('Strategy Templates', 'strategy-templates', 'Pre-configured trading strategy templates', 'products', 'file-text', 5),
('Trading Tools', 'trading-tools', 'Calculators, journals, and utilities', 'products', 'tool', 6)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
