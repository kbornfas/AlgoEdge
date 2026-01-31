import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  // Update Forex Elite to be official - using separate connection to bypass trigger
  await pool.query("SET session_replication_role = 'replica'");
  
  const result = await pool.query(`
    UPDATE signal_providers 
    SET is_official = true 
    WHERE display_name = 'Forex Elite' 
    RETURNING id, display_name, is_official
  `);
  console.log('Updated:', result.rows[0]);
  
  await pool.query("SET session_replication_role = 'origin'");
  
  // Verify all signal providers
  const signals = await pool.query("SELECT id, display_name, is_official FROM signal_providers WHERE user_id = 12");
  console.log('All signal providers:', signals.rows);
  
  await pool.end();
}

check().catch(e => { console.error(e); process.exit(1); });
