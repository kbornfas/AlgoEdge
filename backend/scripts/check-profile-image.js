import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  // Check current reviewer names
  const reviews = await pool.query('SELECT id, reviewer_name, reviewer_avatar FROM marketplace_product_reviews LIMIT 15');
  console.log('Current product reviews:');
  reviews.rows.forEach(row => console.log(row));
  
  await pool.end();
}

check().catch(e => { console.error(e); process.exit(1); });
