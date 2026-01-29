import pg from 'pg';
import jwt from 'jsonwebtoken';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:WDbtkKUeeHZulHTUIKzucCsDiKndSPgj@maglev.proxy.rlwy.net:10414/railway',
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = 'algoedge-super-secret-jwt-key-2025-production-ready';

async function testAuth() {
  try {
    // Get admin user
    const result = await pool.query("SELECT id, email, username, is_admin, role FROM users WHERE email = 'kbonface03@gmail.com'");
    const user = result.rows[0];
    
    if (!user) {
      console.log('Admin user not found!');
      return;
    }
    
    console.log('\n=== ADMIN USER ===');
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('Username:', user.username);
    console.log('is_admin:', user.is_admin);
    console.log('role:', user.role);
    
    // Generate a JWT token the same way the backend does
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('\n=== GENERATED JWT TOKEN ===');
    console.log(token);
    
    // Decode and verify
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('\n=== DECODED TOKEN ===');
    console.log(decoded);
    
    // Test the featured endpoint
    console.log('\n=== TESTING FEATURED ENDPOINT ===');
    const response = await fetch('https://algoedge-production-a108.up.railway.app/api/admin/featured', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    pool.end();
  }
}

testAuth();
