import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres:WDbtkKUeeHZulHTUIKzucCsDiKndSPgj@maglev.proxy.rlwy.net:10414/railway' 
});

async function main() {
  try {
    // Remove blue badges from all non-admin users
    const result = await pool.query(
      "UPDATE users SET has_blue_badge = false WHERE email != 'kbonface03@gmail.com'"
    );
    console.log('Removed blue badges from non-admin users:', result.rowCount);
    
    // Also remove is_verified flag for signal providers not verified by admin
    const signalResult = await pool.query(
      "UPDATE signal_providers SET is_verified = false WHERE id > 0"
    );
    console.log('Reset signal provider verification:', signalResult.rowCount);
    
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
