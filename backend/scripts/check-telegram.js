import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    // Check constraints on user_settings
    const constraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'user_settings'::regclass
    `);
    console.log('Constraints on user_settings:');
    constraints.rows.forEach(c => console.log(`  - ${c.conname}: ${c.definition}`));
    
    // Check user_settings columns
    const schema = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_settings'"
    );
    console.log('\nuser_settings columns:');
    schema.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
    
    // Check all telegram connections
    const connections = await pool.query(
      'SELECT user_id, telegram_chat_id, telegram_username, telegram_alerts FROM user_settings WHERE telegram_chat_id IS NOT NULL'
    );
    console.log('\nTelegram connections:', connections.rows);
    
    // Check pending connections
    const pending = await pool.query(
      'SELECT * FROM telegram_pending_connections'
    );
    console.log('\nPending connections:', pending.rows);
    
    // Check admin user
    const adminUser = await pool.query(
      "SELECT id, email, username FROM users WHERE email = 'kbonface03@gmail.com'"
    );
    console.log('\nAdmin user:', adminUser.rows);
    
    // Check if admin user has settings
    const adminSettings = await pool.query(
      "SELECT us.*, u.username FROM user_settings us JOIN users u ON u.id = us.user_id WHERE u.email = 'kbonface03@gmail.com'"
    );
    console.log('\nAdmin user settings:', adminSettings.rows);
    
    // If admin has no settings, create default row
    if (adminUser.rows.length > 0 && adminSettings.rows.length === 0) {
      const adminId = adminUser.rows[0].id;
      console.log('\nCreating default settings for admin user ID:', adminId);
      await pool.query(
        `INSERT INTO user_settings (user_id, email_notifications, trade_alerts, daily_reports, telegram_alerts)
         VALUES ($1, true, true, true, false)`,
        [adminId]
      );
      console.log('Created default settings!');
    }
    
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    await pool.end();
  }
}

check();
