import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  // Check signal_providers for badge/verified columns
  const cols = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'signal_providers' 
    AND (column_name LIKE '%verif%' OR column_name LIKE '%badge%' OR column_name LIKE '%official%')
  `);
  console.log('Signal provider badge columns:', cols.rows.map(x => x.column_name));
  
  // Check actual data
  const signals = await pool.query("SELECT id, display_name, is_official FROM signal_providers WHERE user_id = 12 LIMIT 3");
  console.log('Signal providers:', signals.rows);
  
  await pool.end();
}

check().catch(e => { console.error(e); process.exit(1); });
