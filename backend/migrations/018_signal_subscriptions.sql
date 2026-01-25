-- Signal Subscription System for AlgoEdge
-- Supports tiered signal services via Telegram

-- Signal subscription tiers
CREATE TABLE IF NOT EXISTS signal_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    billing_period VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly, lifetime
    features JSONB DEFAULT '[]',
    max_signals_per_day INTEGER, -- NULL = unlimited
    signal_delay_minutes INTEGER DEFAULT 0, -- Delay for lower tiers
    includes_entry BOOLEAN DEFAULT TRUE,
    includes_sl_tp BOOLEAN DEFAULT TRUE,
    includes_analysis BOOLEAN DEFAULT FALSE,
    includes_vip_channel BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User signal subscriptions
CREATE TABLE IF NOT EXISTS signal_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tier_id INTEGER REFERENCES signal_tiers(id),
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired, paused
    stripe_subscription_id VARCHAR(255),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    signals_received_today INTEGER DEFAULT 0,
    last_signal_date DATE,
    telegram_chat_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Master trading accounts (for signal generation)
CREATE TABLE IF NOT EXISTS master_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    broker VARCHAR(255) NOT NULL,
    login VARCHAR(255) NOT NULL,
    password_encrypted VARCHAR(500), -- Encrypted connection password
    server VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    total_signals_sent INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    total_pips DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Signals sent from master account
CREATE TABLE IF NOT EXISTS trading_signals (
    id SERIAL PRIMARY KEY,
    master_account_id INTEGER REFERENCES master_accounts(id),
    signal_type VARCHAR(20) NOT NULL, -- BUY, SELL, CLOSE, UPDATE
    symbol VARCHAR(20) NOT NULL,
    entry_price DECIMAL(15,5),
    stop_loss DECIMAL(15,5),
    take_profit_1 DECIMAL(15,5),
    take_profit_2 DECIMAL(15,5),
    take_profit_3 DECIMAL(15,5),
    risk_reward DECIMAL(5,2),
    analysis TEXT,
    timeframe VARCHAR(10), -- M1, M5, M15, H1, H4, D1
    confidence VARCHAR(20), -- LOW, MEDIUM, HIGH, VERY_HIGH
    status VARCHAR(20) DEFAULT 'active', -- active, tp1_hit, tp2_hit, tp3_hit, sl_hit, closed
    result_pips DECIMAL(10,2),
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Signal delivery tracking
CREATE TABLE IF NOT EXISTS signal_deliveries (
    id SERIAL PRIMARY KEY,
    signal_id INTEGER REFERENCES trading_signals(id),
    user_id INTEGER REFERENCES users(id),
    tier_id INTEGER REFERENCES signal_tiers(id),
    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_method VARCHAR(20) DEFAULT 'telegram', -- telegram, push, email
    telegram_message_id VARCHAR(50)
);

-- Telegram signal channels (for group broadcasts)
CREATE TABLE IF NOT EXISTS signal_channels (
    id SERIAL PRIMARY KEY,
    tier_id INTEGER REFERENCES signal_tiers(id),
    channel_id VARCHAR(100) NOT NULL,
    channel_name VARCHAR(255),
    channel_link VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tier_id)
);

-- Insert default signal tiers
INSERT INTO signal_tiers (name, slug, description, price, billing_period, features, max_signals_per_day, signal_delay_minutes, includes_entry, includes_sl_tp, includes_analysis, includes_vip_channel, sort_order)
VALUES 
(
    'Free Signals',
    'free',
    'Get started with basic trading signals',
    0,
    'monthly',
    '["3 signals per day", "15-minute delay", "Entry price only", "Basic support"]',
    3,
    15,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    1
),
(
    'Basic',
    'basic',
    'Essential signals for active traders',
    27,
    'monthly',
    '["10 signals per day", "5-minute delay", "Entry + SL/TP", "Email support", "Weekly market recap"]',
    10,
    5,
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    2
),
(
    'Premium',
    'premium',
    'Advanced signals with detailed analysis',
    67,
    'monthly',
    '["Unlimited signals", "Real-time delivery", "Entry + SL/TP", "Full analysis", "Priority support", "Daily market briefing"]',
    NULL,
    0,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    3
),
(
    'VIP',
    'vip',
    'Elite access with exclusive features',
    147,
    'monthly',
    '["Unlimited signals", "Real-time delivery", "Entry + SL/TP", "Full analysis", "VIP channel access", "1-on-1 support", "Copy trading setup", "Monthly strategy call"]',
    NULL,
    0,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    4
)
ON CONFLICT (slug) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_user ON signal_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_status ON signal_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created ON trading_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON trading_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_signal_deliveries_user ON signal_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_deliveries_signal ON signal_deliveries(signal_id);
