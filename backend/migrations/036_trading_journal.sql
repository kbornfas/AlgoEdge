-- Migration: Trading Journal System
-- Description: Adds notes and tags to trades for better analysis

-- Add journal fields to trades table
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS tags VARCHAR(255),
ADD COLUMN IF NOT EXISTS setup_rating INT CHECK (setup_rating >= 1 AND setup_rating <= 5),
ADD COLUMN IF NOT EXISTS emotion VARCHAR(50), -- calm, confident, fearful, greedy, revenge
ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Create trade_tags table for better tag management
CREATE TABLE IF NOT EXISTS trade_tags (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#8B5CF6', -- hex color
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trade_tags_user ON trade_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_tags ON trades USING gin (to_tsvector('english', tags));

-- Insert some default tags for users
INSERT INTO trade_tags (user_id, name, color)
SELECT DISTINCT u.id, tag_name, tag_color
FROM users u
CROSS JOIN (
  VALUES 
    ('Breakout', '#3B82F6'),
    ('Trend Follow', '#22C55E'),
    ('Reversal', '#EF4444'),
    ('Range Trading', '#F59E0B'),
    ('Scalping', '#8B5CF6'),
    ('News Event', '#EC4899'),
    ('Support/Resistance', '#06B6D4'),
    ('Pattern', '#10B981')
) AS default_tags(tag_name, tag_color)
WHERE NOT EXISTS (
  SELECT 1 FROM trade_tags tt WHERE tt.user_id = u.id AND tt.name = tag_name
);
