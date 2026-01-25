/**
 * Update Product Prices
 * 
 * Sets conversion-optimized pricing for all marketplace products
 * Psychology-based pricing ($X.99, strategic price points)
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Optimized pricing - using psychological price points
const priceUpdates = [
  // BOTS - Premium pricing but accessible
  { slug: 'gold-scalper-pro-ea', price: 97, originalPrice: 197 },        // Was $149
  { slug: 'silver-trend-rider-ea', price: 67, originalPrice: 147 },      // Was $129
  { slug: 'multi-metal-portfolio-ea', price: 147, originalPrice: 297 },  // Was $249
  { slug: 'risk-manager-pro-ea', price: 47, originalPrice: 97 },         // Was $79
  { slug: 'news-trading-sniper-ea', price: 127, originalPrice: 247 },    // Was $199

  // EBOOKS - Low friction entry points
  { slug: 'gold-trading-bible-ebook', price: 27, originalPrice: 67 },    // Was $49
  { slug: 'technical-analysis-mastery-ebook', price: 19, originalPrice: 49 },  // Was $39
  { slug: 'risk-management-ebook', price: 17, originalPrice: 37 },       // Was $29
  { slug: 'trading-psychology-blueprint', price: 19, originalPrice: 47 }, // Was $34
  { slug: 'price-action-secrets-ebook', price: 27, originalPrice: 57 },  // Was $44

  // INDICATORS - Mid-range
  { slug: 'smart-sr-indicator', price: 37, originalPrice: 77 },          // Was $49
  { slug: 'trend-strength-dashboard', price: 37, originalPrice: 87 },    // Was $59
  { slug: 'supply-demand-zone-indicator', price: 47, originalPrice: 97 }, // Was $69

  // TEMPLATES - Easy upsell items
  { slug: 'professional-trading-journal', price: 17, originalPrice: 37 }, // Was $29
  { slug: 'forex-calculator-suite', price: 9, originalPrice: 27 },       // Was $19
  { slug: 'trading-plan-template-bundle', price: 14, originalPrice: 37 }, // Was $24

  // COURSES - High value perception
  { slug: 'mt5-mastery-course', price: 47, originalPrice: 127 },         // Was $79
  { slug: 'prop-firm-challenge-blueprint', price: 67, originalPrice: 147 }, // Was $99
];

async function updatePrices() {
  const client = await pool.connect();
  
  try {
    // First, check if original_price column exists, if not add it
    const columnCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'marketplace_products' AND column_name = 'original_price'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('Adding original_price column...');
      await client.query(`
        ALTER TABLE marketplace_products 
        ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2)
      `);
    }
    
    // Disable ALL triggers on marketplace_products temporarily
    console.log('Disabling triggers temporarily...');
    await client.query(`ALTER TABLE marketplace_products DISABLE TRIGGER ALL`);
    
    await client.query('BEGIN');
    
    console.log('💰 Updating product prices...\n');
    
    for (const item of priceUpdates) {
      const result = await client.query(`
        UPDATE marketplace_products 
        SET price = $1, original_price = $2, updated_at = NOW()
        WHERE slug = $3
        RETURNING name, price, original_price
      `, [item.price, item.originalPrice, item.slug]);
      
      if (result.rows.length > 0) {
        const p = result.rows[0];
        const discount = Math.round((1 - p.price / p.original_price) * 100);
        console.log(`✅ ${p.name}: $${p.price} (was $${p.original_price}) - ${discount}% OFF`);
      } else {
        console.log(`⚠️ Product not found: ${item.slug}`);
      }
    }
    
    await client.query('COMMIT');
    
    // Show summary by category
    const summary = await client.query(`
      SELECT 
        product_type,
        COUNT(*) as count,
        MIN(price) as min_price,
        MAX(price) as max_price,
        ROUND(AVG(price)::numeric, 2) as avg_price
      FROM marketplace_products
      GROUP BY product_type
      ORDER BY avg_price DESC
    `);
    
    console.log('\n📊 PRICING SUMMARY BY CATEGORY:\n');
    console.log('Category       | Count | Min    | Max    | Avg');
    console.log('-'.repeat(50));
    
    for (const row of summary.rows) {
      console.log(
        `${row.product_type.padEnd(14)} | ${String(row.count).padEnd(5)} | $${String(row.min_price).padEnd(5)} | $${String(row.max_price).padEnd(5)} | $${row.avg_price}`
      );
    }
    
    console.log('\n✅ All prices updated successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating prices:', error);
    throw error;
    // Re-enable triggers
    console.log('Re-enabling triggers...');
    await client.query(`ALTER TABLE marketplace_products ENABLE TRIGGER ALL`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

updatePrices().catch(console.error);
