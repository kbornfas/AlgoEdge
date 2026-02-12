import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL?.trim(), max: 2 });

async function check() {
  const bots = await pool.query("SELECT count(*) as total, count(*) FILTER (WHERE status = 'approved') as approved, count(*) FILTER (WHERE is_featured = true) as featured FROM marketplace_bots");
  const signals = await pool.query("SELECT count(*) as total, count(*) FILTER (WHERE status = 'approved') as approved, count(*) FILTER (WHERE is_featured = true) as featured FROM signal_providers");
  const products = await pool.query("SELECT count(*) as total, count(*) FILTER (WHERE status = 'approved') as approved, count(*) FILTER (WHERE is_featured = true) as featured FROM marketplace_products");
  
  console.log('Bots:', bots.rows[0]);
  console.log('Signals:', signals.rows[0]);
  console.log('Products:', products.rows[0]);

  // Check what the landing endpoint would actually return
  const landingBots = await pool.query(`
    SELECT b.id, b.name, b.status, b.is_featured, b.seller_id, u.username
    FROM marketplace_bots b
    JOIN users u ON b.seller_id = u.id
    WHERE b.status = 'approved'
    ORDER BY b.is_featured DESC, b.rating_average DESC
    LIMIT 6
  `);
  console.log('\nLanding bots query result:', landingBots.rows.length, 'rows');
  landingBots.rows.forEach(r => console.log(`  - ${r.name} (featured: ${r.is_featured}, seller: ${r.username})`));

  const landingSignals = await pool.query(`
    SELECT sp.id, sp.display_name, sp.status, sp.is_featured, sp.user_id, u.username
    FROM signal_providers sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.status = 'approved'
    ORDER BY sp.is_featured DESC, sp.rating_average DESC
    LIMIT 6
  `);
  console.log('\nLanding signals query result:', landingSignals.rows.length, 'rows');
  landingSignals.rows.forEach(r => console.log(`  - ${r.display_name} (featured: ${r.is_featured}, seller: ${r.username})`));

  const landingProducts = await pool.query(`
    SELECT p.id, p.name, p.status, p.is_featured, p.seller_id, u.username
    FROM marketplace_products p
    JOIN users u ON p.seller_id = u.id
    WHERE p.status = 'approved'
    ORDER BY p.is_featured DESC, p.rating_average DESC
    LIMIT 6
  `);
  console.log('\nLanding products query result:', landingProducts.rows.length, 'rows');
  landingProducts.rows.forEach(r => console.log(`  - ${r.name} (featured: ${r.is_featured}, seller: ${r.username})`));

  await pool.end();
}

check().catch(e => { console.error(e); pool.end(); });
