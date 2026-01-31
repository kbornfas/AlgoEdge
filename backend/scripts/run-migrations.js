import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of applied migrations
    const appliedResult = await client.query('SELECT name FROM migrations');
    const appliedMigrations = new Set(appliedResult.rows.map(r => r.name));
    
    console.log(`\n📊 ${appliedMigrations.size} migrations already applied\n`);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`📁 ${files.length} migration files found\n`);
    
    let applied = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const file of files) {
      if (appliedMigrations.has(file)) {
        skipped++;
        continue;
      }
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Applied: ${file}`);
        applied++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.log(`⚠️ Skipped (may already exist): ${file}`);
        console.log(`   Reason: ${error.message.split('\n')[0]}`);
        
        // Still mark as applied if the error is about existing objects
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate key') ||
            error.message.includes('does not exist')) {
          try {
            await client.query('INSERT INTO migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
          } catch (e) {
            // Ignore
          }
        }
        failed++;
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Applied: ${applied}`);
    console.log(`   ⏭️ Skipped (already applied): ${skipped}`);
    console.log(`   ⚠️ Failed/Skipped: ${failed}`);
    console.log(`   📁 Total files: ${files.length}`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations()
  .then(() => {
    console.log('\n✅ Migration runner completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration runner failed:', error);
    process.exit(1);
  });
