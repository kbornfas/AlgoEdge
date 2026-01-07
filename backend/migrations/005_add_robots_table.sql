-- Migration: Add robots table for trading scheduler
-- This table stores robot configurations that the trading scheduler uses

CREATE TABLE IF NOT EXISTS robots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    timeframe VARCHAR(10) NOT NULL DEFAULT 'm15',
    risk_level VARCHAR(20) NOT NULL DEFAULT 'medium',
    trading_pairs TEXT[] DEFAULT ARRAY['XAUUSD', 'EURUSD', 'GBPUSD'],
    status VARCHAR(20) NOT NULL DEFAULT 'inactive',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_robots_user_id ON robots(user_id);
CREATE INDEX IF NOT EXISTS idx_robots_status ON robots(status);

-- Add api_key and status columns to mt5_accounts if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mt5_accounts' AND column_name = 'api_key') THEN
        ALTER TABLE mt5_accounts ADD COLUMN api_key VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mt5_accounts' AND column_name = 'status') THEN
        ALTER TABLE mt5_accounts ADD COLUMN status VARCHAR(20) DEFAULT 'disconnected';
    END IF;
END $$;

-- Add robot_id column to trades table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'robot_id') THEN
        ALTER TABLE trades ADD COLUMN robot_id INTEGER REFERENCES robots(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'order_type') THEN
        ALTER TABLE trades ADD COLUMN order_type VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'mt5_ticket') THEN
        ALTER TABLE trades ADD COLUMN mt5_ticket VARCHAR(255);
    END IF;
END $$;

-- Create index on trades.robot_id
CREATE INDEX IF NOT EXISTS idx_trades_robot_id ON trades(robot_id);
