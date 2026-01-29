import 'dotenv/config';
import pool from '../config/database.js';

async function updateProductImage() {
  try {
    // Update Forex Calculator Suite with a working calculator/finance image
    const result = await pool.query(`
      UPDATE marketplace_products 
      SET thumbnail_url = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop'
      WHERE slug = 'forex-calculator-suite'
      RETURNING id, name, slug, thumbnail_url
    `);
    console.log('Updated product:', JSON.stringify(result.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateProductImage();
