-- ============================================================================
-- Fix: Ensure top items have is_featured = true for landing page display
-- This sets is_featured on the best-performing approved bots, signals, and products
-- ============================================================================

-- Set is_featured = true for top 6 approved bots by rating/sales
UPDATE marketplace_bots 
SET is_featured = true, updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT id FROM marketplace_bots 
  WHERE status = 'approved' 
  ORDER BY rating_average DESC, total_sales DESC 
  LIMIT 6
);

-- Set is_featured = true for top 6 approved signal providers by subscribers/rating
UPDATE signal_providers 
SET is_featured = true, updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT id FROM signal_providers 
  WHERE status = 'approved' 
  ORDER BY rating_average DESC, subscriber_count DESC 
  LIMIT 6
);

-- Set is_featured = true for top 6 approved products by rating/sales
UPDATE marketplace_products 
SET is_featured = true, updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT id FROM marketplace_products 
  WHERE status = 'approved' 
  ORDER BY rating_average DESC, total_sales DESC 
  LIMIT 6
);
