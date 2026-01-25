import pool from '../config/database.js';

async function testBotQuery() {
  try {
    const slug = 'gold-scalper-pro';

    console.log('Testing with slug:', slug);

    // Test the main bot query
    console.log('Step 1: Querying bot...');
    const bot = await pool.query(`
      SELECT b.*, u.username as seller_name, u.created_at as seller_since
      FROM marketplace_bots b
      JOIN users u ON b.seller_id = u.id
      WHERE b.slug = $1 AND b.status = 'approved'
    `, [slug]);

    if (bot.rows.length === 0) {
      console.log('Bot not found');
      process.exit(0);
    }

    console.log('Bot found:', bot.rows[0].name);

    // Increment view count
    console.log('Step 2: Incrementing view count...');
    await pool.query('UPDATE marketplace_bots SET view_count = view_count + 1 WHERE slug = $1', [slug]);

    // Get reviews
    console.log('Step 3: Querying reviews...');
    const reviews = await pool.query(`
      SELECT r.*, u.username
      FROM marketplace_bot_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.bot_id = $1 AND r.status = 'published'
      ORDER BY r.created_at DESC LIMIT 10
    `, [bot.rows[0].id]);

    console.log('Reviews count:', reviews.rows.length);

    console.log('SUCCESS!');
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }
}

testBotQuery();
