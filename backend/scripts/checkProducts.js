import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:WDbtkKUeeHZulHTUIKzucCsDiKndSPgj@maglev.proxy.rlwy.net:10414/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkProducts() {
  try {
    const bots = await pool.query("SELECT COUNT(*) as total FROM marketplace_bots");
    const approvedBots = await pool.query("SELECT COUNT(*) as total FROM marketplace_bots WHERE status = 'approved'");
    const products = await pool.query("SELECT COUNT(*) as total FROM marketplace_products");
    const approvedProducts = await pool.query("SELECT COUNT(*) as total FROM marketplace_products WHERE status = 'approved'");
    const signals = await pool.query("SELECT COUNT(*) as total FROM signal_providers");
    const approvedSignals = await pool.query("SELECT COUNT(*) as total FROM signal_providers WHERE status = 'approved'");
    const sellers = await pool.query("SELECT COUNT(*) as total FROM users WHERE is_seller = true");
    const admins = await pool.query("SELECT id, email, username, is_admin, role FROM users WHERE is_admin = true OR role = 'admin'");
    
    console.log('\n=== PRODUCTION DATABASE STATS ===\n');
    console.log('Bots:', bots.rows[0].total, '(Approved:', approvedBots.rows[0].total + ')');
    console.log('Products:', products.rows[0].total, '(Approved:', approvedProducts.rows[0].total + ')');
    console.log('Signals:', signals.rows[0].total, '(Approved:', approvedSignals.rows[0].total + ')');
    console.log('Sellers:', sellers.rows[0].total);
    console.log('\nAdmin Users:');
    admins.rows.forEach(u => console.log(' -', u.email, '| username:', u.username, '| is_admin:', u.is_admin, '| role:', u.role));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    pool.end();
  }
}

checkProducts();
