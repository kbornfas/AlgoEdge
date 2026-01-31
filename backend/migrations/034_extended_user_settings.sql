-- Migration: Add extended settings columns to user_settings
-- Adds JSONB columns for appearance, localization, privacy, and additional trading columns

-- Add new JSONB columns for comprehensive settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS appearance JSONB DEFAULT '{"theme": "dark", "accentColor": "blue", "compactMode": false, "showProfitInPips": false, "showPercentageGain": true, "animationsEnabled": true, "chartDefaultTimeframe": "1H", "dashboardLayout": "default", "sidebarCollapsed": false}',
ADD COLUMN IF NOT EXISTS localization JSONB DEFAULT '{"language": "en", "currency": "USD", "dateFormat": "MM/DD/YYYY", "timeFormat": "12h", "numberFormat": "en-US"}',
ADD COLUMN IF NOT EXISTS privacy JSONB DEFAULT '{"profilePublic": false, "showOnLeaderboard": true, "shareTradeHistory": false, "allowDataAnalytics": true, "hideBalance": false, "twoClickTrade": true, "confirmBeforeClose": true, "sessionTimeout": 30}';

-- Add additional notification columns if not exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS trade_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_reports BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS stop_loss_percent DECIMAL(5,2) DEFAULT 2.0,
ADD COLUMN IF NOT EXISTS take_profit_percent DECIMAL(5,2) DEFAULT 4.0,
ADD COLUMN IF NOT EXISTS auto_close_profit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'dark';

-- Update trading_prefs default if column exists but has empty default
UPDATE user_settings 
SET trading_prefs = '{"defaultRiskPercent": 2, "maxDailyTrades": 10, "maxDailyLossPercent": 5, "maxLotSize": 0.5, "defaultLotSize": 0.01, "tradingHoursStart": "00:00", "tradingHoursEnd": "23:59", "timezone": "UTC", "autoStopOnDailyLoss": true, "weekendTrading": false, "newsFilterEnabled": true, "newsFilterMinutes": 30, "maxOpenTrades": 5, "trailingStopEnabled": false, "trailingStopPips": 20, "breakEvenEnabled": false, "breakEvenPips": 10, "defaultTakeProfit": 50, "defaultStopLoss": 25, "partialCloseEnabled": false, "partialClosePercent": 50, "partialClosePips": 30}'::jsonb
WHERE trading_prefs IS NULL OR trading_prefs = '{}'::jsonb;

-- Comments for documentation
COMMENT ON COLUMN user_settings.appearance IS 'UI appearance settings (theme, colors, layout preferences)';
COMMENT ON COLUMN user_settings.localization IS 'Localization settings (language, currency, date/time formats)';
COMMENT ON COLUMN user_settings.privacy IS 'Privacy and security settings (profile visibility, data sharing)';
COMMENT ON COLUMN user_settings.trading_prefs IS 'Trading preferences (risk management, lot sizes, trading hours, etc)';
