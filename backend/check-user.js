import pool from './config/database.js';
import bcrypt from 'bcryptjs';

const testPassword = process.argv[2] || 'test';

async function checkUser() {
  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, is_verified, two_fa_enabled FROM users WHERE email = $1',
      ['kbonface03@gmail.com']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User NOT found in database');
    } else {
      const user = result.rows[0];
      console.log('✅ User found:');
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Has password:', !!user.password_hash);
      console.log('  Password hash starts with:', user.password_hash?.substring(0, 10));
      console.log('  Is verified:', user.is_verified);
      console.log('  2FA enabled:', user.two_fa_enabled);
      
      // Test password
      if (testPassword !== 'test') {
        const isValid = await bcrypt.compare(testPassword, user.password_hash);
        console.log('  Password valid:', isValid);
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUser();
