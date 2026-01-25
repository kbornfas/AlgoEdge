import pool from '../config/database.js';

async function updateStarterPrice() {
  try {
    await pool.query(`UPDATE signal_tiers SET price = 19.00 WHERE slug = 'starter'`);
    console.log('✅ Updated Starter tier to $19.00');
    
    const result = await pool.query('SELECT name, slug, price FROM signal_tiers ORDER BY sort_order');
    console.table(result.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

updateStarterPrice();
