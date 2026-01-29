-- Create economic calendar events table
CREATE TABLE IF NOT EXISTS economic_events (
  id SERIAL PRIMARY KEY,
  event_title VARCHAR(255) NOT NULL,
  country VARCHAR(3) NOT NULL, -- ISO country code
  currency VARCHAR(3) NOT NULL, -- USD, EUR, GBP, etc.
  event_date TIMESTAMP NOT NULL,
  impact VARCHAR(20) NOT NULL, -- low, medium, high
  forecast VARCHAR(100),
  previous VARCHAR(100),
  actual VARCHAR(100),
  description TEXT,
  source VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user event notifications/reminders
CREATE TABLE IF NOT EXISTS economic_event_reminders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id INT NOT NULL REFERENCES economic_events(id) ON DELETE CASCADE,
  remind_before_minutes INT DEFAULT 15, -- 15, 30, 60, etc.
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, event_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_economic_events_date ON economic_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_economic_events_currency ON economic_events(currency, event_date);
CREATE INDEX IF NOT EXISTS idx_economic_events_impact ON economic_events(impact, event_date);
CREATE INDEX IF NOT EXISTS idx_event_reminders_notified ON economic_event_reminders(notified, user_id) WHERE notified = false;

-- Trigger for updated_at
CREATE TRIGGER update_economic_events_updated_at
BEFORE UPDATE ON economic_events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
