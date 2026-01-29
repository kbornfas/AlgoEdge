-- Migration: In-App Notifications System
-- Description: Creates table for in-app notification center

-- Create in_app_notifications table
CREATE TABLE IF NOT EXISTS in_app_notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- signal, trade, system, promo, alert, security, subscription
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  icon VARCHAR(50), -- icon name for frontend
  link VARCHAR(255), -- optional link to navigate to
  metadata JSONB, -- additional data
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user ON in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_read ON in_app_notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created ON in_app_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_type ON in_app_notifications(type);

-- Add notification count trigger function
CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- This could be used with pg_notify for real-time updates
  PERFORM pg_notify('new_notification', json_build_object(
    'user_id', NEW.user_id,
    'notification_id', NEW.id,
    'type', NEW.type,
    'title', NEW.title
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS new_notification_trigger ON in_app_notifications;
CREATE TRIGGER new_notification_trigger
  AFTER INSERT ON in_app_notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_notification();
