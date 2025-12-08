-- Verification codes table for registration and other verification flows
CREATE TABLE IF NOT EXISTS verification_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'registration', 'password_reset', etc.
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  metadata JSONB, -- Store additional data like username, password_hash for registration
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(email, type)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_type ON verification_codes(email, type);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

-- Clean up expired codes periodically (manual or via cron job)
-- DELETE FROM verification_codes WHERE expires_at < NOW() AND used = false;
