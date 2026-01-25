-- Migration: Add Affiliate/Referral System
-- Description: Adds referral tracking and affiliate commission tables

-- Add referral columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by INT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS affiliate_tier VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS affiliate_commission_rate DECIMAL(5,2) DEFAULT 10.00;

-- Create index for referral lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- Create affiliate_commissions table
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id SERIAL PRIMARY KEY,
  affiliate_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id INT REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid, cancelled
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  payout_id INT -- Reference to payout batch
);

-- Create indexes for affiliate_commissions
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON affiliate_commissions(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_referred ON affiliate_commissions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_created ON affiliate_commissions(created_at);

-- Create affiliate_payouts table for payout tracking
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payout_method VARCHAR(50) NOT NULL, -- paypal, usdt, btc, bank
  payout_address VARCHAR(255), -- Email, wallet address, or bank details reference
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, rejected
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  processed_by INT REFERENCES users(id), -- Admin who processed
  transaction_id VARCHAR(255), -- External transaction reference
  notes TEXT
);

-- Create indexes for affiliate_payouts
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_user ON affiliate_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);

-- Create affiliate_stats view for easy querying
CREATE OR REPLACE VIEW affiliate_stats AS
SELECT 
  u.id AS user_id,
  u.username,
  u.referral_code,
  u.affiliate_tier,
  u.affiliate_commission_rate,
  COUNT(DISTINCT ref.id) AS total_referrals,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN ref.id END) AS active_referrals,
  COALESCE(SUM(CASE WHEN ac.status IN ('approved', 'paid') THEN ac.amount END), 0) AS total_earnings,
  COALESCE(SUM(CASE WHEN ac.status = 'pending' THEN ac.amount END), 0) AS pending_earnings,
  COALESCE(SUM(CASE WHEN ac.status = 'approved' THEN ac.amount END), 0) AS available_for_payout
FROM users u
LEFT JOIN users ref ON ref.referred_by = u.id
LEFT JOIN subscriptions s ON s.user_id = ref.id
LEFT JOIN affiliate_commissions ac ON ac.affiliate_user_id = u.id
WHERE u.referral_code IS NOT NULL
GROUP BY u.id, u.username, u.referral_code, u.affiliate_tier, u.affiliate_commission_rate;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  new_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a code like: ALGO + 4 random alphanumeric characters
    new_code := 'ALGO' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code for new users
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists to avoid conflicts)
DROP TRIGGER IF EXISTS trigger_set_referral_code ON users;
CREATE TRIGGER trigger_set_referral_code
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION set_referral_code();

-- Function to calculate and create commission when subscription is paid
CREATE OR REPLACE FUNCTION create_affiliate_commission()
RETURNS TRIGGER AS $$
DECLARE
  affiliate_id INT;
  affiliate_rate DECIMAL(5,2);
  commission_amount DECIMAL(10,2);
  subscription_amount DECIMAL(10,2);
BEGIN
  -- Only process when subscription becomes active or renews
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    -- Get the referrer (affiliate) of the subscribing user
    SELECT referred_by INTO affiliate_id FROM users WHERE id = NEW.user_id;
    
    IF affiliate_id IS NOT NULL THEN
      -- Get affiliate's commission rate
      SELECT affiliate_commission_rate INTO affiliate_rate 
      FROM users WHERE id = affiliate_id;
      
      -- Calculate subscription amount based on plan
      subscription_amount := CASE NEW.plan
        WHEN 'weekly' THEN 19.00
        WHEN 'monthly' THEN 49.00
        WHEN 'quarterly' THEN 149.00
        ELSE 0
      END;
      
      -- Calculate commission
      commission_amount := subscription_amount * (affiliate_rate / 100);
      
      -- Create commission record
      IF commission_amount > 0 THEN
        INSERT INTO affiliate_commissions (
          affiliate_user_id,
          referred_user_id,
          subscription_id,
          amount,
          commission_rate,
          period_start,
          period_end
        ) VALUES (
          affiliate_id,
          NEW.user_id,
          NEW.id,
          commission_amount,
          affiliate_rate,
          NEW.current_period_start,
          NEW.current_period_end
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for commission calculation
DROP TRIGGER IF EXISTS trigger_create_affiliate_commission ON subscriptions;
CREATE TRIGGER trigger_create_affiliate_commission
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION create_affiliate_commission();

-- Update existing users to have referral codes
UPDATE users SET referral_code = generate_referral_code() WHERE referral_code IS NULL;

-- Comment on tables
COMMENT ON TABLE affiliate_commissions IS 'Tracks all affiliate commissions earned from referrals';
COMMENT ON TABLE affiliate_payouts IS 'Tracks affiliate payout requests and processing';
COMMENT ON COLUMN users.referral_code IS 'Unique referral code for affiliate tracking';
COMMENT ON COLUMN users.referred_by IS 'User ID of the affiliate who referred this user';
COMMENT ON COLUMN users.affiliate_tier IS 'Affiliate tier: standard, elite, or vip';
COMMENT ON COLUMN users.affiliate_commission_rate IS 'Commission percentage for this affiliate';
