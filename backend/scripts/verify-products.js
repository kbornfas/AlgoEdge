import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verify() {
  const result = await pool.query(`
    SELECT 
      mp.name as product_name,
      mp.slug,
      mp.price,
      mp.product_type,
      COUNT(pd.id) as file_count,
      STRING_AGG(pd.name, ', ') as files
    FROM marketplace_products mp
    LEFT JOIN product_deliverables pd ON mp.id = pd.product_id
    GROUP BY mp.id, mp.name, mp.slug, mp.price, mp.product_type
    ORDER BY mp.product_type, mp.name
  `);
  
  console.log('\n📦 MARKETPLACE PRODUCTS SUMMARY\n');
  console.log('=' .repeat(80));
  
  let currentType = '';
  for (const row of result.rows) {
    if (row.product_type !== currentType) {
      currentType = row.product_type;
      console.log(`\n--- ${currentType.toUpperCase()} ---`);
    }
    console.log(`\n${row.product_name} ($${row.price})`);
    console.log(`  Slug: ${row.slug}`);
    console.log(`  Files (${row.file_count}): ${row.files || 'None'}`);
  }
  
  const totals = await pool.query(`
    SELECT 
      COUNT(DISTINCT mp.id) as products,
      COUNT(pd.id) as deliverables
    FROM marketplace_products mp
    LEFT JOIN product_deliverables pd ON mp.id = pd.product_id
  `);
  
  console.log('\n' + '=' .repeat(80));
  console.log(`\n✅ TOTAL: ${totals.rows[0].products} products with ${totals.rows[0].deliverables} deliverable files`);
  
  await pool.end();
}

verify().catch(console.error);
