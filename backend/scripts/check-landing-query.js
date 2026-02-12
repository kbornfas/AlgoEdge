import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL?.trim(), max: 2 });

async function check() {
  // Check if has_blue_badge and seller_display_name columns exist on users
  const cols = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name IN ('has_blue_badge', 'seller_display_name', 'profile_image')
  `);
  console.log('Users columns found:', cols.rows.map(r => r.column_name));

  // Try running the exact landing query
  try {
    const result = await pool.query(`
      SELECT b.id, b.name, b.slug, b.short_description as description, b.thumbnail_url, 
             b.price, b.price_type, b.is_free,
             b.win_rate, b.monthly_return, b.rating_average, b.rating_count as total_reviews, 
             b.total_sales, b.category, b.is_featured,
             COALESCE(u.seller_display_name, u.full_name, u.username) as seller_name, 
             u.profile_image as seller_avatar, u.has_blue_badge as seller_verified
      FROM marketplace_bots b
      JOIN users u ON b.seller_id = u.id
      WHERE b.status = 'approved'
      ORDER BY b.is_featured DESC, b.rating_average DESC, b.total_sales DESC
      LIMIT 6
    `);
    console.log('\n✅ Bots query works:', result.rows.length, 'rows');
  } catch (e) {
    console.error('\n❌ Bots query FAILED:', e.message);
  }

  try {
    const result = await pool.query(`
      SELECT sp.id, sp.display_name as name, sp.slug, sp.avatar_url, sp.monthly_price,
             sp.win_rate, sp.total_pips, sp.average_pips, sp.subscriber_count, sp.rating_average,
             sp.trading_style, sp.risk_level, sp.bio as description, sp.is_featured, sp.is_free,
             COALESCE(u.seller_display_name, u.full_name, u.username) as provider_name, 
             u.profile_image as provider_avatar, u.has_blue_badge as provider_verified
      FROM signal_providers sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.status = 'approved'
      ORDER BY sp.is_featured DESC, sp.rating_average DESC, sp.subscriber_count DESC
      LIMIT 6
    `);
    console.log('✅ Signals query works:', result.rows.length, 'rows');
  } catch (e) {
    console.error('❌ Signals query FAILED:', e.message);
  }

  try {
    const result = await pool.query(`
      SELECT p.id, p.name, p.slug, p.short_description as description, p.thumbnail_url, 
             p.price, p.discount_price,
             p.product_type as type, p.rating_average, p.rating_count as total_reviews, 
             p.total_sales, p.is_featured,
             COALESCE(u.seller_display_name, u.full_name, u.username) as seller_name, 
             u.profile_image as seller_avatar, u.has_blue_badge as seller_verified
      FROM marketplace_products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'approved'
      ORDER BY p.is_featured DESC, p.rating_average DESC, p.total_sales DESC
      LIMIT 6
    `);
    console.log('✅ Products query works:', result.rows.length, 'rows');
  } catch (e) {
    console.error('❌ Products query FAILED:', e.message);
  }

  await pool.end();
}

check().catch(e => { console.error(e); pool.end(); });
