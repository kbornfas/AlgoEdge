-- Add public profile visibility fields to users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS show_public_profile BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_bio TEXT,
ADD COLUMN IF NOT EXISTS trading_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS years_experience INT,
ADD COLUMN IF NOT EXISTS favorite_pairs TEXT,
ADD COLUMN IF NOT EXISTS social_twitter VARCHAR(255),
ADD COLUMN IF NOT EXISTS social_telegram VARCHAR(255),
ADD COLUMN IF NOT EXISTS social_discord VARCHAR(255);

-- Create public trader profiles view
CREATE OR REPLACE VIEW public_trader_profiles AS
SELECT 
  u.id,
  u.username,
  u.profile_image as profile_photo_url,
  u.profile_bio,
  u.trading_style,
  u.years_experience,
  u.favorite_pairs,
  u.social_twitter,
  u.social_telegram,
  u.social_discord,
  u.created_at,
  -- Signal provider status
  sp.id as signal_provider_id,
  sp.win_rate as signal_win_rate,
  sp.total_pips as signal_total_pips
FROM users u
LEFT JOIN signal_providers sp ON u.id = sp.user_id
WHERE u.show_public_profile = true;

-- Create index for profile queries
CREATE INDEX IF NOT EXISTS idx_users_public_profile 
ON users(show_public_profile) WHERE show_public_profile = true;
