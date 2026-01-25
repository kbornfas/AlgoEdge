import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTables() {
  try {
    // Check marketplace_bots columns
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'marketplace_bots'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 marketplace_bots columns:');
    console.table(result.rows);
    
    // Check signal_providers
    const result2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'signal_providers'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 signal_providers columns:');
    console.table(result2.rows);
    
    // Check marketplace_products
    const result3 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'marketplace_products'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 marketplace_products columns:');
    console.table(result3.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkTables();
