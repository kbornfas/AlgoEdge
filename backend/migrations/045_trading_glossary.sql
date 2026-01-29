-- Create trading glossary table
CREATE TABLE IF NOT EXISTS trading_glossary (
  id SERIAL PRIMARY KEY,
  term VARCHAR(255) NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  category VARCHAR(100), -- Technical Analysis, Fundamental Analysis, Risk Management, etc.
  example TEXT,
  related_terms TEXT[], -- Array of related term names
  view_count INT DEFAULT 0,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create glossary search index
CREATE INDEX IF NOT EXISTS idx_glossary_term ON trading_glossary(term);
CREATE INDEX IF NOT EXISTS idx_glossary_category ON trading_glossary(category);
CREATE INDEX IF NOT EXISTS idx_glossary_search ON trading_glossary USING gin(to_tsvector('english', term || ' ' || definition));

-- Insert common trading terms
INSERT INTO trading_glossary (term, definition, category, example) VALUES
('Pip', 'The smallest price move that a given exchange rate can make. For most currency pairs, a pip is 0.0001.', 'Basics', 'If EUR/USD moves from 1.1050 to 1.1051, that is one pip movement.'),
('Spread', 'The difference between the bid and ask price of a currency pair.', 'Basics', 'If EUR/USD bid is 1.1050 and ask is 1.1052, the spread is 2 pips.'),
('Leverage', 'The ability to control a large position with a relatively small amount of capital.', 'Risk Management', 'With 1:100 leverage, you can control $100,000 with just $1,000.'),
('Stop Loss', 'An order to close a trade at a specific price to limit potential losses.', 'Risk Management', 'If you buy EUR/USD at 1.1050, you might set a stop loss at 1.1000.'),
('Take Profit', 'An order to close a trade at a specific price to lock in profits.', 'Risk Management', 'If you buy at 1.1050, you might set take profit at 1.1150.'),
('Lot', 'A standardized trading unit. Standard lot = 100,000 units, Mini lot = 10,000, Micro lot = 1,000.', 'Basics', 'Trading 0.1 lots of EUR/USD = 10,000 euros.'),
('Margin', 'The amount of money required to open and maintain a leveraged position.', 'Risk Management', 'To open a $100,000 position with 1:100 leverage requires $1,000 margin.'),
('Drawdown', 'The peak-to-trough decline during a specific period for an investment or trading account.', 'Performance', 'If your account was $10,000 at peak and dropped to $8,000, drawdown is 20%.'),
('Support', 'A price level where a downtrend can be expected to pause due to buying interest.', 'Technical Analysis', 'EUR/USD keeps bouncing at 1.1000 - that level is acting as support.'),
('Resistance', 'A price level where an uptrend can be expected to pause due to selling interest.', 'Technical Analysis', 'EUR/USD keeps getting rejected at 1.1200 - that level is resistance.'),
('Bullish', 'Expecting prices to rise. Optimistic market sentiment.', 'Market Sentiment', 'Traders are bullish on USD after positive employment data.'),
('Bearish', 'Expecting prices to fall. Pessimistic market sentiment.', 'Market Sentiment', 'Analysts are bearish on EUR due to economic concerns.'),
('Breakout', 'When price moves beyond a defined support or resistance level with increased volume.', 'Technical Analysis', 'EUR/USD broke above 1.1200 resistance on strong momentum.'),
('Scalping', 'A trading strategy that involves making numerous trades over short time periods for small profits.', 'Trading Strategy', 'A scalper might make 50 trades per day, targeting 2-5 pips each.'),
('Swing Trading', 'A trading strategy that holds positions for several days to capture short-to-medium term gains.', 'Trading Strategy', 'A swing trader enters Monday and exits Friday based on weekly trends.')
ON CONFLICT (term) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_trading_glossary_updated_at
BEFORE UPDATE ON trading_glossary
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
