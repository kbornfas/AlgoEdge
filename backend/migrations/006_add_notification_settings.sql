-- Migration: Add notification settings columns to user_settings
-- This migration adds columns for weekly reports, market news, and telegram notifications

-- Add new notification columns
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS weekly_reports BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS market_news BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS telegram_alerts BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS trading_prefs JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_weekly_report TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_daily_report TIMESTAMP;

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_user_settings_weekly_reports ON user_settings(weekly_reports) WHERE weekly_reports = true;
CREATE INDEX IF NOT EXISTS idx_user_settings_trade_alerts ON user_settings(trade_alerts) WHERE trade_alerts = true;

-- Add comment for documentation
COMMENT ON COLUMN user_settings.weekly_reports IS 'Send weekly trading performance summary emails';
COMMENT ON COLUMN user_settings.market_news IS 'Send market news and trading insights';
COMMENT ON COLUMN user_settings.telegram_alerts IS 'Send trade alerts via Telegram';
COMMENT ON COLUMN user_settings.telegram_chat_id IS 'Telegram chat ID for alerts';
COMMENT ON COLUMN user_settings.timezone IS 'User timezone for report scheduling';
COMMENT ON COLUMN user_settings.trading_prefs IS 'Trading preferences JSON (risk, lot size, hours, etc)';
