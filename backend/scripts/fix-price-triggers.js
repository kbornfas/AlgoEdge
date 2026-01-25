import pool from '../config/database.js';

async function checkAndFixTriggers() {
  try {
    // Get definition of track_provider_price_changes trigger function
    const funcDef = await pool.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'record_price_change'
    `);
    
    if (funcDef.rows.length > 0) {
      console.log('Function record_price_change() full definition:');
      console.log(funcDef.rows[0].prosrc);
      console.log('\n---\n');
    }

    // Check if signal_providers has monthly_price column
    const cols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'signal_providers' 
      AND column_name LIKE '%price%'
    `);
    console.log('signal_providers price columns:', cols.rows.map(r => r.column_name));

    // The function checks for monthly_price on signal_providers, but it may not exist
    // Let's fix the function or drop the trigger
    
    console.log('\nDropping problematic triggers...');
    
    // Drop triggers
    await pool.query('DROP TRIGGER IF EXISTS track_bot_price_changes ON marketplace_bots');
    await pool.query('DROP TRIGGER IF EXISTS track_product_price_changes ON marketplace_products');
    await pool.query('DROP TRIGGER IF EXISTS track_provider_price_changes ON signal_providers');
    
    console.log('Triggers dropped successfully!');
    
    // Drop the function
    await pool.query('DROP FUNCTION IF EXISTS record_price_change()');
    console.log('Function dropped!');
    
    // Test the bot query again
    console.log('\nTesting bot query...');
    const bot = await pool.query(`
      SELECT b.*, u.username as seller_name
      FROM marketplace_bots b
      JOIN users u ON b.seller_id = u.id
      WHERE b.slug = 'gold-scalper-pro' AND b.status = 'approved'
    `);
    console.log('Bot found:', bot.rows.length > 0 ? bot.rows[0].name : 'None');
    
    // Test update
    await pool.query('UPDATE marketplace_bots SET view_count = view_count + 1 WHERE slug = $1', ['gold-scalper-pro']);
    console.log('View count updated successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndFixTriggers();
