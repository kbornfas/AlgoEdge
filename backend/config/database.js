import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.join(__dirname, '..', '.env.test') });
} else {
  dotenv.config();
}

const { Pool } = pg;

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Database initialization function
export const `initDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        phone VARCHAR(20),
        country VARCHAR(100),
        timezone VARCHAR(50) DEFAULT 'UTC',
        is_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        verification_expires TIMESTAMP,
        verification_code VARCHAR(10),
        verification_code_expires TIMESTAMP,
        verification_code_attempts INTEGER DEFAULT 0,
        two_fa_enabled BOOLEAN DEFAULT false,
        two_fa_secret VARCHAR(255),
        reset_token VARCHAR(255),
        reset_expires TIMESTAMP,
        reset_code VARCHAR(10),
        reset_code_expires TIMESTAMP,
        reset_code_attempts INTEGER DEFAULT 0,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        plan VARCHAR(50) DEFAULT 'free',
        status VARCHAR(50) DEFAULT 'active',
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `);

    // MT5 Accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS mt5_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        account_id VARCHAR(50) NOT NULL,
        server VARCHAR(100) NOT NULL,
        api_key TEXT,
        api_secret TEXT,
        is_demo BOOLEAN DEFAULT true,
        is_connected BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'disconnected',
        balance DECIMAL(15, 2) DEFAULT 0,
        equity DECIMAL(15, 2) DEFAULT 0,
        last_sync TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Trading Robots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trading_robots (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        strategy VARCHAR(100),
        timeframe VARCHAR(10),
        risk_level VARCHAR(20),
        win_rate DECIMAL(5, 2),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User Robot Configurations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_robot_configs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        robot_id VARCHAR(50) REFERENCES trading_robots(id),
        is_enabled BOOLEAN DEFAULT false,
        settings JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, robot_id)
      );
    `);

    // Trades table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        robot_id VARCHAR(50) REFERENCES trading_robots(id),
        mt5_account_id INTEGER REFERENCES mt5_accounts(id),
        pair VARCHAR(20) NOT NULL,
        type VARCHAR(10) NOT NULL,
        volume DECIMAL(10, 2) NOT NULL,
        open_price DECIMAL(15, 5) NOT NULL,
        close_price DECIMAL(15, 5),
        stop_loss DECIMAL(15, 5),
        take_profit DECIMAL(15, 5),
        profit DECIMAL(15, 2),
        status VARCHAR(20) DEFAULT 'open',
        open_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        close_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email_notifications BOOLEAN DEFAULT true,
        trade_alerts BOOLEAN DEFAULT true,
        daily_reports BOOLEAN DEFAULT false,
        risk_level VARCHAR(20) DEFAULT 'medium',
        stop_loss_percent DECIMAL(5, 2) DEFAULT 2.0,
        take_profit_percent DECIMAL(5, 2) DEFAULT 5.0,
        auto_close_profit BOOLEAN DEFAULT false,
        theme VARCHAR(20) DEFAULT 'dark',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `);

    // Verification Codes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email, type)
      );
    `);

    // Audit Logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        details JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
      CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
      CREATE INDEX IF NOT EXISTS idx_trades_open_time ON trades(open_time);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_verification_codes_email_type ON verification_codes(email, type);
      CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);
    `);

    // Insert default trading robots
    await client.query(`
      INSERT INTO trading_robots (id, name, description, strategy, timeframe, risk_level, win_rate)
      VALUES 
        ('algoedge_1_0', 'AlgoEdge 1.0', 'Triple EMA + RSI System', 'Trend Following', 'M15', 'Medium', 72.0),
        ('ea888', 'EA888', 'Ichimoku Cloud Breakout', 'Breakout', 'M30', 'High', 68.0),
        ('poverty_killer', 'Poverty Killer', 'Aggressive Momentum Strategy', 'Momentum', 'H1', 'High', 76.0),
        ('golden_sniper', 'Golden Sniper', 'Fibonacci + Stochastic', 'Precision Entry', 'M15', 'Medium', 70.0),
        ('scalp_master_pro', 'Scalp Master Pro', 'High-Frequency Scalping', 'Scalping', 'M5', 'Medium', 65.0),
        ('trend_dominator', 'Trend Dominator', 'ADX + Parabolic SAR', 'Trend Riding', 'H4', 'Low', 74.0),
        ('profit_maximizer', 'Profit Maximizer', 'Donchian Channel + RSI', 'Breakout', 'H1', 'Medium', 69.0)
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ Database initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
