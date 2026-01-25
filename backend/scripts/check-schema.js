import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkSchema() {
  const tables = ['marketplace_products', 'product_deliverables'];
  for (const table of tables) {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [table]);
    console.log(`\n${table} columns:`);
    if (result.rows.length === 0) {
      console.log('  (table does not exist)');
    } else {
      result.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
    }
  }
  await pool.end();
}

checkSchema();
