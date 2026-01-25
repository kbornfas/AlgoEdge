import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runWalletMigration() {
  console.log('🚀 Running wallet migration...');
  
  const client = await pool.connect();
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '025_user_wallets.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration...');
    
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Wallet migration completed successfully!');
    console.log('');
    console.log('Tables created:');
    console.log('  - user_wallets (buyer balances)');
    console.log('  - wallet_deposit_requests (pending deposits)');
    console.log('  - wallet_transactions (all money movements)');
    console.log('  - platform_payment_accounts (M-Pesa, PayPal, Crypto)');
    console.log('  - marketplace_purchases (unified purchase records)');
    console.log('  - platform_earnings (admin commission tracking)');
    console.log('');
    console.log('Default payment accounts added:');
    console.log('  - M-Pesa: 0712345678 (update this!)');
    console.log('  - PayPal: payments@algoedge.io (update this!)');
    console.log('  - USDT (TRC20)');
    console.log('  - Bitcoin');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runWalletMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
