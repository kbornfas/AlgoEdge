// Script to fix triggers and then seed reviews
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixTriggers() {
  try {
    // Drop ALL problematic triggers
    await pool.query('DROP TRIGGER IF EXISTS track_price_changes ON marketplace_bots');
    await pool.query('DROP TRIGGER IF EXISTS track_bot_price_changes ON marketplace_bots');
    await pool.query('DROP TRIGGER IF EXISTS update_bot_price_history ON marketplace_bots');
    await pool.query('DROP TRIGGER IF EXISTS track_product_price_changes ON marketplace_products');
    await pool.query('DROP TRIGGER IF EXISTS track_signal_price_changes ON signal_providers');
    await pool.query('DROP TRIGGER IF EXISTS track_provider_price_changes ON signal_providers');
    
    console.log('✅ Dropped problematic triggers');
    
    // List remaining triggers
    const triggers = await pool.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
    `);
    console.log('\nRemaining triggers:', triggers.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixTriggers();
