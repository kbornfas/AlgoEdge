import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTables() {
  try {
    // Check signal_provider_subscriptions
    const result1 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'signal_provider_subscriptions'
      ORDER BY ordinal_position
    `);
    
    if (result1.rows.length > 0) {
      console.log('\n📊 signal_provider_subscriptions columns:');
      console.table(result1.rows);
    } else {
      console.log('\n❌ signal_provider_subscriptions table does not exist');
    }
    
    // Check signal_subscriptions
    const result2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'signal_subscriptions'
      ORDER BY ordinal_position
    `);
    
    if (result2.rows.length > 0) {
      console.log('\n📊 signal_subscriptions columns:');
      console.table(result2.rows);
    } else {
      console.log('\n❌ signal_subscriptions table does not exist');
    }
    
    // Check marketplace_signals
    const result3 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'marketplace_signals'
      ORDER BY ordinal_position
    `);
    
    if (result3.rows.length > 0) {
      console.log('\n📊 marketplace_signals columns:');
      console.table(result3.rows);
    } else {
      console.log('\n❌ marketplace_signals table does not exist');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkTables();
