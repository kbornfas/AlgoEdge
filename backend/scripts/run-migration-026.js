import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration(migrationFile) {
  const client = await pool.connect();
  
  try {
    console.log(`Starting migration ${migrationFile}...`);
    
    const sqlPath = path.join(__dirname, '..', 'migrations', migrationFile);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by ; and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    await client.query('BEGIN');
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log('✅ Executed statement');
        } catch (err) {
          if (err.message.includes('already exists') || err.message.includes('duplicate')) {
            console.log('⏭️ Already exists, skipping...');
          } else {
            throw err;
          }
        }
      }
    }
    
    await client.query('COMMIT');
    console.log(`✅ Migration ${migrationFile} completed successfully!`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function runAllMigrations() {
  try {
    // Run 025 first (creates base tables)
    await runMigration('025_user_wallets.sql');
    
    // Then run 026 (enhancements)
    await runMigration('026_wallet_enhancements.sql');
    
    console.log('\n✅ All wallet migrations completed successfully!');
  } finally {
    await pool.end();
  }
}

runAllMigrations().catch(console.error);
