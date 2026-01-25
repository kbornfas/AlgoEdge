-- ============================================================================
-- SELLER VERIFICATION SYSTEM
-- $50 fee, ID verification (front/back), selfie, admin approval for blue badge
-- ============================================================================

-- Seller Verification Requests
CREATE TABLE IF NOT EXISTS seller_verification_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Verification Fee
    verification_fee DECIMAL(10, 2) DEFAULT 50.00,
    fee_paid BOOLEAN DEFAULT FALSE,
    fee_payment_method VARCHAR(50), -- 'mpesa', 'airtel_money', 'crypto'
    fee_payment_reference VARCHAR(255),
    fee_paid_at TIMESTAMP,
    
    -- ID Documents
    id_type VARCHAR(50) NOT NULL, -- 'national_id', 'driving_license', 'passport'
    id_front_url TEXT NOT NULL,
    id_back_url TEXT NOT NULL,
    
    -- Selfie
    selfie_url TEXT NOT NULL,
    
    -- Status
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'fee_pending', 'documents_submitted', 'approved', 'rejected'
    rejection_reason TEXT,
    
    -- Admin Review
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Add blue badge column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_blue_badge BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blue_badge_granted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_request_id INTEGER REFERENCES seller_verification_requests(id);

-- Update payment methods - limit to M-Pesa, Airtel Money, and Crypto
-- First, update any existing records to use the new method names
UPDATE platform_payment_accounts SET payment_method = 'airtel_money' WHERE payment_method = 'airtel';

-- Withdrawal settings update for the 3 methods only
INSERT INTO withdrawal_settings (setting_key, setting_value, description)
VALUES 
    ('allowed_methods', 'mpesa,airtel_money,crypto', 'Comma-separated list of allowed payment methods'),
    ('crypto_network', 'TRC20', 'Default crypto network (TRC20 for USDT)')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seller_verification_status ON seller_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_seller_verification_user ON seller_verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_users_blue_badge ON users(has_blue_badge) WHERE has_blue_badge = TRUE;
