-- Create trading competitions table
CREATE TABLE IF NOT EXISTS trading_competitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  competition_type VARCHAR(50) NOT NULL, -- profit, pips, win_rate, trades_count
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  prize_pool DECIMAL(10, 2),
  prize_structure JSONB, -- { "1": 1000, "2": 500, "3": 250 }
  entry_fee DECIMAL(10, 2) DEFAULT 0,
  min_trades INT DEFAULT 10,
  max_participants INT,
  status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, active, completed, cancelled
  rules TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create competition participants table
CREATE TABLE IF NOT EXISTS competition_participants (
  id SERIAL PRIMARY KEY,
  competition_id INT NOT NULL REFERENCES trading_competitions(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starting_balance DECIMAL(10, 2) DEFAULT 10000,
  current_balance DECIMAL(10, 2) DEFAULT 10000,
  total_trades INT DEFAULT 0,
  winning_trades INT DEFAULT 0,
  total_profit DECIMAL(10, 2) DEFAULT 0,
  total_pips DECIMAL(10, 2) DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  final_rank INT,
  prize_won DECIMAL(10, 2),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(competition_id, user_id)
);

-- Create competition trades table (snapshot of trades for competition)
CREATE TABLE IF NOT EXISTS competition_trades (
  id SERIAL PRIMARY KEY,
  competition_id INT NOT NULL REFERENCES trading_competitions(id) ON DELETE CASCADE,
  participant_id INT NOT NULL REFERENCES competition_participants(id) ON DELETE CASCADE,
  trade_id INT REFERENCES trades(id) ON DELETE SET NULL,
  symbol VARCHAR(20) NOT NULL,
  trade_type VARCHAR(10) NOT NULL,
  profit_loss DECIMAL(10, 2) NOT NULL,
  pips DECIMAL(10, 2),
  closed_at TIMESTAMP NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_competitions_status ON trading_competitions(status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_competitions_dates ON trading_competitions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_participants_competition ON competition_participants(competition_id, total_profit DESC);
CREATE INDEX IF NOT EXISTS idx_participants_user ON competition_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_trades_participant ON competition_trades(participant_id);
CREATE INDEX IF NOT EXISTS idx_competition_trades_competition ON competition_trades(competition_id);

-- Trigger for updated_at
CREATE TRIGGER update_trading_competitions_updated_at
BEFORE UPDATE ON trading_competitions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
