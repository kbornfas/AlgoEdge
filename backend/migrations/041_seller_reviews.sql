-- Create seller reviews table
CREATE TABLE IF NOT EXISTS seller_reviews (
  id SERIAL PRIMARY KEY,
  seller_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT REFERENCES marketplace_products(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  review_text TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(seller_id, reviewer_id, product_id)
);

-- Create review helpfulness tracking
CREATE TABLE IF NOT EXISTS review_helpfulness (
  id SERIAL PRIMARY KEY,
  review_id INT NOT NULL REFERENCES seller_reviews(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, user_id)
);

-- Create seller review summary view
CREATE OR REPLACE VIEW seller_review_summary AS
SELECT 
  seller_id,
  COUNT(*) as total_reviews,
  ROUND(AVG(rating), 2) as avg_rating,
  SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
  SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
  SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
  SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
  SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
FROM seller_reviews
GROUP BY seller_id;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller ON seller_reviews(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_product ON seller_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_review_helpfulness_review ON review_helpfulness(review_id);

-- Trigger to update helpful_count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE seller_reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE seller_reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_helpful_count
AFTER INSERT OR DELETE ON review_helpfulness
FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- Trigger to update updated_at
CREATE TRIGGER update_seller_reviews_updated_at
BEFORE UPDATE ON seller_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
