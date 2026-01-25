/**
 * Script to run migration 019 for enhanced seller marketplace
 * Run with: node scripts/run-migration-019.js
 */

import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🚀 Running Migration 019: Enhanced Seller Marketplace...\n');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Step 1: Add columns to existing tables
    console.log('📝 Adding new columns to marketplace tables...');
    
    // marketplace_products
    await client.query(`
      ALTER TABLE marketplace_products 
      ADD COLUMN IF NOT EXISTS checkout_url TEXT,
      ADD COLUMN IF NOT EXISTS checkout_provider VARCHAR(50) DEFAULT 'stripe',
      ADD COLUMN IF NOT EXISTS admin_notes TEXT,
      ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS seller_notes TEXT,
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS approved_by INTEGER
    `);
    console.log('  ✅ marketplace_products updated');
    
    // marketplace_bots
    await client.query(`
      ALTER TABLE marketplace_bots 
      ADD COLUMN IF NOT EXISTS checkout_url TEXT,
      ADD COLUMN IF NOT EXISTS checkout_provider VARCHAR(50) DEFAULT 'stripe',
      ADD COLUMN IF NOT EXISTS admin_notes TEXT,
      ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS seller_notes TEXT,
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS approved_by INTEGER
    `);
    console.log('  ✅ marketplace_bots updated');
    
    // signal_providers
    try {
      await client.query(`
        ALTER TABLE signal_providers 
        ADD COLUMN IF NOT EXISTS checkout_url TEXT,
        ADD COLUMN IF NOT EXISTS checkout_provider VARCHAR(50) DEFAULT 'stripe',
        ADD COLUMN IF NOT EXISTS admin_notes TEXT,
        ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS seller_notes TEXT,
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS approved_by INTEGER
      `);
      console.log('  ✅ signal_providers updated');
    } catch (e) {
      console.log('  ⚠️ signal_providers table may not exist, skipping');
    }
    
    // Step 2: Update seller_wallets
    console.log('\n📝 Updating seller_wallets table...');
    await client.query(`
      ALTER TABLE seller_wallets
      ADD COLUMN IF NOT EXISTS payout_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS payout_method VARCHAR(50) DEFAULT 'bank_transfer',
      ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS bank_routing_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS paypal_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS crypto_wallet_address TEXT,
      ADD COLUMN IF NOT EXISTS crypto_network VARCHAR(50),
      ADD COLUMN IF NOT EXISTS minimum_payout DECIMAL(10,2) DEFAULT 50.00,
      ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_payout_at TIMESTAMP
    `);
    console.log('  ✅ seller_wallets updated');
    
    // Step 3: Create new tables
    console.log('\n📝 Creating new tables...');
    
    // seller_payout_requests
    await client.query(`
      CREATE TABLE IF NOT EXISTS seller_payout_requests (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wallet_id INTEGER,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        payout_method VARCHAR(50) NOT NULL,
        payout_details JSONB NOT NULL,
        status VARCHAR(30) DEFAULT 'pending',
        processed_at TIMESTAMP,
        processed_by INTEGER,
        transaction_reference VARCHAR(255),
        admin_notes TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ seller_payout_requests created');
    
    // seller_commissions
    await client.query(`
      CREATE TABLE IF NOT EXISTS seller_commissions (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sale_type VARCHAR(50) NOT NULL,
        sale_id INTEGER NOT NULL,
        purchase_id INTEGER,
        sale_amount DECIMAL(10,2) NOT NULL,
        commission_rate DECIMAL(5,2) NOT NULL,
        commission_amount DECIMAL(10,2) NOT NULL,
        seller_earnings DECIMAL(10,2) NOT NULL,
        status VARCHAR(30) DEFAULT 'pending',
        cleared_at TIMESTAMP,
        paid_out_at TIMESTAMP,
        payout_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ seller_commissions created');
    
    // telegram_channel_members
    await client.query(`
      CREATE TABLE IF NOT EXISTS telegram_channel_members (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        telegram_chat_id VARCHAR(100),
        telegram_username VARCHAR(100),
        channel_type VARCHAR(50) DEFAULT 'free',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        UNIQUE(user_id)
      )
    `);
    console.log('  ✅ telegram_channel_members created');
    
    // listing_submissions
    await client.query(`
      CREATE TABLE IF NOT EXISTS listing_submissions (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        listing_type VARCHAR(50) NOT NULL,
        listing_id INTEGER NOT NULL,
        preferred_name VARCHAR(255) NOT NULL,
        preferred_description TEXT NOT NULL,
        preferred_price DECIMAL(10,2),
        seller_notes TEXT,
        status VARCHAR(30) DEFAULT 'pending',
        reviewed_by INTEGER,
        checkout_url_assigned TEXT,
        admin_notes TEXT,
        rejection_reason TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        UNIQUE(listing_type, listing_id)
      )
    `);
    console.log('  ✅ listing_submissions created');
    
    // Step 4: Update signal_tiers (convert Free to Starter)
    console.log('\n📝 Updating signal tiers...');
    const tierExists = await client.query(`
      SELECT * FROM signal_tiers WHERE slug = 'free' LIMIT 1
    `);
    
    if (tierExists.rows.length > 0) {
      await client.query(`
        UPDATE signal_tiers 
        SET name = 'Starter', 
            slug = 'starter',
            price = 9.00,
            description = 'Get started with essential trading signals',
            features = '["5 signals per day", "10-minute delay", "Entry + SL/TP", "Email support"]',
            max_signals_per_day = 5,
            signal_delay_minutes = 10,
            includes_sl_tp = TRUE,
            sort_order = 1
        WHERE slug = 'free'
      `);
      console.log('  ✅ Free tier converted to Starter ($9/month)');
    } else {
      console.log('  ⚠️ No free tier found - already converted');
    }
    
    // Update other sort orders
    await client.query(`UPDATE signal_tiers SET sort_order = 2 WHERE slug = 'basic'`);
    await client.query(`UPDATE signal_tiers SET sort_order = 3 WHERE slug = 'premium'`);
    await client.query(`UPDATE signal_tiers SET sort_order = 4 WHERE slug = 'vip'`);
    
    // Step 5: Create indexes
    console.log('\n📝 Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payout_requests_seller ON seller_payout_requests(seller_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON seller_payout_requests(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_seller_commissions_seller ON seller_commissions(seller_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_seller_commissions_status ON seller_commissions(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_listing_submissions_seller ON listing_submissions(seller_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_listing_submissions_status ON listing_submissions(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_telegram_channel_members_user ON telegram_channel_members(user_id)`);
    console.log('  ✅ Indexes created');
    
    await client.query('COMMIT');
    
    console.log('\n✅ Migration 019 completed successfully!');
    
    // Show current signal tiers
    const tiers = await client.query(`
      SELECT name, slug, price, max_signals_per_day, signal_delay_minutes 
      FROM signal_tiers 
      ORDER BY sort_order
    `);
    
    console.log('\n📊 Current Signal Tiers:');
    console.table(tiers.rows);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigration().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
