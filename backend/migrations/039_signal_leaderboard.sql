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
  u.profile_photo_url,
  sp.total_signals,
  sp.winning_signals,
  sp.losing_signals,
  sp.win_rate,
  sp.total_pips,
  sp.avg_pips_per_signal,
  sp.monthly_pips,
  sp.show_on_leaderboard,
  COUNT(DISTINCT ss.user_id) as subscriber_count,
  sp.updated_at
FROM signal_providers sp
JOIN users u ON sp.user_id = u.id
LEFT JOIN signal_subscriptions ss ON sp.id = ss.provider_id AND ss.status = 'active'
WHERE sp.show_on_leaderboard = true
GROUP BY sp.id, sp.user_id, u.username, u.profile_photo_url
ORDER BY sp.win_rate DESC, sp.total_pips DESC;
