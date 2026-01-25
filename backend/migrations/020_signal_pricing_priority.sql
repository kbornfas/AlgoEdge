-- Migration 020: Update Signal Pricing and Add Priority System
-- Cheapest product: $15
-- Add signal priority for tier-based filtering

-- ============================================================================
-- 1. UPDATE SIGNAL TIER PRICING
-- ============================================================================

-- Starter: $15/month (was $9)
UPDATE signal_tiers SET 
  price = 15.00,
  description = 'Get started with low-priority trading signals',
  features = '["Standard signals only", "15-minute delay", "Entry + SL/TP", "Email support"]'::jsonb,
  max_signals_per_day = 3,
  signal_delay_minutes = 15
WHERE slug = 'starter';

-- Basic: $29/month (was $27)
UPDATE signal_tiers SET 
  price = 29.00,
  description = 'Standard signals for active traders',
  features = '["Standard + Medium priority signals", "5-minute delay", "Entry + SL/TP", "Basic analysis", "Telegram support"]'::jsonb,
  max_signals_per_day = 8,
  signal_delay_minutes = 5,
  includes_analysis = false
WHERE slug = 'basic';

-- Premium: $59/month (was $67)
UPDATE signal_tiers SET 
  price = 59.00,
  description = 'Premium signals with high-priority access',
  features = '["All priority signals (LOW+MEDIUM+HIGH)", "Real-time delivery", "Full SL/TP levels", "Detailed analysis", "Priority support"]'::jsonb,
  max_signals_per_day = null,
  signal_delay_minutes = 0,
  includes_analysis = true
WHERE slug = 'premium';

-- VIP: $99/month (was $147)
UPDATE signal_tiers SET 
  price = 99.00,
  description = 'Elite VIP access with exclusive signals',
  features = '["ALL signals including EXCLUSIVE VIP", "Instant delivery", "Full SL/TP + multiple TPs", "Expert analysis", "VIP Telegram channel", "1-on-1 support", "Early access to new features"]'::jsonb,
  max_signals_per_day = null,
  signal_delay_minutes = 0,
  includes_analysis = true,
  includes_vip_channel = true
WHERE slug = 'vip';

-- ============================================================================
-- 2. ADD PRIORITY COLUMN TO TRADING SIGNALS
-- ============================================================================

ALTER TABLE trading_signals 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM',
ADD COLUMN IF NOT EXISTS min_tier_slug VARCHAR(50) DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'trading_scheduler';

-- ============================================================================
-- 3. CREATE SIGNAL TIER PRIORITY MAPPING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS signal_tier_priorities (
  id SERIAL PRIMARY KEY,
  tier_slug VARCHAR(50) NOT NULL,
  allowed_priorities TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tier_slug)
);

-- Insert priority mappings
INSERT INTO signal_tier_priorities (tier_slug, allowed_priorities) VALUES
  ('starter', ARRAY['LOW']),
  ('basic', ARRAY['LOW', 'MEDIUM']),
  ('premium', ARRAY['LOW', 'MEDIUM', 'HIGH']),
  ('vip', ARRAY['LOW', 'MEDIUM', 'HIGH', 'VIP', 'EXCLUSIVE'])
ON CONFLICT (tier_slug) DO UPDATE SET 
  allowed_priorities = EXCLUDED.allowed_priorities;

-- ============================================================================
-- 4. CREATE INDEXES FOR PRIORITY FILTERING
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_trading_signals_priority ON trading_signals(priority);
CREATE INDEX IF NOT EXISTS idx_trading_signals_min_tier ON trading_signals(min_tier_slug);

-- ============================================================================
-- SIGNAL PRIORITY LEVELS:
-- - LOW: Basic signals for all subscribers (Starter+)
-- - MEDIUM: Standard signals (Basic+)
-- - HIGH: Premium signals (Premium+)
-- - VIP: Elite signals (VIP only)
-- - EXCLUSIVE: Ultra-premium signals (VIP only)
-- 
-- Priority is determined by signal confidence from trading scheduler:
-- - 92%+ confidence or explosion = EXCLUSIVE
-- - 88-91% confidence = VIP
-- - 78-87% confidence = HIGH
-- - 68-77% confidence = MEDIUM
-- - <68% confidence = LOW
-- ============================================================================
