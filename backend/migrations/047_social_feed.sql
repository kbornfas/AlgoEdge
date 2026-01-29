-- Create social feed posts table
CREATE TABLE IF NOT EXISTS social_posts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_type VARCHAR(50) NOT NULL, -- trade, achievement, insight, milestone
  content TEXT NOT NULL,
  media_url TEXT,
  visibility VARCHAR(20) DEFAULT 'followers', -- public, followers, private
  
  -- Related entities
  trade_id INT REFERENCES trades(id) ON DELETE SET NULL,
  
  -- Engagement metrics
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create post likes table
CREATE TABLE IF NOT EXISTS social_post_likes (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- Create post comments table
CREATE TABLE IF NOT EXISTS social_post_comments (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_type ON social_posts(post_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_post_likes_post ON social_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_likes_user ON social_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_social_post_comments_post ON social_post_comments(post_id, created_at DESC);

-- Triggers to update counts
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_like_count
AFTER INSERT OR DELETE ON social_post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_comment_count
AFTER INSERT OR DELETE ON social_post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Triggers for updated_at
CREATE TRIGGER update_social_posts_updated_at
BEFORE UPDATE ON social_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_post_comments_updated_at
BEFORE UPDATE ON social_post_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
