-- Migration: Changelog/What's New System
-- Description: Platform updates and announcements

CREATE TABLE IF NOT EXISTS changelog_entries (
  id SERIAL PRIMARY KEY,
  version VARCHAR(20), -- e.g., v2.1.0
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- feature, improvement, bugfix, security
  image_url TEXT,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT REFERENCES users(id),
  is_published BOOLEAN DEFAULT false
);

-- Track which users have seen each changelog
CREATE TABLE IF NOT EXISTS changelog_views (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  changelog_id INT NOT NULL REFERENCES changelog_entries(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, changelog_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_changelog_published ON changelog_entries(published_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_changelog_views_user ON changelog_views(user_id);
CREATE INDEX IF NOT EXISTS idx_changelog_views_entry ON changelog_views(changelog_id);
