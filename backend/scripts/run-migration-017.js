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
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '017_product_delivery_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration 017_product_delivery_system.sql...');
    await pool.query(sql);
    console.log('Migration completed successfully!');
    
    // Check tables
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('product_deliverables', 'user_product_access', 'download_logs', 'price_history')
    `);
    console.log('Created tables:', tables.rows.map(r => r.table_name).join(', '));
    
  } catch (error) {
    console.error('Migration error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('Tables may already exist - checking...');
      try {
        const tables = await pool.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_name IN ('product_deliverables', 'user_product_access', 'download_logs', 'price_history')
        `);
        console.log('Existing tables:', tables.rows.map(r => r.table_name).join(', '));
      } catch (e) {
        console.error('Check error:', e.message);
      }
    }
  } finally {
    await pool.end();
  }
}

runMigration();
