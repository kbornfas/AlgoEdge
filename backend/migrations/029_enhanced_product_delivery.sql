-- ============================================================================
-- Enhanced Product Delivery System
-- Migration 029: Add community links for signals, file uploads for products
-- ============================================================================

-- Add community link fields to signal_providers
-- Sellers provide their community link (Telegram/WhatsApp/Instagram) for signal access
ALTER TABLE signal_providers 
ADD COLUMN IF NOT EXISTS community_link TEXT,
ADD COLUMN IF NOT EXISTS community_platform VARCHAR(50), -- telegram, whatsapp, discord, instagram
ADD COLUMN IF NOT EXISTS community_instructions TEXT;

-- Add detailed description fields to signal_providers
ALTER TABLE signal_providers
ADD COLUMN IF NOT EXISTS long_description TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trading_pairs TEXT[], -- Array of trading pairs covered
ADD COLUMN IF NOT EXISTS signal_frequency VARCHAR(50), -- daily, multiple_daily, weekly
ADD COLUMN IF NOT EXISTS average_signals_per_day INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS screenshots TEXT[], -- Screenshots of past performance
ADD COLUMN IF NOT EXISTS testimonials JSONB; -- [{name, text, rating, date}]

-- Add file delivery fields to marketplace_products
ALTER TABLE marketplace_products
ADD COLUMN IF NOT EXISTS download_files JSONB, -- [{name, url, size_bytes, file_type}]
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
ADD COLUMN IF NOT EXISTS license_terms TEXT;

-- Add file delivery fields to marketplace_bots  
ALTER TABLE marketplace_bots
ADD COLUMN IF NOT EXISTS download_files JSONB, -- [{name, url, size_bytes, file_type}]
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
ADD COLUMN IF NOT EXISTS setup_guide TEXT;

-- Add signal_provider_id to signal_provider_subscriptions to track subscriptions
-- This table tracks who subscribed to which signal provider
ALTER TABLE signal_provider_subscriptions
ADD COLUMN IF NOT EXISTS community_link_accessed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS community_link_accessed_at TIMESTAMP;

-- Create a table for purchase access tracking
CREATE TABLE IF NOT EXISTS purchase_access_log (
    id SERIAL PRIMARY KEY,
    purchase_type VARCHAR(50) NOT NULL, -- bot, product, signal
    purchase_id INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    access_type VARCHAR(50), -- download, view, community_link
    file_id INTEGER, -- Reference to product_deliverables.id if applicable
    ip_address VARCHAR(50),
    user_agent TEXT,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_access_log_purchase 
ON purchase_access_log(purchase_type, purchase_id);

-- Comments
COMMENT ON COLUMN signal_providers.community_link IS 'Link to seller signal community (Telegram, WhatsApp, etc.) - only visible after purchase';
COMMENT ON COLUMN signal_providers.community_platform IS 'Platform type: telegram, whatsapp, discord, instagram';
COMMENT ON COLUMN marketplace_products.download_files IS 'JSON array of downloadable files - only accessible after purchase';
COMMENT ON COLUMN marketplace_bots.download_files IS 'JSON array of downloadable EA/Bot files - only accessible after purchase';
