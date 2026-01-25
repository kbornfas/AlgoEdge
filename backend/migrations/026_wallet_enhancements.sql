-- ============================================================================
-- ALGOEDGE COMPLETE WALLET SYSTEM v2
-- Full wallet infrastructure with admin control, withdrawals, instant deposits
-- ============================================================================

-- ============================================================================
-- 1. PLATFORM WALLET (Admin's central wallet)
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_wallet (
    id SERIAL PRIMARY KEY,
    wallet_type VARCHAR(50) NOT NULL UNIQUE, -- 'main', 'commission', 'fees', 'escrow'
    balance DECIMAL(12, 2) DEFAULT 0.00,
    total_received DECIMAL(12, 2) DEFAULT 0.00,
    total_withdrawn DECIMAL(12, 2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert platform wallets
INSERT INTO platform_wallet (wallet_type, balance, description) VALUES 
    ('main', 0, 'Main platform wallet - all user deposits'),
    ('commission', 0, 'Commission earnings from sales (25% admin, 75% seller)'),
    ('fees', 0, 'Verification fees, withdrawal fees'),
    ('escrow', 0, 'Held funds for pending seller payouts')
ON CONFLICT (wallet_type) DO NOTHING;

-- ============================================================================
-- 2. WITHDRAWAL REQUESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallet_withdrawal_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_type VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user' or 'seller'
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    withdrawal_fee DECIMAL(12, 2) DEFAULT 0.00,
    net_amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_details JSONB NOT NULL DEFAULT '{}', -- {phone, email, crypto_address, bank_account}
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, processing, completed, rejected, cancelled
    admin_notes TEXT,
    transaction_reference VARCHAR(255), -- M-Pesa code, PayPal ID, Tx hash (filled on completion)
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_user ON wallet_withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON wallet_withdrawal_requests(status);

-- ============================================================================
-- 3. ADMIN WALLET ADJUSTMENTS LOG (Audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_wallet_adjustments (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    wallet_type VARCHAR(20) NOT NULL, -- 'user', 'seller', 'platform'
    action VARCHAR(50) NOT NULL, -- credit, debit, freeze, unfreeze, set_balance
    amount DECIMAL(12, 2),
    balance_before DECIMAL(12, 2),
    balance_after DECIMAL(12, 2),
    reason TEXT NOT NULL,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_adjustments_admin ON admin_wallet_adjustments(admin_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_user ON admin_wallet_adjustments(target_user_id);

-- ============================================================================
-- 4. WITHDRAWAL SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS withdrawal_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO withdrawal_settings (setting_key, setting_value, description) VALUES
    ('min_withdrawal_user', '10', 'Minimum withdrawal amount for users (USD)'),
    ('min_withdrawal_seller', '20', 'Minimum withdrawal amount for sellers (USD)'),
    ('withdrawal_fee_percent', '3', 'Withdrawal fee percentage'),
    ('withdrawal_fee_fixed', '0', 'Fixed withdrawal fee (USD)'),
    ('instant_withdrawal_enabled', 'true', 'Enable instant withdrawals'),
    ('seller_payout_hold_days', '7', 'Days to hold seller earnings before withdrawal'),
    ('max_daily_withdrawal', '5000', 'Maximum daily withdrawal per user'),
    ('require_verification_for_withdrawal', 'false', 'Require email/phone verification for withdrawal')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- 5. UPDATE EXISTING TABLES
-- ============================================================================

-- Add columns to user_wallets
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS pending_balance DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS total_withdrawn DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMP;
ALTER TABLE user_wallets ADD COLUMN IF NOT EXISTS frozen_by INTEGER REFERENCES users(id);

-- Add columns to seller_wallets
ALTER TABLE seller_wallets ADD COLUMN IF NOT EXISTS pending_withdrawal DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE seller_wallets ADD COLUMN IF NOT EXISTS total_withdrawn DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE seller_wallets ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE seller_wallets ADD COLUMN IF NOT EXISTS frozen_reason TEXT;
ALTER TABLE seller_wallets ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMP;
ALTER TABLE seller_wallets ADD COLUMN IF NOT EXISTS frozen_by INTEGER REFERENCES users(id);

-- Add wallet_type to wallet_transactions if not exists
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS wallet_type VARCHAR(20) DEFAULT 'user';
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- Add seller_transaction_id to marketplace_purchases
ALTER TABLE marketplace_purchases ADD COLUMN IF NOT EXISTS seller_transaction_id INTEGER;

-- ============================================================================
-- 6. CREATE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_wallets_frozen ON user_wallets(is_frozen);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_date ON platform_earnings(created_at DESC);
