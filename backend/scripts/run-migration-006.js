/**
 * Run migration 006: Add notification settings columns
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running migration 006: Add notification settings...');
    
    await client.query('BEGIN');
    
    // Add new columns if they don't exist
    const columns = [
      { name: 'weekly_reports', type: 'BOOLEAN DEFAULT true' },
      { name: 'market_news', type: 'BOOLEAN DEFAULT false' },
      { name: 'telegram_alerts', type: 'BOOLEAN DEFAULT false' },
      { name: 'telegram_chat_id', type: 'VARCHAR(50)' },
      { name: 'timezone', type: "VARCHAR(50) DEFAULT 'UTC'" },
      { name: 'trading_prefs', type: "JSONB DEFAULT '{}'" },
      { name: 'last_weekly_report', type: 'TIMESTAMP' },
      { name: 'last_daily_report', type: 'TIMESTAMP' },
    ];
    
    for (const col of columns) {
      try {
        await client.query(`
          ALTER TABLE user_settings 
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}
        `);
        console.log(`  ✅ Added column: ${col.name}`);
      } catch (err) {
        if (err.code === '42701') {
          console.log(`  ℹ️ Column ${col.name} already exists`);
        } else {
          throw err;
        }
      }
    }
    
    // Create indexes
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_settings_weekly_reports 
        ON user_settings(weekly_reports) WHERE weekly_reports = true
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_settings_trade_alerts 
        ON user_settings(trade_alerts) WHERE trade_alerts = true
      `);
      console.log('  ✅ Created indexes');
    } catch (err) {
      console.log('  ℹ️ Indexes may already exist');
    }
    
    await client.query('COMMIT');
    console.log('✅ Migration 006 completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
