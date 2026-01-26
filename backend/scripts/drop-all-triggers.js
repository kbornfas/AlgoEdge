import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function dropTriggers() {
  try {
    // Get all triggers
    const triggers = await pool.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
    `);
    
    console.log('Found triggers:');
    triggers.rows.forEach(t => console.log(`  - ${t.trigger_name} on ${t.event_object_table}`));
    
    // Drop all triggers that might be causing issues
    const triggersToRemove = [
      { trigger: 'track_bot_price_changes', table: 'marketplace_bots' },
      { trigger: 'track_product_price_changes', table: 'marketplace_products' },
      { trigger: 'track_provider_price_changes', table: 'signal_providers' },
      { trigger: 'update_bot_rating_trigger', table: 'marketplace_bot_reviews' },
      { trigger: 'update_product_rating_trigger', table: 'marketplace_product_reviews' },
      { trigger: 'update_provider_rating_trigger', table: 'signal_provider_reviews' },
    ];
    
    console.log('\nDropping problematic triggers...');
    
    for (const { trigger, table } of triggersToRemove) {
      try {
        await pool.query(`DROP TRIGGER IF EXISTS ${trigger} ON ${table}`);
        console.log(`  ✅ Dropped ${trigger}`);
      } catch (e) {
        console.log(`  ⚠️ Could not drop ${trigger}: ${e.message}`);
      }
    }
    
    // Also drop any functions that might be referencing old columns
    const functionsToRemove = [
      'record_price_change',
      'update_bot_rating',
      'update_product_rating',
      'update_provider_rating'
    ];
    
    console.log('\nDropping old functions...');
    for (const fn of functionsToRemove) {
      try {
        await pool.query(`DROP FUNCTION IF EXISTS ${fn}() CASCADE`);
        console.log(`  ✅ Dropped function ${fn}`);
      } catch (e) {
        console.log(`  ⚠️ Could not drop ${fn}: ${e.message}`);
      }
    }
    
    console.log('\n✨ Done!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

dropTriggers();
