import pool from '../config/database.js';

async function checkColumns() {
  try {
    const tables = ['users', 'marketplace_bots', 'signal_subscriptions', 'marketplace_bot_purchases', 'marketplace_product_purchases'];
    
    for (const table of tables) {
      const res = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
        [table]
      );
      console.log(`\n${table}:`);
      console.log(res.rows.map(r => r.column_name).join(', '));
    }
  } catch (e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
}

checkColumns();
