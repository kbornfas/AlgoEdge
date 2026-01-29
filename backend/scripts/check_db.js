import 'dotenv/config';
import pool from '../config/database.js';

async function runMigration() {
  try {
    // Create user_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) NOT NULL UNIQUE,
        device_type VARCHAR(50),
        device_name VARCHAR(100),
        browser VARCHAR(100),
        os VARCHAR(100),
        ip_address VARCHAR(45),
        location VARCHAR(255),
        user_agent TEXT,
        is_current BOOLEAN DEFAULT FALSE,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      )
    `);
    console.log('✅ user_sessions table created');
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)');
    console.log('✅ Indexes created');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

runMigration();
