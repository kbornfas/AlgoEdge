-- Add leaderboard visibility flag to signal providers
ALTER TABLE signal_providers 
ADD COLUMN IF NOT EXISTS show_on_leaderboard BOOLEAN DEFAULT true;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_signal_providers_leaderboard 
ON signal_providers(show_on_leaderboard, win_rate DESC, total_pips DESC) 
WHERE show_on_leaderboard = true;

-- Create signal provider stats view for efficient leaderboard queries
CREATE OR REPLACE VIEW signal_provider_leaderboard AS
SELECT 
  sp.id,
  sp.user_id,
  u.username,
  u.profile_image as profile_photo_url,
  COALESCE(sp.total_signals, 0) as total_signals,
  COALESCE(sp.winning_signals, 0) as winning_signals,
  COALESCE(sp.losing_signals, 0) as losing_signals,
  COALESCE(sp.win_rate, 0) as win_rate,
  COALESCE(sp.total_pips, 0) as total_pips,
  sp.show_on_leaderboard,
  COALESCE(sp.subscriber_count, 0) as subscriber_count,
  sp.updated_at
FROM signal_providers sp
JOIN users u ON sp.user_id = u.id
WHERE sp.show_on_leaderboard = true
ORDER BY sp.win_rate DESC, sp.total_pips DESC;
