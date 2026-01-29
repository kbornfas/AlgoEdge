-- Migration: Price Alerts System
-- Description: Creates table for user price alerts on currency pairs

CREATE TABLE IF NOT EXISTS price_alerts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL, -- e.g., EURUSD, XAUUSD, BTCUSD
  alert_type VARCHAR(20) NOT NULL, -- 'above', 'below', 'cross'
  target_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8),
  message TEXT,
  is_active BOOLEAN DEFAULT true,
  triggered BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_symbol ON price_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active, triggered);
CREATE INDEX IF NOT EXISTS idx_price_alerts_created ON price_alerts(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_price_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS price_alerts_updated_at_trigger ON price_alerts;
CREATE TRIGGER price_alerts_updated_at_trigger
  BEFORE UPDATE ON price_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_price_alerts_updated_at();
