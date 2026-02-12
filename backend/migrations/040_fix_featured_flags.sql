-- ============================================================================
-- Fix: Ensure top items have is_featured = true for landing page display
-- This sets is_featured on the best-performing approved bots, signals, and products
-- Disables price-tracking triggers temporarily to avoid column reference errors
-- ============================================================================

-- Disable price-change triggers during feature flag updates
ALTER TABLE marketplace_bots DISABLE TRIGGER track_bot_price_changes;
ALTER TABLE signal_providers DISABLE TRIGGER track_provider_price_changes;
ALTER TABLE marketplace_products DISABLE TRIGGER track_product_price_changes;

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

-- Re-enable price-change triggers
ALTER TABLE marketplace_bots ENABLE TRIGGER track_bot_price_changes;
ALTER TABLE signal_providers ENABLE TRIGGER track_provider_price_changes;
ALTER TABLE marketplace_products ENABLE TRIGGER track_product_price_changes;
