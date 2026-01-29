-- Add system health tracking table
CREATE TABLE IF NOT EXISTS system_health (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC,
  metric_unit VARCHAR(50),
  status VARCHAR(20) DEFAULT 'normal', -- normal, warning, critical
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add maintenance mode settings
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INT REFERENCES users(id)
);

-- Insert default maintenance mode setting
INSERT INTO system_settings (key, value) VALUES ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value) VALUES ('maintenance_message', 'System is under maintenance. Please check back soon.')
ON CONFLICT (key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_health_recorded ON system_health(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_metric ON system_health(metric_name, recorded_at DESC);

-- Function to clean old health records (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_health_records()
RETURNS void AS $$
BEGIN
  DELETE FROM system_health WHERE recorded_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
