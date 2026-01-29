import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Use production database URL - you'll need to get this from Railway
const PRODUCTION_DB_URL = process.env.RAILWAY_DATABASE_URL || process.argv[2];

if (!PRODUCTION_DB_URL) {
  console.error('❌ Please provide Railway database URL as argument or set RAILWAY_DATABASE_URL env variable');
  console.log('Usage: node scripts/addProductionAdmin.js "postgresql://..."');
  process.exit(1);
}

const pool = new Pool({
  connectionString: PRODUCTION_DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addAdminUser() {
  const client = await pool.connect();
  
  try {
    // Check if admin already exists
    const check = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@algoedgehub.com']
    );
    
    if (check.rows.length > 0) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    
    const result = await client.query(`
      INSERT INTO users (
        email, password, username, full_name, 
        is_admin, is_verified, has_blue_badge,
        email_verified, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, email, username
    `, [
      'admin@algoedgehub.com',
      hashedPassword,
      'admin',
      'Admin User',
      true, // is_admin
      true, // is_verified
      true, // has_blue_badge
      true  // email_verified
    ]);
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@algoedgehub.com');
    console.log('🔑 Password: Admin@123456');
    console.log('👤 ID:', result.rows[0].id);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addAdminUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
