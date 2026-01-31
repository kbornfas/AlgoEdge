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

// Migrations that need to be re-run
const migrationsToRetry = [
  '039_signal_leaderboard.sql',
  '040_trader_profiles.sql',
  '041_seller_reviews.sql',
  '044_economic_calendar.sql',
  '045_trading_glossary.sql',
  '046_follow_system.sql',
  '047_social_feed.sql',
  '048_knowledge_base.sql',
  '049_trading_competitions.sql',
  '051_seller_media.sql',
];

async function retryMigrations() {
  const client = await pool.connect();
  
  try {
    // Remove failed migrations from the migrations table
    for (const migration of migrationsToRetry) {
      await client.query('DELETE FROM migrations WHERE name = $1', [migration]);
      console.log(`🗑️ Removed: ${migration}`);
    }
    
    console.log('\n📂 Re-running failed migrations...\n');
    
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    
    for (const file of migrationsToRetry) {
      const filePath = path.join(migrationsDir, file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ File not found: ${file}`);
        continue;
      }
      
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Applied: ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        // If the error is about something already existing, mark as applied anyway
        if (error.message.includes('already exists')) {
          try {
            await client.query('INSERT INTO migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
            console.log(`⚠️ Marked as applied (objects already exist): ${file}`);
          } catch (e) {
            console.log(`❌ Failed: ${file}`);
            console.log(`   Error: ${error.message.split('\n')[0]}`);
          }
        } else {
          console.log(`❌ Failed: ${file}`);
          console.log(`   Error: ${error.message.split('\n')[0]}`);
        }
      }
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

retryMigrations()
  .then(() => {
    console.log('\n✅ Retry completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Retry failed:', error);
    process.exit(1);
  });
