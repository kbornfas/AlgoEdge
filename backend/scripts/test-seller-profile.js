import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testSellerProfile() {
  const slug = 'admin';
  
  try {
    console.log('Testing seller profile query for slug:', slug);
    
    // Main seller query
    const seller = await pool.query(`
      SELECT 
        u.id, u.username, u.full_name, u.profile_image, u.has_blue_badge,
        u.seller_display_name,
        COALESCE(u.seller_display_name, u.full_name, u.username) as display_name,
        u.seller_bio, u.seller_tagline, u.seller_website, u.seller_telegram,
        u.seller_twitter, u.seller_instagram, u.seller_youtube, u.seller_discord,
        u.seller_experience_years, u.seller_specialties, u.seller_trading_style,
        u.seller_joined_at, u.seller_total_sales, u.seller_rating_average, 
        u.seller_rating_count, u.seller_banner_url, u.seller_featured,
        u.country, u.verified_at,
        COALESCE(u.seller_slug, u.username) as seller_slug,
        (SELECT COUNT(*) FROM marketplace_bots WHERE seller_id = u.id AND status = 'approved') as bots_count,
        (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = u.id AND status = 'approved') as products_count,
        (SELECT COUNT(*) FROM signal_providers WHERE user_id = u.id AND status = 'approved') as signals_count
      FROM users u
      WHERE (u.seller_slug = $1 OR u.username = $1) AND u.is_seller = TRUE
    `, [slug]);
    
    console.log('Seller result:', seller.rows.length > 0 ? 'FOUND' : 'NOT FOUND');
    
    if (seller.rows.length === 0) {
      console.log('No seller found with slug:', slug);
      return;
    }
    
    const sellerData = seller.rows[0];
    console.log('Seller ID:', sellerData.id);
    console.log('Display name:', sellerData.display_name);
    
    // Test bots query
    console.log('\nTesting bots query...');
    const bots = await pool.query(`
      SELECT id, name, slug, short_description, price, price_type, thumbnail_url,
             rating_average, rating_count, total_sales, category
      FROM marketplace_bots 
      WHERE seller_id = $1 AND status = 'approved'
      ORDER BY is_featured DESC, total_sales DESC
      LIMIT 12
    `, [sellerData.id]);
    console.log('Bots found:', bots.rows.length);
    
    // Test products query
    console.log('\nTesting products query...');
    const products = await pool.query(`
      SELECT id, name, slug, short_description, price, thumbnail_url,
             rating_average, rating_count, total_sales, product_type
      FROM marketplace_products 
      WHERE seller_id = $1 AND status = 'approved'
      ORDER BY is_featured DESC, total_sales DESC
      LIMIT 12
    `, [sellerData.id]);
    console.log('Products found:', products.rows.length);
    
    // Test signals query
    console.log('\nTesting signals query...');
    const signals = await pool.query(`
      SELECT id, display_name as name, slug, trading_style, monthly_price, 
             subscriber_count as total_subscribers, rating_average, rating_count,
             win_rate, total_pips
      FROM signal_providers 
      WHERE user_id = $1 AND status = 'approved'
      LIMIT 6
    `, [sellerData.id]);
    console.log('Signals found:', signals.rows.length);
    
    // Test media query
    console.log('\nTesting media query...');
    const media = await pool.query(`
      SELECT id, media_type, COALESCE(media_url, url) as media_url, thumbnail_url, title, description, is_featured
      FROM seller_media 
      WHERE user_id = $1 AND is_visible = TRUE
      ORDER BY is_featured DESC, display_order ASC
      LIMIT 20
    `, [sellerData.id]);
    console.log('Media found:', media.rows.length);
    
    // Test bot reviews query
    console.log('\nTesting bot reviews query...');
    const botReviews = await pool.query(`
      SELECT br.id, br.rating, br.review as comment, br.created_at,
             u.username as reviewer_username, 
             u.full_name as reviewer_name,
             u.profile_image as reviewer_avatar,
             'bot' as review_type,
             b.name as item_name
      FROM marketplace_bot_reviews br
      JOIN users u ON br.user_id = u.id
      JOIN marketplace_bots b ON br.bot_id = b.id
      WHERE b.seller_id = $1 AND br.status = 'approved'
      ORDER BY br.created_at DESC
      LIMIT 10
    `, [sellerData.id]);
    console.log('Bot reviews found:', botReviews.rows.length);
    
    // Test product reviews query
    console.log('\nTesting product reviews query...');
    const productReviews = await pool.query(`
      SELECT pr.id, pr.rating, pr.review as comment, pr.created_at,
             u.username as reviewer_username, 
             u.full_name as reviewer_name,
             u.profile_image as reviewer_avatar,
             'product' as review_type,
             p.name as item_name
      FROM marketplace_product_reviews pr
      JOIN users u ON pr.user_id = u.id
      JOIN marketplace_products p ON pr.product_id = p.id
      WHERE p.seller_id = $1
      ORDER BY pr.created_at DESC
      LIMIT 10
    `, [sellerData.id]);
    console.log('Product reviews found:', productReviews.rows.length);
    
    console.log('\n✅ All queries executed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Query that failed:', error.query || 'unknown');
  } finally {
    await pool.end();
  }
}

testSellerProfile();
