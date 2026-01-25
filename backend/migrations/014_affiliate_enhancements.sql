-- Migration: Enhanced Affiliate System
-- Description: Adds wallet ledger, audit trail, anti-fraud measures, and admin features

-- =====================================================
-- 1. AFFILIATE WALLETS (Full Ledger System)
-- =====================================================

-- Create affiliate_wallets table for balance tracking
CREATE TABLE IF NOT EXISTS affiliate_wallets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_earned DECIMAL(12,2) DEFAULT 0.00,
  pending DECIMAL(12,2) DEFAULT 0.00,
  available_balance DECIMAL(12,2) DEFAULT 0.00,
  withdrawn DECIMAL(12,2) DEFAULT 0.00,
  held DECIMAL(12,2) DEFAULT 0.00, -- Held for processing payouts
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_affiliate_wallets_user ON affiliate_wallets(user_id);

-- Create wallet transactions ledger for full audit trail
CREATE TABLE IF NOT EXISTS affiliate_wallet_transactions (
  id SERIAL PRIMARY KEY,
  wallet_id INT NOT NULL REFERENCES affiliate_wallets(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL, -- 'commission_pending', 'commission_approved', 'withdrawal_request', 'withdrawal_completed', 'withdrawal_rejected', 'adjustment'
  amount DECIMAL(12,2) NOT NULL, -- Positive for credits, negative for debits
  balance_before DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  reference_type VARCHAR(30), -- 'commission', 'payout', 'adjustment'
  reference_id INT, -- ID of related commission/payout
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT REFERENCES users(id) -- Admin who made adjustment if applicable
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON affiliate_wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON affiliate_wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON affiliate_wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON affiliate_wallet_transactions(created_at);

-- =====================================================
-- 2. AUDIT LOGGING SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS affiliate_audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL, -- 'commission_created', 'commission_approved', 'payout_requested', 'payout_approved', etc.
  actor_id INT REFERENCES users(id), -- User who performed the action
  target_user_id INT REFERENCES users(id), -- User being affected
  entity_type VARCHAR(50), -- 'commission', 'payout', 'wallet', 'user'
  entity_id INT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON affiliate_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON affiliate_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON affiliate_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON affiliate_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON affiliate_audit_logs(created_at);

-- =====================================================
-- 3. ANTI-FRAUD ENHANCEMENTS
-- =====================================================

-- Add anti-fraud columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS signup_ip INET,
ADD COLUMN IF NOT EXISTS last_login_ip INET,
ADD COLUMN IF NOT EXISTS fraud_score INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS fraud_flags JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS affiliate_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS affiliate_blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS affiliate_blocked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS referral_cookie_id VARCHAR(100);

-- Create fraud detection table for flagged activities
CREATE TABLE IF NOT EXISTS affiliate_fraud_flags (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  flag_type VARCHAR(50) NOT NULL, -- 'self_referral', 'duplicate_ip', 'rapid_signups', 'suspicious_pattern'
  severity VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  description TEXT,
  evidence JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by INT REFERENCES users(id),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_user ON affiliate_fraud_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_type ON affiliate_fraud_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_resolved ON affiliate_fraud_flags(resolved);

-- =====================================================
-- 4. ENHANCED COMMISSION TRACKING
-- =====================================================

-- Add columns to affiliate_commissions table
ALTER TABLE affiliate_commissions
ADD COLUMN IF NOT EXISTS unlock_date TIMESTAMP, -- When commission becomes available (after refund window)
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'subscription', -- 'subscription', 'product', 'signal', 'bot_rental'
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(30), -- 'stripe', 'whop', 'crypto'
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255), -- External payment reference
ADD COLUMN IF NOT EXISTS refunded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS tier_at_creation VARCHAR(20), -- Tier when commission was created
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update status enum possibilities
-- pending -> waiting for payment confirmation
-- locked -> payment confirmed, waiting for refund window
-- approved -> available for payout
-- processing -> included in payout request
-- paid -> payout completed
-- cancelled -> cancelled due to refund or fraud
-- expired -> auto-cancelled after 90 days if never activated

-- =====================================================
-- 5. REFERRAL TRACKING ENHANCEMENTS
-- =====================================================

-- Create referral_tracking table for cookie-based tracking
CREATE TABLE IF NOT EXISTS referral_tracking (
  id SERIAL PRIMARY KEY,
  cookie_id VARCHAR(100) NOT NULL UNIQUE,
  referral_code VARCHAR(20) NOT NULL,
  affiliate_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  landing_page TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  converted BOOLEAN DEFAULT FALSE,
  converted_user_id INT REFERENCES users(id),
  converted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '90 days')
);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_cookie ON referral_tracking(cookie_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_code ON referral_tracking(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_affiliate ON referral_tracking(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_expires ON referral_tracking(expires_at);

-- =====================================================
-- 6. PAYOUT ENHANCEMENTS
-- =====================================================

-- Add columns to affiliate_payouts table
ALTER TABLE affiliate_payouts
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS processing_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET;

-- =====================================================
-- 7. TERMS ACCEPTANCE TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS affiliate_terms_acceptance (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  terms_version VARCHAR(20) NOT NULL,
  accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_terms_acceptance_user ON affiliate_terms_acceptance(user_id);

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to create/get wallet for user
CREATE OR REPLACE FUNCTION get_or_create_affiliate_wallet(p_user_id INT)
RETURNS affiliate_wallets AS $$
DECLARE
  wallet affiliate_wallets;
BEGIN
  SELECT * INTO wallet FROM affiliate_wallets WHERE user_id = p_user_id;
  
  IF wallet.id IS NULL THEN
    INSERT INTO affiliate_wallets (user_id)
    VALUES (p_user_id)
    RETURNING * INTO wallet;
  END IF;
  
  RETURN wallet;
END;
$$ LANGUAGE plpgsql;

-- Function to add wallet transaction
CREATE OR REPLACE FUNCTION add_wallet_transaction(
  p_user_id INT,
  p_type VARCHAR(30),
  p_amount DECIMAL(12,2),
  p_reference_type VARCHAR(30),
  p_reference_id INT,
  p_description TEXT,
  p_created_by INT DEFAULT NULL
)
RETURNS affiliate_wallet_transactions AS $$
DECLARE
  wallet affiliate_wallets;
  transaction_record affiliate_wallet_transactions;
  new_balance DECIMAL(12,2);
BEGIN
  -- Get or create wallet
  SELECT * INTO wallet FROM get_or_create_affiliate_wallet(p_user_id);
  
  -- Calculate new balance based on transaction type
  CASE p_type
    WHEN 'commission_pending' THEN
      new_balance := wallet.pending + p_amount;
      UPDATE affiliate_wallets SET pending = new_balance, updated_at = NOW() WHERE id = wallet.id;
    WHEN 'commission_approved' THEN
      new_balance := wallet.available_balance + p_amount;
      UPDATE affiliate_wallets SET 
        pending = pending - p_amount,
        available_balance = new_balance,
        total_earned = total_earned + p_amount,
        updated_at = NOW()
      WHERE id = wallet.id;
    WHEN 'withdrawal_request' THEN
      new_balance := wallet.available_balance - ABS(p_amount);
      UPDATE affiliate_wallets SET 
        available_balance = new_balance,
        held = held + ABS(p_amount),
        updated_at = NOW()
      WHERE id = wallet.id;
    WHEN 'withdrawal_completed' THEN
      new_balance := wallet.held - ABS(p_amount);
      UPDATE affiliate_wallets SET 
        held = new_balance,
        withdrawn = withdrawn + ABS(p_amount),
        updated_at = NOW()
      WHERE id = wallet.id;
    WHEN 'withdrawal_rejected' THEN
      new_balance := wallet.available_balance + ABS(p_amount);
      UPDATE affiliate_wallets SET 
        held = held - ABS(p_amount),
        available_balance = new_balance,
        updated_at = NOW()
      WHERE id = wallet.id;
    WHEN 'commission_cancelled' THEN
      IF wallet.pending >= ABS(p_amount) THEN
        new_balance := wallet.pending - ABS(p_amount);
        UPDATE affiliate_wallets SET pending = new_balance, updated_at = NOW() WHERE id = wallet.id;
      ELSE
        new_balance := wallet.available_balance - ABS(p_amount);
        UPDATE affiliate_wallets SET available_balance = new_balance, updated_at = NOW() WHERE id = wallet.id;
      END IF;
    ELSE
      new_balance := wallet.available_balance + p_amount;
      UPDATE affiliate_wallets SET available_balance = new_balance, updated_at = NOW() WHERE id = wallet.id;
  END CASE;
  
  -- Get updated wallet
  SELECT * INTO wallet FROM affiliate_wallets WHERE id = wallet.id;
  
  -- Create transaction record
  INSERT INTO affiliate_wallet_transactions (
    wallet_id, user_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, description, created_by
  ) VALUES (
    wallet.id, p_user_id, p_type, p_amount, wallet.available_balance - p_amount, wallet.available_balance,
    p_reference_type, p_reference_id, p_description, p_created_by
  )
  RETURNING * INTO transaction_record;
  
  RETURN transaction_record;
END;
$$ LANGUAGE plpgsql;

-- Function to check for fraud patterns
CREATE OR REPLACE FUNCTION check_referral_fraud(
  p_referrer_id INT,
  p_referred_id INT,
  p_ip_address INET
)
RETURNS TABLE(is_fraud BOOLEAN, fraud_type VARCHAR(50), fraud_reason TEXT) AS $$
BEGIN
  -- Check 1: Self-referral
  IF p_referrer_id = p_referred_id THEN
    RETURN QUERY SELECT TRUE, 'self_referral'::VARCHAR(50), 'User attempted to refer themselves'::TEXT;
    RETURN;
  END IF;
  
  -- Check 2: Same IP address
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_referrer_id 
    AND (signup_ip = p_ip_address OR last_login_ip = p_ip_address)
  ) THEN
    RETURN QUERY SELECT TRUE, 'duplicate_ip'::VARCHAR(50), 'Referral from same IP as referrer'::TEXT;
    RETURN;
  END IF;
  
  -- Check 3: Rapid signups from same referrer (more than 10 in 24 hours)
  IF (
    SELECT COUNT(*) FROM users 
    WHERE referred_by = p_referrer_id 
    AND created_at > NOW() - INTERVAL '24 hours'
  ) > 10 THEN
    RETURN QUERY SELECT TRUE, 'rapid_signups'::VARCHAR(50), 'Too many referrals in 24 hours'::TEXT;
    RETURN;
  END IF;
  
  -- Check 4: Referrer is blocked
  IF EXISTS (
    SELECT 1 FROM users WHERE id = p_referrer_id AND affiliate_blocked = TRUE
  ) THEN
    RETURN QUERY SELECT TRUE, 'blocked_referrer'::VARCHAR(50), 'Referrer is blocked from affiliate program'::TEXT;
    RETURN;
  END IF;
  
  -- No fraud detected
  RETURN QUERY SELECT FALSE, NULL::VARCHAR(50), NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. UPDATE COMMISSION TRIGGER FOR WALLET
-- =====================================================

-- Update commission trigger to use wallet system
CREATE OR REPLACE FUNCTION create_affiliate_commission_with_wallet()
RETURNS TRIGGER AS $$
DECLARE
  affiliate_id INT;
  affiliate_rate DECIMAL(5,2);
  commission_amount DECIMAL(10,2);
  subscription_amount DECIMAL(10,2);
  affiliate_tier VARCHAR(20);
  unlock_timestamp TIMESTAMP;
BEGIN
  -- Only process when subscription becomes active
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    -- Get the referrer (affiliate)
    SELECT referred_by INTO affiliate_id FROM users WHERE id = NEW.user_id;
    
    IF affiliate_id IS NOT NULL THEN
      -- Get affiliate's commission rate and tier
      SELECT affiliate_commission_rate, affiliate_tier 
      INTO affiliate_rate, affiliate_tier
      FROM users WHERE id = affiliate_id;
      
      -- Calculate subscription amount
      subscription_amount := CASE NEW.plan
        WHEN 'weekly' THEN 19.00
        WHEN 'monthly' THEN 49.00
        WHEN 'quarterly' THEN 149.00
        ELSE 0
      END;
      
      -- Calculate commission
      commission_amount := subscription_amount * (COALESCE(affiliate_rate, 10) / 100);
      
      -- Set unlock date (7 days after for refund window)
      unlock_timestamp := NOW() + INTERVAL '7 days';
      
      IF commission_amount > 0 THEN
        -- Create commission record with pending status
        INSERT INTO affiliate_commissions (
          affiliate_user_id, referred_user_id, subscription_id,
          amount, commission_rate, status, unlock_date,
          tier_at_creation, period_start, period_end
        ) VALUES (
          affiliate_id, NEW.user_id, NEW.id,
          commission_amount, COALESCE(affiliate_rate, 10), 'pending', unlock_timestamp,
          affiliate_tier, NEW.current_period_start, NEW.current_period_end
        );
        
        -- Add to wallet as pending
        PERFORM add_wallet_transaction(
          affiliate_id,
          'commission_pending',
          commission_amount,
          'commission',
          currval('affiliate_commissions_id_seq'),
          'Commission from referral subscription'
        );
        
        -- Log the action
        INSERT INTO affiliate_audit_logs (
          action, actor_id, target_user_id, entity_type, entity_id,
          new_values
        ) VALUES (
          'commission_created', NEW.user_id, affiliate_id, 'commission',
          currval('affiliate_commissions_id_seq'),
          jsonb_build_object(
            'amount', commission_amount,
            'rate', affiliate_rate,
            'plan', NEW.plan
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the old trigger
DROP TRIGGER IF EXISTS trigger_create_affiliate_commission ON subscriptions;
CREATE TRIGGER trigger_create_affiliate_commission_wallet
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION create_affiliate_commission_with_wallet();

-- =====================================================
-- 10. SCHEDULED JOB: Approve Pending Commissions
-- =====================================================

-- Function to approve commissions past their unlock date
CREATE OR REPLACE FUNCTION approve_pending_commissions()
RETURNS INT AS $$
DECLARE
  approved_count INT := 0;
  commission_record RECORD;
BEGIN
  FOR commission_record IN
    SELECT id, affiliate_user_id, amount
    FROM affiliate_commissions
    WHERE status = 'pending'
    AND unlock_date <= NOW()
    AND refunded = FALSE
  LOOP
    -- Update commission status
    UPDATE affiliate_commissions
    SET status = 'approved', updated_at = NOW()
    WHERE id = commission_record.id;
    
    -- Update wallet
    PERFORM add_wallet_transaction(
      commission_record.affiliate_user_id,
      'commission_approved',
      commission_record.amount,
      'commission',
      commission_record.id,
      'Commission approved after lock period'
    );
    
    approved_count := approved_count + 1;
  END LOOP;
  
  RETURN approved_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. CREATE WALLETS FOR EXISTING USERS
-- =====================================================

-- Create wallets for all existing users with referrals
INSERT INTO affiliate_wallets (user_id, total_earned, pending, available_balance, withdrawn)
SELECT 
  u.id,
  COALESCE(SUM(CASE WHEN ac.status IN ('approved', 'paid') THEN ac.amount END), 0),
  COALESCE(SUM(CASE WHEN ac.status = 'pending' THEN ac.amount END), 0),
  COALESCE(SUM(CASE WHEN ac.status = 'approved' THEN ac.amount END), 0),
  COALESCE(SUM(CASE WHEN ac.status = 'paid' THEN ac.amount END), 0)
FROM users u
LEFT JOIN affiliate_commissions ac ON ac.affiliate_user_id = u.id
WHERE u.referral_code IS NOT NULL
GROUP BY u.id
ON CONFLICT (user_id) DO UPDATE SET
  total_earned = EXCLUDED.total_earned,
  pending = EXCLUDED.pending,
  available_balance = EXCLUDED.available_balance,
  withdrawn = EXCLUDED.withdrawn,
  updated_at = NOW();

-- =====================================================
-- 12. COMMENTS
-- =====================================================

COMMENT ON TABLE affiliate_wallets IS 'Ledger for affiliate earnings with full balance tracking';
COMMENT ON TABLE affiliate_wallet_transactions IS 'Full audit trail of all wallet changes';
COMMENT ON TABLE affiliate_audit_logs IS 'Compliance audit log for all affiliate actions';
COMMENT ON TABLE affiliate_fraud_flags IS 'Fraud detection and investigation tracking';
COMMENT ON TABLE referral_tracking IS 'Cookie-based referral attribution tracking';
COMMENT ON TABLE affiliate_terms_acceptance IS 'Tracks user acceptance of affiliate terms';
