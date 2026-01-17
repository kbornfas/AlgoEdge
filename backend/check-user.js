import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:WDbtkKUeeHZulHTUIKzucCsDiKndSPgj@maglev.proxy.rlwy.net:10414/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkUser() {
  try {
    await client.connect();
    console.log('Connected to database...');
    
    // Add role column if not exists
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'`);
    console.log('Added role column');
    
    // Set admin role for the admin user
    await client.query(`UPDATE users SET role = 'admin' WHERE email = 'kbonface03@gmail.com'`);
    console.log('Set admin role');
    
    // Check if admin user exists
    const result = await client.query(
      "SELECT id, username, email, role, is_verified, password_hash IS NOT NULL as has_password FROM users WHERE email = 'kbonface03@gmail.com'"
    );
    
    if (result.rows.length === 0) {
      console.log('User does not exist!');
    } else {
      console.log('User found:', result.rows[0]);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUser();
