// Run migration to add reset_code columns for password reset
import pool from '../config/database.js';

async function runMigration() {
  try {
    console.log('Running migration: add reset_code columns...');
    
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(10)');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires TIMESTAMP');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_attempts INTEGER DEFAULT 0');
    
    console.log('Migration successful: reset_code columns added');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
}

runMigration();
