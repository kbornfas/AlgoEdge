import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkReviews() {
  try {
    // Check sample reviews
    const botReviews = await pool.query(`
      SELECT reviewer_name, reviewer_avatar, rating, title 
      FROM marketplace_bot_reviews 
      LIMIT 3
    `);
    console.log('Bot reviews sample:');
    botReviews.rows.forEach(r => console.log(`  - ${r.reviewer_name}: ${r.title} (${r.rating}★)`));
    console.log(`    Avatar: ${botReviews.rows[0]?.reviewer_avatar?.substring(0, 50)}...`);
    
    // Check product ratings
    const products = await pool.query(`
      SELECT name, rating_average, rating_count, total_sales
      FROM marketplace_products
      ORDER BY rating_average DESC NULLS LAST
      LIMIT 5
    `);
    console.log('\nProducts with ratings:');
    products.rows.forEach(p => console.log(`  - ${p.name}: ${p.rating_average}★ (${p.rating_count} reviews, ${p.total_sales} sales)`));
    
    // Check bot ratings
    const bots = await pool.query(`
      SELECT name, rating_average, rating_count, total_sales
      FROM marketplace_bots
      ORDER BY rating_average DESC NULLS LAST
    `);
    console.log('\nBots with ratings:');
    bots.rows.forEach(b => console.log(`  - ${b.name}: ${b.rating_average}★ (${b.rating_count} reviews, ${b.total_sales} sales)`));
    
    // Check signal provider ratings
    const providers = await pool.query(`
      SELECT display_name, rating_average, rating_count, subscriber_count
      FROM signal_providers
    `);
    console.log('\nSignal providers with ratings:');
    providers.rows.forEach(p => console.log(`  - ${p.display_name}: ${p.rating_average}★ (${p.rating_count} reviews, ${p.subscriber_count} subscribers)`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkReviews();
