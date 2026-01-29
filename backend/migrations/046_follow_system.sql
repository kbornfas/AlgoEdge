-- Create user follows table
CREATE TABLE IF NOT EXISTS user_follows (
  id SERIAL PRIMARY KEY,
  follower_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create follow notifications settings
CREATE TABLE IF NOT EXISTS follow_notification_settings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  notify_on_new_trade BOOLEAN DEFAULT true,
  notify_on_profit_milestone BOOLEAN DEFAULT true,
  notify_on_new_signal BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created ON user_follows(created_at DESC);

-- Create function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(uid INT)
RETURNS INT AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM user_follows WHERE following_id = uid);
END;
$$ LANGUAGE plpgsql;

-- Create function to get following count
CREATE OR REPLACE FUNCTION get_following_count(uid INT)
RETURNS INT AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM user_follows WHERE follower_id = uid);
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_follow_notification_settings_updated_at
BEFORE UPDATE ON follow_notification_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
