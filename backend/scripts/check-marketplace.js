import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkMarketplace() {
  try {
    // Check products by category and status
    const result = await pool.query(`
      SELECT category, status, COUNT(*) as count 
      FROM marketplace_products 
      GROUP BY category, status 
      ORDER BY category, status
    `);
    
    console.log('\n📊 Products by Category and Status:');
    console.table(result.rows);
    
    // Update all products to approved status
    const updateResult = await pool.query(`
      UPDATE marketplace_products 
      SET status = 'approved' 
      WHERE status != 'approved'
      RETURNING id, name, category
    `);
    
    if (updateResult.rows.length > 0) {
      console.log('\n✅ Approved the following products:');
      updateResult.rows.forEach(p => {
        console.log(`   - ${p.name} (${p.category})`);
      });
    } else {
      console.log('\n✅ All products already approved');
    }
    
    // Final count
    const finalCount = await pool.query(`
      SELECT category, COUNT(*) as count 
      FROM marketplace_products 
      WHERE status = 'approved'
      GROUP BY category
    `);
    
    console.log('\n📊 Final Approved Products by Category:');
    console.table(finalCount.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkMarketplace();
