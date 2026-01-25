-- Migration: Add API Packages Table and Official Product Flags
-- Run this migration to support API access packages and official products

-- ============================================================================
-- API PACKAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  tier VARCHAR(50) NOT NULL, -- 'free', 'starter', 'professional', 'enterprise'
  price_monthly DECIMAL(10, 2) DEFAULT 0,
  price_yearly DECIMAL(10, 2) DEFAULT 0,
  rate_limit INTEGER NOT NULL DEFAULT 100,
  rate_limit_period VARCHAR(20) DEFAULT 'day', -- 'minute', 'hour', 'day'
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- API SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id INTEGER NOT NULL REFERENCES api_packages(id),
  api_key VARCHAR(64) UNIQUE NOT NULL,
  api_secret VARCHAR(128) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
  billing_period VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'yearly'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  whop_subscription_id VARCHAR(100),
  total_requests_today INTEGER DEFAULT 0,
  total_requests_all_time BIGINT DEFAULT 0,
  last_request_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- API REQUEST LOGS (for analytics and rate limiting)
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_request_logs (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER REFERENCES api_subscriptions(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_body_size INTEGER,
  response_body_size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_api_request_logs_subscription_date 
ON api_request_logs(subscription_id, created_at);

CREATE INDEX IF NOT EXISTS idx_api_request_logs_endpoint 
ON api_request_logs(endpoint, created_at);

-- ============================================================================
-- ADD OFFICIAL PRODUCT FLAGS
-- ============================================================================
ALTER TABLE marketplace_bots ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE;
ALTER TABLE signal_providers ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- ADD SELLER SUBSCRIPTION REQUIREMENT
-- ============================================================================
ALTER TABLE seller_wallets ADD COLUMN IF NOT EXISTS subscription_required BOOLEAN DEFAULT TRUE;
ALTER TABLE seller_wallets ADD COLUMN IF NOT EXISTS subscription_verified_at TIMESTAMP;

-- ============================================================================
-- BLOG POSTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image VARCHAR(500),
  category VARCHAR(50) DEFAULT 'general', -- 'education', 'analysis', 'news', 'tutorial', 'product'
  tags TEXT[], -- Array of tags
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);

-- ============================================================================
-- TESTIMONIALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  role VARCHAR(100), -- 'Professional Trader', 'Beginner', etc.
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  product_type VARCHAR(50), -- 'bot', 'signal', 'product', 'platform'
  product_id INTEGER,
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PLATFORM STATISTICS (cached for performance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_statistics (
  id SERIAL PRIMARY KEY,
  stat_key VARCHAR(50) UNIQUE NOT NULL,
  stat_value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial statistics
INSERT INTO platform_statistics (stat_key, stat_value) VALUES 
  ('total_users', '{"count": 0}'),
  ('total_trades', '{"count": 0, "volume": 0}'),
  ('total_profit', '{"amount": 0}'),
  ('active_bots', '{"count": 0}'),
  ('signals_sent', '{"count": 0}'),
  ('products_sold', '{"count": 0}')
ON CONFLICT (stat_key) DO NOTHING;

-- ============================================================================
-- FUNCTION TO UPDATE STATISTICS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_platform_stat(key_name VARCHAR, new_value JSONB)
RETURNS VOID AS $$
BEGIN
  INSERT INTO platform_statistics (stat_key, stat_value, updated_at)
  VALUES (key_name, new_value, CURRENT_TIMESTAMP)
  ON CONFLICT (stat_key) DO UPDATE SET 
    stat_value = new_value,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
