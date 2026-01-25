-- Migration: Add Push Notifications Support
-- Description: Creates tables for web push notification subscriptions

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Add push notification settings to user_settings if not exists
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT false;

-- Create notification_logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- push, email, telegram, sms
  title VARCHAR(255),
  body TEXT,
  data JSONB,
  status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, failed, clicked
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  clicked_at TIMESTAMP,
  error_message TEXT
);

-- Create indexes for notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  new_signal BOOLEAN DEFAULT true,
  trade_executed BOOLEAN DEFAULT true,
  trade_closed BOOLEAN DEFAULT true,
  profit_milestone BOOLEAN DEFAULT true,
  loss_alert BOOLEAN DEFAULT true,
  daily_report BOOLEAN DEFAULT true,
  weekly_report BOOLEAN DEFAULT false,
  affiliate_referral BOOLEAN DEFAULT true,
  affiliate_commission BOOLEAN DEFAULT true,
  affiliate_payout BOOLEAN DEFAULT true,
  security_alert BOOLEAN DEFAULT true,
  news_events BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Insert default preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Function to auto-create notification preferences for new users
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create notification preferences
DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON users;
CREATE TRIGGER trigger_create_notification_preferences
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_notification_preferences();
