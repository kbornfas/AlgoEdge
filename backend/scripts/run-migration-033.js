import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const migrationPath = path.join(__dirname, '../migrations/033_signal_provider_monthly_pips.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration 033_signal_provider_monthly_pips.sql...');
    await pool.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();
