import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugLanding() {
  try {
    // Test what the landing endpoint would return
    const bots = await pool.query(`
      SELECT id, name, slug, short_description as description, thumbnail_url, price, price_type,
             win_rate, monthly_return, rating_average, rating_count as total_reviews, total_sales, category
      FROM marketplace_bots
      WHERE status = 'approved'
      ORDER BY is_featured DESC, total_sales DESC, rating_average DESC
      LIMIT 3
    `);
    console.log('BOTS:');
    console.log(JSON.stringify(bots.rows, null, 2));
    
    const providers = await pool.query(`
      SELECT sp.id, sp.display_name as name, sp.slug, sp.avatar_url, sp.monthly_price,
             sp.win_rate, sp.total_pips, sp.subscriber_count, sp.rating_average,
             sp.trading_style, sp.risk_level, sp.bio as description
      FROM signal_providers sp
      WHERE sp.status = 'approved'
      ORDER BY sp.is_featured DESC, sp.subscriber_count DESC, sp.rating_average DESC
      LIMIT 2
    `);
    console.log('\nSIGNALS:');
    console.log(JSON.stringify(providers.rows, null, 2));
    
    const products = await pool.query(`
      SELECT id, name, slug, short_description as description, thumbnail_url, price,
             product_type as type, rating_average, rating_count as total_reviews, total_sales
      FROM marketplace_products
      WHERE status = 'approved'
      ORDER BY is_featured DESC, total_sales DESC, rating_average DESC
      LIMIT 3
    `);
    console.log('\nPRODUCTS:');
    console.log(JSON.stringify(products.rows, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugLanding();
