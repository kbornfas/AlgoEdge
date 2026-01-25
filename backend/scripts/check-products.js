import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function check() {
  const result = await pool.query('SELECT slug, name FROM marketplace_products ORDER BY slug');
  console.log('Products in database:');
  result.rows.forEach(row => console.log(`  ${row.slug} -> ${row.name}`));
  await pool.end();
}

check().catch(console.error);
