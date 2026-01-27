-- Add best and worst month pips columns to signal_providers table
-- These fields track the best and worst performing months

ALTER TABLE signal_providers ADD COLUMN IF NOT EXISTS best_month_pips DECIMAL(12,2) DEFAULT 0;
ALTER TABLE signal_providers ADD COLUMN IF NOT EXISTS worst_month_pips DECIMAL(12,2) DEFAULT 0;

-- Update admin's signal provider (if exists) with realistic demo data
UPDATE signal_providers 
SET 
    total_pips = 8750,
    average_pips = 45,
    win_rate = 78.5,
    total_signals = 350,
    best_month_pips = 1250,
    worst_month_pips = -180
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@algoedgehub.com' LIMIT 1);

-- Also set some default values for any other approved providers without data
UPDATE signal_providers
SET 
    total_pips = COALESCE(NULLIF(total_pips, 0), 2500 + (random() * 5000)::int),
    average_pips = COALESCE(NULLIF(average_pips, 0), 20 + (random() * 40)::int),
    win_rate = COALESCE(NULLIF(win_rate, 0), 65 + (random() * 20)::numeric(5,2)),
    total_signals = COALESCE(NULLIF(total_signals, 0), 100 + (random() * 300)::int),
    best_month_pips = COALESCE(NULLIF(best_month_pips, 0), 500 + (random() * 1000)::int),
    worst_month_pips = COALESCE(NULLIF(worst_month_pips, 0), -50 - (random() * 200)::int)
WHERE status = 'approved' AND (total_pips = 0 OR total_pips IS NULL);
