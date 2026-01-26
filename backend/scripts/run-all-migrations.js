import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrations = [
  '001_initial_schema.sql',
  '002_verification_codes_table.sql',
  '003_create_ip_whitelist.sql',
  '004_add_status_to_mt5_accounts.sql',
  '005_add_robots_table.sql',
  '006_add_google_oauth.sql',
  '006_add_notification_settings.sql',
  '008_telegram_pending_connections.sql',
  '009_add_google_auth_fields.sql',
  '010_add_reset_code_columns.sql',
  '010_whop_subscriptions.sql',
  '011_add_whop_user_id_to_users.sql',
  '012_affiliate_system.sql',
  '012_seller_verification.sql',
  '013_push_notifications.sql',
  '014_affiliate_enhancements.sql',
  '015_marketplace_system.sql',
  '016_api_packages_and_blog.sql',
  '017_product_delivery_system.sql',
  '018_signal_subscriptions.sql',
  '019_enhanced_seller_marketplace.sql',
  '020_signal_pricing_priority.sql',
  '025_user_wallets.sql',
  '026_wallet_enhancements.sql',
  '027_seller_verification_system.sql',
  '028_admin_wallet_system.sql',
  '029_enhanced_product_delivery.sql',
  '030_seller_affiliate_profiles.sql',
  '031_review_avatars.sql',
];

async function runAllMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  console.log('Starting migrations...\n');
  
  for (const migrationFile of migrations) {
    try {
      const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  Skipping ${migrationFile} - file not found`);
        continue;
      }
      
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      console.log(`Running ${migrationFile}...`);
      await pool.query(sql);
      console.log(`✅ ${migrationFile} completed`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`⏭️  ${migrationFile} - already applied (skipped)`);
      } else if (error.message.includes('duplicate key')) {
        console.log(`⏭️  ${migrationFile} - already applied (skipped)`);
      } else {
        console.log(`❌ ${migrationFile} failed: ${error.message}`);
      }
    }
  }
  
  console.log('\n✨ Migration process completed!');
  
  // List tables
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  console.log('\nDatabase tables:', tables.rows.map(r => r.table_name).join(', '));
  
  await pool.end();
}

runAllMigrations();
