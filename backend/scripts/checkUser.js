import pool from '../config/database.js';

async function checkUser() {
  try {
    const result = await pool.query(`
      SELECT id, username, email, is_verified, has_blue_badge, verification_pending, is_seller 
      FROM users 
      WHERE email ILIKE '%kigen%' OR username ILIKE '%kigen%' OR full_name ILIKE '%kigen%'
      LIMIT 5
    `);
    
    console.log('Users found:');
    result.rows.forEach(user => {
      console.log(JSON.stringify(user, null, 2));
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUser();
