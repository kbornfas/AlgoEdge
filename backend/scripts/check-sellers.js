import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSellers() {
  try {
    // Check columns in users table
    const cols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE 'seller%'
      ORDER BY column_name
    `);
    console.log('Seller columns in users table:', cols.rows.map(r => r.column_name));
    
    // Check signal_providers columns
    const spCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'signal_providers'
      ORDER BY column_name
    `);
    console.log('\nSignal providers columns:', spCols.rows.map(r => r.column_name));
    
    // Check marketplace_reviews
    const reviewCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'marketplace_reviews'
      ORDER BY column_name
    `);
    console.log('\nMarketplace reviews columns:', reviewCols.rows.map(r => r.column_name));
    
    // Check seller_media
    const mediaCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'seller_media'
      ORDER BY column_name
    `);
    console.log('\nSeller media columns:', mediaCols.rows.map(r => r.column_name));
    
  } finally {
    await pool.end();
  }
}

checkSellers();
