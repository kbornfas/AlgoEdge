import pool from '../config/database.js';

async function checkTables() {
  try {
    // Check which marketplace tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'marketplace%'
    `);
    console.log('Marketplace tables:', tables.rows.map(r => r.table_name));

    // Check if marketplace_bot_reviews exists
    const reviewsExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_bot_reviews'
      )
    `);
    console.log('marketplace_bot_reviews exists:', reviewsExists.rows[0].exists);

    // Check if marketplace_bot_purchases exists
    const purchasesExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_bot_purchases'
      )
    `);
    console.log('marketplace_bot_purchases exists:', purchasesExists.rows[0].exists);

    // Check marketplace_bots columns
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'marketplace_bots'
    `);
    console.log('marketplace_bots columns:', columns.rows.map(r => r.column_name));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTables();
