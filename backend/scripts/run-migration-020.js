/**
 * Migration 020: Update Signal Pricing and Add Priority System
 * - Cheapest product: $15
 * - Add signal priority for tier-based filtering
 */

import pool from '../config/database.js';

async function runMigration() {
  console.log('🚀 Running Migration 020: Signal Pricing & Priority System...\n');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Step 1: Update signal tier pricing
    // Cheapest: $15, then scale up intelligently
    // Starter: $15 (was $9) - Entry level
    // Basic: $29 (was $27) - Standard 
    // Premium: $59 (was $67) - Advanced
    // VIP: $99 (was $147) - Elite
    console.log('📝 Updating signal tier pricing...');
    
    await client.query(`
      UPDATE signal_tiers SET 
        price = 15.00,
        description = 'Get started with low-priority trading signals',
        features = '["Standard signals only", "15-minute delay", "Entry + SL/TP", "Email support"]'::jsonb,
        max_signals_per_day = 3,
        signal_delay_minutes = 15
      WHERE slug = 'starter'
    `);
    console.log('  ✅ Starter: $15/month (3 signals/day, 15-min delay, LOW priority signals)');
    
    await client.query(`
      UPDATE signal_tiers SET 
        price = 29.00,
        description = 'Standard signals for active traders',
        features = '["Standard + Medium priority signals", "5-minute delay", "Entry + SL/TP", "Basic analysis", "Telegram support"]'::jsonb,
        max_signals_per_day = 8,
        signal_delay_minutes = 5,
        includes_analysis = false
      WHERE slug = 'basic'
    `);
    console.log('  ✅ Basic: $29/month (8 signals/day, 5-min delay, LOW+MEDIUM priority signals)');
    
    await client.query(`
      UPDATE signal_tiers SET 
        price = 59.00,
        description = 'Premium signals with high-priority access',
        features = '["All priority signals (LOW+MEDIUM+HIGH)", "Real-time delivery", "Full SL/TP levels", "Detailed analysis", "Priority support"]'::jsonb,
        max_signals_per_day = null,
        signal_delay_minutes = 0,
        includes_analysis = true
      WHERE slug = 'premium'
    `);
    console.log('  ✅ Premium: $59/month (Unlimited, real-time, LOW+MEDIUM+HIGH priority signals)');
    
    await client.query(`
      UPDATE signal_tiers SET 
        price = 99.00,
        description = 'Elite VIP access with exclusive signals',
        features = '["ALL signals including EXCLUSIVE VIP", "Instant delivery", "Full SL/TP + multiple TPs", "Expert analysis", "VIP Telegram channel", "1-on-1 support", "Early access to new features"]'::jsonb,
        max_signals_per_day = null,
        signal_delay_minutes = 0,
        includes_analysis = true,
        includes_vip_channel = true
      WHERE slug = 'vip'
    `);
    console.log('  ✅ VIP: $99/month (ALL signals including EXCLUSIVE, instant delivery)');
    
    // Step 2: Add priority column to trading_signals table
    console.log('\n📝 Adding priority column to trading_signals...');
    
    await client.query(`
      ALTER TABLE trading_signals 
      ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM',
      ADD COLUMN IF NOT EXISTS min_tier_slug VARCHAR(50) DEFAULT 'starter',
      ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'trading_scheduler'
    `);
    console.log('  ✅ Added priority, min_tier_slug, source columns');
    
    // Step 3: Add tier priority mapping table
    console.log('\n📝 Creating signal tier priority mapping...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS signal_tier_priorities (
        id SERIAL PRIMARY KEY,
        tier_slug VARCHAR(50) NOT NULL REFERENCES signal_tiers(slug),
        allowed_priorities TEXT[] NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tier_slug)
      )
    `);
    
    // Insert priority mappings
    await client.query(`
      INSERT INTO signal_tier_priorities (tier_slug, allowed_priorities) VALUES
        ('starter', ARRAY['LOW']),
        ('basic', ARRAY['LOW', 'MEDIUM']),
        ('premium', ARRAY['LOW', 'MEDIUM', 'HIGH']),
        ('vip', ARRAY['LOW', 'MEDIUM', 'HIGH', 'VIP', 'EXCLUSIVE'])
      ON CONFLICT (tier_slug) DO UPDATE SET 
        allowed_priorities = EXCLUDED.allowed_priorities
    `);
    console.log('  ✅ Tier priority mappings created');
    
    // Step 4: Create index for priority filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trading_signals_priority ON trading_signals(priority)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trading_signals_min_tier ON trading_signals(min_tier_slug)
    `);
    console.log('  ✅ Indexes created');
    
    await client.query('COMMIT');
    
    console.log('\n✅ Migration 020 completed successfully!');
    
    // Show updated tiers
    const tiers = await client.query(`
      SELECT name, slug, price, max_signals_per_day, signal_delay_minutes, includes_analysis, includes_vip_channel
      FROM signal_tiers 
      ORDER BY sort_order
    `);
    
    console.log('\n📊 Updated Signal Tiers:');
    console.table(tiers.rows);
    
    // Show priority mappings
    const priorities = await client.query(`
      SELECT tier_slug, allowed_priorities FROM signal_tier_priorities ORDER BY tier_slug
    `);
    console.log('\n🎯 Signal Priority Mappings:');
    console.table(priorities.rows);
    
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
