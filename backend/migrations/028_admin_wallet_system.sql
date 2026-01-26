-- ============================================================================
-- ADMIN/PLATFORM WALLET SYSTEM
-- Tracks all platform revenue and maintains balance for proper accounting
-- ============================================================================

-- Admin/Platform Wallet (single row for platform funds)
CREATE TABLE IF NOT EXISTS admin_wallet (
    id SERIAL PRIMARY KEY,
    balance DECIMAL(12, 2) DEFAULT 0.00,
    total_revenue DECIMAL(12, 2) DEFAULT 0.00,
    total_marketplace_commission DECIMAL(12, 2) DEFAULT 0.00,
    total_verification_fees DECIMAL(12, 2) DEFAULT 0.00,
    total_withdrawal_fees DECIMAL(12, 2) DEFAULT 0.00,
    total_subscription_revenue DECIMAL(12, 2) DEFAULT 0.00,
    total_payouts DECIMAL(12, 2) DEFAULT 0.00,
    total_refunds DECIMAL(12, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Wallet Transactions (all platform revenue movements)
CREATE TABLE IF NOT EXISTS admin_wallet_transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, 
    -- Types: 'marketplace_commission', 'verification_fee', 'withdrawal_fee', 
    -- 'subscription_revenue', 'affiliate_payout', 'refund', 'manual_adjustment'
    amount DECIMAL(12, 2) NOT NULL,
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- 'purchase', 'verification', 'withdrawal', 'subscription', 'payout'
    reference_id INTEGER,
    user_id INTEGER REFERENCES users(id), -- The user involved in this transaction
    metadata JSONB DEFAULT '{}',
    created_by INTEGER REFERENCES users(id), -- Admin who made manual adjustment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize admin wallet with single row
INSERT INTO admin_wallet (id, balance, total_revenue) 
VALUES (1, 0.00, 0.00)
ON CONFLICT (id) DO NOTHING;

-- Function to add admin wallet transaction
CREATE OR REPLACE FUNCTION add_admin_wallet_transaction(
    p_type VARCHAR(50),
    p_amount DECIMAL(12,2),
    p_description TEXT,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_reference_id INTEGER DEFAULT NULL,
    p_user_id INTEGER DEFAULT NULL,
    p_created_by INTEGER DEFAULT NULL
)
RETURNS admin_wallet_transactions AS $$
DECLARE
    current_balance DECIMAL(12,2);
    new_balance DECIMAL(12,2);
    transaction_record admin_wallet_transactions;
BEGIN
    -- Get current balance
    SELECT balance INTO current_balance FROM admin_wallet WHERE id = 1;
    
    -- Calculate new balance
    new_balance := current_balance + p_amount;
    
    -- Update admin wallet balance and appropriate total
    UPDATE admin_wallet SET 
        balance = new_balance,
        total_revenue = CASE 
            WHEN p_amount > 0 THEN total_revenue + p_amount 
            ELSE total_revenue 
        END,
        total_marketplace_commission = CASE 
            WHEN p_type = 'marketplace_commission' THEN total_marketplace_commission + p_amount 
            ELSE total_marketplace_commission 
        END,
        total_verification_fees = CASE 
            WHEN p_type = 'verification_fee' THEN total_verification_fees + p_amount 
            ELSE total_verification_fees 
        END,
        total_withdrawal_fees = CASE 
            WHEN p_type = 'withdrawal_fee' THEN total_withdrawal_fees + p_amount 
            ELSE total_withdrawal_fees 
        END,
        total_subscription_revenue = CASE 
            WHEN p_type = 'subscription_revenue' THEN total_subscription_revenue + p_amount 
            ELSE total_subscription_revenue 
        END,
        total_payouts = CASE 
            WHEN p_type = 'affiliate_payout' THEN total_payouts + ABS(p_amount)
            ELSE total_payouts 
        END,
        total_refunds = CASE 
            WHEN p_type = 'refund' THEN total_refunds + ABS(p_amount)
            ELSE total_refunds 
        END,
        updated_at = NOW()
    WHERE id = 1;
    
    -- Insert transaction record
    INSERT INTO admin_wallet_transactions (
        type, amount, balance_before, balance_after, 
        description, reference_type, reference_id, user_id, created_by
    )
    VALUES (
        p_type, p_amount, current_balance, new_balance,
        p_description, p_reference_type, p_reference_id, p_user_id, p_created_by
    )
    RETURNING * INTO transaction_record;
    
    RETURN transaction_record;
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_wallet_transactions_type ON admin_wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_admin_wallet_transactions_user_id ON admin_wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_wallet_transactions_created_at ON admin_wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_wallet_transactions_reference ON admin_wallet_transactions(reference_type, reference_id);
