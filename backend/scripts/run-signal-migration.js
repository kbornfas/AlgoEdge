// Run the signal subscriptions migration
import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const client = await pool.connect();
  
  try {
    // Check which tables already exist
    const existingTables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tableNames = existingTables.rows.map(r => r.table_name);
    
    console.log('Existing signal-related tables:', tableNames.filter(t => t.includes('signal')));
    
    // Create tables that don't exist
    await client.query('BEGIN');
    
    // Signal tiers
    if (!tableNames.includes('signal_tiers')) {
      console.log('Creating signal_tiers table...');
      await client.query(`
        CREATE TABLE signal_tiers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL UNIQUE,
          slug VARCHAR(50) NOT NULL UNIQUE,
          description TEXT,
          price DECIMAL(10,2) NOT NULL DEFAULT 0,
          billing_period VARCHAR(20) DEFAULT 'monthly',
          features JSONB DEFAULT '[]',
          max_signals_per_day INTEGER,
          signal_delay_minutes INTEGER DEFAULT 0,
          includes_entry BOOLEAN DEFAULT TRUE,
          includes_sl_tp BOOLEAN DEFAULT TRUE,
          includes_analysis BOOLEAN DEFAULT FALSE,
          includes_vip_channel BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Signal subscriptions
    if (!tableNames.includes('signal_subscriptions')) {
      console.log('Creating signal_subscriptions table...');
      await client.query(`
        CREATE TABLE signal_subscriptions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          tier_id INTEGER REFERENCES signal_tiers(id),
          status VARCHAR(20) DEFAULT 'active',
          stripe_subscription_id VARCHAR(255),
          current_period_start TIMESTAMP,
          current_period_end TIMESTAMP,
          signals_received_today INTEGER DEFAULT 0,
          last_signal_date DATE,
          telegram_chat_id VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        )
      `);
    }
    
    // Master accounts
    if (!tableNames.includes('master_accounts')) {
      console.log('Creating master_accounts table...');
      await client.query(`
        CREATE TABLE master_accounts (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          account_id VARCHAR(255) NOT NULL,
          broker VARCHAR(255) NOT NULL,
          login VARCHAR(255) NOT NULL,
          password_encrypted VARCHAR(500),
          server VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          total_signals_sent INTEGER DEFAULT 0,
          win_rate DECIMAL(5,2) DEFAULT 0,
          total_pips DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default master account
      await client.query(`
        INSERT INTO master_accounts (name, account_id, broker, login, server)
        VALUES ('AlgoEdge Main', '12345', 'AlgoEdge', 'main', 'AlgoEdge-Live')
      `);
    }
    
    // Trading signals
    if (!tableNames.includes('trading_signals')) {
      console.log('Creating trading_signals table...');
      await client.query(`
        CREATE TABLE trading_signals (
          id SERIAL PRIMARY KEY,
          master_account_id INTEGER REFERENCES master_accounts(id),
          signal_type VARCHAR(20) NOT NULL,
          symbol VARCHAR(20) NOT NULL,
          entry_price DECIMAL(15,5),
          stop_loss DECIMAL(15,5),
          take_profit_1 DECIMAL(15,5),
          take_profit_2 DECIMAL(15,5),
          take_profit_3 DECIMAL(15,5),
          risk_reward DECIMAL(5,2),
          analysis TEXT,
          timeframe VARCHAR(10),
          confidence VARCHAR(20),
          status VARCHAR(20) DEFAULT 'active',
          result_pips DECIMAL(10,2),
          closed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Signal deliveries
    if (!tableNames.includes('signal_deliveries')) {
      console.log('Creating signal_deliveries table...');
      await client.query(`
        CREATE TABLE signal_deliveries (
          id SERIAL PRIMARY KEY,
          signal_id INTEGER REFERENCES trading_signals(id),
          user_id INTEGER REFERENCES users(id),
          tier_id INTEGER REFERENCES signal_tiers(id),
          delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          delivery_method VARCHAR(20) DEFAULT 'telegram',
          telegram_message_id VARCHAR(50)
        )
      `);
    }
    
    // Signal channels
    if (!tableNames.includes('signal_channels')) {
      console.log('Creating signal_channels table...');
      await client.query(`
        CREATE TABLE signal_channels (
          id SERIAL PRIMARY KEY,
          tier_id INTEGER REFERENCES signal_tiers(id),
          channel_id VARCHAR(100) NOT NULL,
          channel_name VARCHAR(255),
          channel_link VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(tier_id)
        )
      `);
    }
    
    // Insert default tiers if not exist
    const tiersExist = await client.query(`SELECT COUNT(*) FROM signal_tiers`);
    if (parseInt(tiersExist.rows[0].count) === 0) {
      console.log('Inserting default signal tiers...');
      await client.query(`
        INSERT INTO signal_tiers (name, slug, description, price, billing_period, features, max_signals_per_day, signal_delay_minutes, includes_entry, includes_sl_tp, includes_analysis, includes_vip_channel, sort_order)
        VALUES 
        ('Free Signals', 'free', 'Get started with basic trading signals', 0, 'monthly', '["3 signals per day", "15-minute delay", "Entry price only", "Basic support"]', 3, 15, TRUE, FALSE, FALSE, FALSE, 1),
        ('Basic', 'basic', 'Essential signals for active traders', 27, 'monthly', '["10 signals per day", "5-minute delay", "Entry + SL/TP", "Email support", "Weekly market recap"]', 10, 5, TRUE, TRUE, FALSE, FALSE, 2),
        ('Premium', 'premium', 'Advanced signals with detailed analysis', 67, 'monthly', '["Unlimited signals", "Real-time delivery", "Entry + SL/TP", "Full analysis", "Priority support", "Daily market briefing"]', NULL, 0, TRUE, TRUE, TRUE, FALSE, 3),
        ('VIP', 'vip', 'Elite access with exclusive features', 147, 'monthly', '["Unlimited signals", "Real-time delivery", "Entry + SL/TP", "Full analysis", "VIP channel access", "1-on-1 support", "Copy trading setup", "Monthly strategy call"]', NULL, 0, TRUE, TRUE, TRUE, TRUE, 4)
      `);
    }
    
    // Create indexes
    console.log('Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_user ON signal_subscriptions(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_status ON signal_subscriptions(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trading_signals_created ON trading_signals(created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON trading_signals(symbol)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_signal_deliveries_user ON signal_deliveries(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_signal_deliveries_signal ON signal_deliveries(signal_id)`);
    
    await client.query('COMMIT');
    
    console.log('✅ Signal subscription migration completed!');
    
    // Show tier summary
    const tiers = await client.query('SELECT name, slug, price FROM signal_tiers ORDER BY sort_order');
    console.log('\nSignal Tiers:');
    tiers.rows.forEach(t => console.log(`  - ${t.name} (${t.slug}): $${t.price}/month`));
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
