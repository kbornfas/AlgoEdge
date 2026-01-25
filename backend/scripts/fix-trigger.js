import pool from '../config/database.js';

async function fixTrigger() {
  try {
    // List triggers on marketplace_bots
    const triggers = await pool.query(`
      SELECT tgname, tgrelid::regclass as table_name 
      FROM pg_trigger 
      WHERE NOT tgisinternal
    `);
    console.log('All triggers:');
    triggers.rows.forEach(t => console.log(`  - ${t.tgname} on ${t.table_name}`));

    // Check if there's a trigger on marketplace_bots referencing monthly_price
    const triggerDef = await pool.query(`
      SELECT pg_get_triggerdef(oid) as definition
      FROM pg_trigger 
      WHERE tgname = 'trigger_record_price_change' 
      AND tgrelid = 'marketplace_bots'::regclass
    `);
    
    if (triggerDef.rows.length > 0) {
      console.log('\nTrigger definition:', triggerDef.rows[0].definition);
      
      // Drop the problematic trigger
      console.log('\nDropping problematic trigger...');
      await pool.query('DROP TRIGGER IF EXISTS trigger_record_price_change ON marketplace_bots');
      console.log('Trigger dropped!');
    } else {
      console.log('\nNo trigger_record_price_change found on marketplace_bots');
      
      // Check on signal_providers
      const signalTrigger = await pool.query(`
        SELECT pg_get_triggerdef(oid) as definition
        FROM pg_trigger 
        WHERE tgname = 'trigger_record_price_change' 
        AND tgrelid = 'signal_providers'::regclass
      `);
      
      if (signalTrigger.rows.length > 0) {
        console.log('Found trigger on signal_providers:', signalTrigger.rows[0].definition);
      }
    }

    // Get the function definition
    const funcDef = await pool.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'record_price_change'
    `);
    
    if (funcDef.rows.length > 0) {
      console.log('\nFunction record_price_change() definition:');
      console.log(funcDef.rows[0].prosrc.substring(0, 500) + '...');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixTrigger();
