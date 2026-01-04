-- Add status column to mt5_accounts table
-- This migration adds the status column that is used by mt5Service.js to track connection state

-- Add status column with default value
ALTER TABLE mt5_accounts 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'disconnected';

-- Update existing records to have status based on is_connected
-- This ensures backward compatibility with existing data
-- Only update records that still have the default 'disconnected' value
UPDATE mt5_accounts 
SET status = CASE 
  WHEN is_connected = true THEN 'connected' 
  ELSE 'disconnected' 
END
WHERE is_connected = true AND status = 'disconnected';

-- Add index for performance on status column queries
CREATE INDEX IF NOT EXISTS idx_mt5_accounts_status ON mt5_accounts(status);
