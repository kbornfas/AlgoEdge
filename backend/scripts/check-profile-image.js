import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  // Check Lian Hua's badge and verification status
  const result = await pool.query("SELECT id, username, full_name, has_blue_badge, is_verified, is_seller, is_verified_seller FROM users WHERE username = 'lianhua14feb'");
  console.log('Lian Hua user:', result.rows[0]);
  
  await pool.end();
}

check().catch(e => { console.error(e); process.exit(1); });
