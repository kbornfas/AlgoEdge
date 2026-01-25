-- ============================================================================
-- USER WALLETS SYSTEM
-- Internal wallet for marketplace purchases (Stripe alternative)
-- ============================================================================

-- User Wallets (for buyers)
CREATE TABLE IF NOT EXISTS user_wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) DEFAULT 0.00,
    total_deposited DECIMAL(12, 2) DEFAULT 0.00,
    total_spent DECIMAL(12, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    is_frozen BOOLEAN DEFAULT FALSE,
    frozen_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Deposit Requests (pending deposits awaiting admin confirmation)
CREATE TABLE IF NOT EXISTS wallet_deposit_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL, -- 'mpesa', 'paypal', 'crypto_usdt', 'crypto_btc', 'bank_transfer'
    payment_reference VARCHAR(255), -- M-Pesa code, PayPal transaction ID, crypto tx hash
    payment_proof_url TEXT, -- Screenshot/receipt upload
    phone_number VARCHAR(50), -- For M-Pesa
    crypto_address VARCHAR(255), -- Wallet address used
    crypto_network VARCHAR(50), -- 'TRC20', 'ERC20', 'BTC'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
    admin_notes TEXT,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallet Transactions (all movements)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'deposit', 'purchase', 'refund', 'withdrawal', 'bonus', 'transfer_in', 'transfer_out'
    amount DECIMAL(12, 2) NOT NULL,
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- 'bot_purchase', 'product_purchase', 'signal_subscription', 'deposit_request', 'refund'
    reference_id INTEGER, -- ID of the related purchase/deposit
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform Payment Accounts (where users send money)
CREATE TABLE IF NOT EXISTS platform_payment_accounts (
    id SERIAL PRIMARY KEY,
    payment_method VARCHAR(50) NOT NULL, -- 'mpesa', 'paypal', 'crypto_usdt', 'crypto_btc', 'bank_transfer'
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255), -- Phone for M-Pesa, email for PayPal
    account_details JSONB DEFAULT '{}', -- Additional details (bank name, branch, etc.)
    crypto_address VARCHAR(255),
    crypto_network VARCHAR(50),
    qr_code_url TEXT,
    instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    min_amount DECIMAL(12, 2) DEFAULT 5.00,
    max_amount DECIMAL(12, 2) DEFAULT 10000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace Purchases (unified purchase records)
CREATE TABLE IF NOT EXISTS marketplace_purchases (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES users(id),
    item_type VARCHAR(50) NOT NULL, -- 'bot', 'product', 'signal_subscription'
    item_id INTEGER NOT NULL,
    item_name VARCHAR(255),
    price DECIMAL(12, 2) NOT NULL,
    platform_commission DECIMAL(12, 2) NOT NULL,
    seller_earnings DECIMAL(12, 2) NOT NULL,
    commission_rate DECIMAL(5, 2) DEFAULT 20.00, -- Admin receives 20%, Seller receives 80%
    wallet_transaction_id INTEGER REFERENCES wallet_transactions(id),
    status VARCHAR(20) DEFAULT 'completed', -- 'completed', 'refunded', 'disputed'
    access_granted BOOLEAN DEFAULT TRUE,
    refund_reason TEXT,
    refunded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform Earnings (your commission tracking)
CREATE TABLE IF NOT EXISTS platform_earnings (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL, -- 'marketplace_commission', 'verification_fee', 'withdrawal_fee', 'deposit_fee'
    source_id INTEGER,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_deposit_requests_user_id ON wallet_deposit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_deposit_requests_status ON wallet_deposit_requests(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer_id ON marketplace_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_seller_id ON marketplace_purchases(seller_id);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_source_type ON platform_earnings(source_type);

-- Insert default platform payment accounts
INSERT INTO platform_payment_accounts (payment_method, account_name, account_number, instructions, display_order) VALUES
('mpesa', 'AlgoEdge', '0712345678', 'Send money to this M-Pesa number and include your email in the description. Screenshot the confirmation.', 1),
('paypal', 'AlgoEdge', 'payments@algoedge.io', 'Send as Friends & Family to avoid fees. Include your registered email in the note.', 2)
ON CONFLICT DO NOTHING;

INSERT INTO platform_payment_accounts (payment_method, account_name, crypto_address, crypto_network, instructions, display_order) VALUES
('crypto_usdt', 'AlgoEdge USDT', 'TYourUSDTAddressHere', 'TRC20', 'Send USDT (TRC20 network only) to this address. Copy the transaction hash after sending.', 3),
('crypto_btc', 'AlgoEdge BTC', 'bc1YourBTCAddressHere', 'Bitcoin', 'Send BTC to this address. Minimum 2 confirmations required. Copy the transaction hash.', 4)
ON CONFLICT DO NOTHING;
