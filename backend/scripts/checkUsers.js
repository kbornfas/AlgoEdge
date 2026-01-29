import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:WDbtkKUeeHZulHTUIKzucCsDiKndSPgj@maglev.proxy.rlwy.net:10414/railway' 
});

async function main() {
  try {
    // Check table columns
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    const colNames = columns.rows.map(c => c.column_name);
    console.log('Column count:', colNames.length);
    console.log('Has is_blocked:', colNames.includes('is_blocked'));
    console.log('Has is_admin:', colNames.includes('is_admin'));
    console.log('Has is_seller:', colNames.includes('is_seller'));
    console.log('Has has_blue_badge:', colNames.includes('has_blue_badge'));
    console.log('Has seller_featured:', colNames.includes('seller_featured'));
    console.log('Has verification_pending:', colNames.includes('verification_pending'));
    
    // Try a simpler query first
    const result = await pool.query(`
      SELECT id, username, email, full_name, is_verified, is_admin, 
             subscription_status, role, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    console.log('Simple query succeeded! Users count:', result.rows.length);
    console.log('Users:', result.rows);
    
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
