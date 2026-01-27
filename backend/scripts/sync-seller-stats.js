import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:WDbtkKUeeHZulHTUIKzucCsDiKndSPgj@maglev.proxy.rlwy.net:10414/railway'
});

async function syncSellerStats() {
  try {
    console.log('Syncing seller stats from products...');

    // Calculate aggregated stats from marketplace_products
    const result = await pool.query(`
      WITH seller_stats AS (
        SELECT 
          seller_id,
          SUM(COALESCE(total_sales, 0)) as total_sales,
          AVG(CASE WHEN rating_average > 0 THEN rating_average ELSE NULL END) as avg_rating,
          SUM(COALESCE(rating_count, 0)) as total_reviews
        FROM marketplace_products 
        WHERE seller_id IS NOT NULL
        GROUP BY seller_id
      )
      UPDATE users u
      SET 
        seller_total_sales = COALESCE(s.total_sales, 0),
        seller_rating_average = COALESCE(s.avg_rating, 0),
        seller_rating_count = COALESCE(s.total_reviews, 0)
      FROM seller_stats s
      WHERE u.id = s.seller_id
      RETURNING u.id, u.username, u.seller_total_sales, u.seller_rating_average, u.seller_rating_count
    `);

    console.log('Updated sellers:');
    console.log(JSON.stringify(result.rows, null, 2));

    // Verify the products
    const products = await pool.query(`
      SELECT id, name, seller_id, total_sales, rating_average, rating_count 
      FROM marketplace_products 
      ORDER BY id
    `);
    console.log('\nProducts:');
    console.log(JSON.stringify(products.rows, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

syncSellerStats();
