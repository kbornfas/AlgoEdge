import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const result = await pool.query("SELECT id, username, profile_image, profile_picture, seller_banner_url FROM users WHERE username = 'admin'");
  console.log('Admin user images:');
  console.log('profile_image:', result.rows[0].profile_image || 'NULL');
  console.log('profile_picture:', result.rows[0].profile_picture || 'NULL');
  console.log('seller_banner_url:', result.rows[0].seller_banner_url || 'NULL');
  await pool.end();
}

check().catch(e => { console.error(e); process.exit(1); });
