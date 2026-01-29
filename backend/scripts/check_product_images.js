import 'dotenv/config';
import pool from '../config/database.js';

async function checkProduct() {
  try {
    const result = await pool.query(`
      SELECT id, name, slug, thumbnail_url 
      FROM marketplace_products 
      WHERE slug LIKE '%forex-calculator%' OR name ILIKE '%forex calculator%'
    `);
    console.log('Products found:', JSON.stringify(result.rows, null, 2));
    
    // Also check all products with missing thumbnails
    const missing = await pool.query(`
      SELECT id, name, slug, thumbnail_url 
      FROM marketplace_products 
      WHERE thumbnail_url IS NULL OR thumbnail_url = ''
      LIMIT 10
    `);
    console.log('\nProducts with missing thumbnails:', JSON.stringify(missing.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkProduct();
