-- Create knowledge base categories
CREATE TABLE IF NOT EXISTS kb_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  parent_id INT REFERENCES kb_categories(id) ON DELETE SET NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create knowledge base articles
CREATE TABLE IF NOT EXISTS kb_articles (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES kb_categories(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id INT REFERENCES users(id) ON DELETE SET NULL,
  view_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

-- Create article helpfulness tracking
CREATE TABLE IF NOT EXISTS kb_article_helpful (
  id SERIAL PRIMARY KEY,
  article_id INT NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kb_categories_parent ON kb_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kb_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published ON kb_articles(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_kb_articles_featured ON kb_articles(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_kb_articles_search ON kb_articles USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_kb_article_helpful_article ON kb_article_helpful(article_id);

-- Insert default categories
INSERT INTO kb_categories (name, slug, description, icon, display_order) VALUES
('Getting Started', 'getting-started', 'Essential guides for new users', 'rocket', 1),
('Trading Basics', 'trading-basics', 'Fundamental trading concepts and strategies', 'book', 2),
('Platform Features', 'platform-features', 'How to use AlgoEdge features', 'settings', 3),
('MetaTrader 5', 'metatrader-5', 'MT5 integration and usage guides', 'terminal', 4),
('Risk Management', 'risk-management', 'Protect your capital and manage risk', 'shield', 5),
('Technical Analysis', 'technical-analysis', 'Chart patterns, indicators, and analysis', 'trending-up', 6),
('Account & Billing', 'account-billing', 'Account management and subscription help', 'credit-card', 7),
('Troubleshooting', 'troubleshooting', 'Common issues and solutions', 'alert-circle', 8)
ON CONFLICT (slug) DO NOTHING;

-- Trigger to update helpful_count
CREATE OR REPLACE FUNCTION update_article_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_helpful THEN
      UPDATE kb_articles SET helpful_count = helpful_count + 1 WHERE id = NEW.article_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_helpful != NEW.is_helpful THEN
      IF NEW.is_helpful THEN
        UPDATE kb_articles SET helpful_count = helpful_count + 1 WHERE id = NEW.article_id;
      ELSE
        UPDATE kb_articles SET helpful_count = helpful_count - 1 WHERE id = NEW.article_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_helpful THEN
      UPDATE kb_articles SET helpful_count = helpful_count - 1 WHERE id = OLD.article_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_article_helpful_count
AFTER INSERT OR UPDATE OR DELETE ON kb_article_helpful
FOR EACH ROW EXECUTE FUNCTION update_article_helpful_count();

-- Trigger for updated_at
CREATE TRIGGER update_kb_articles_updated_at
BEFORE UPDATE ON kb_articles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
