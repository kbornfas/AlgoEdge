-- Seller Media Table for performance screenshots and videos
-- This allows sellers to showcase their trading performance with media proof

CREATE TABLE IF NOT EXISTS seller_media (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_seller_media_user_id ON seller_media(user_id);

-- Add seller_display_name column to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'seller_display_name'
  ) THEN
    ALTER TABLE users ADD COLUMN seller_display_name VARCHAR(100);
  END IF;
END $$;

-- Add display_name column to seller_applications table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'seller_applications' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE seller_applications ADD COLUMN display_name VARCHAR(100);
  END IF;
END $$;
