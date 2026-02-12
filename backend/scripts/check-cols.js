import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL?.trim(), max: 2 });

async function check() {
  const botCols = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'marketplace_bots'
    AND column_name IN ('is_free', 'discount_price', 'price_type')
  `);
  console.log('marketplace_bots has:', botCols.rows.map(r => r.column_name));

  const prodCols = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'marketplace_products'
    AND column_name IN ('is_free', 'discount_price', 'price_type', 'price')
  `);
  console.log('marketplace_products has:', prodCols.rows.map(r => r.column_name));

  await pool.end();
}

check().catch(e => { console.error(e); pool.end(); });
