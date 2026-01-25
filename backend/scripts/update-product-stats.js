import pool from '../config/database.js';

async function updateProductStats() {
  try {
    console.log('Updating product stats...');
    
    // Update marketplace_products with random ratings and sales
    const products = await pool.query('SELECT id, name FROM marketplace_products');
    
    for (const product of products.rows) {
      const rating = (Math.random() * 0.8 + 4.2).toFixed(2); // 4.2 - 5.0
      const ratingCount = Math.floor(Math.random() * 50 + 15); // 15 - 65
      const totalSales = Math.floor(Math.random() * 150 + 30); // 30 - 180
      
      await pool.query(`
        UPDATE marketplace_products 
        SET rating_average = $1, rating_count = $2, total_sales = $3
        WHERE id = $4
      `, [rating, ratingCount, totalSales, product.id]);
      
      console.log(`  Updated: ${product.name} - Rating: ${rating}, Reviews: ${ratingCount}, Sales: ${totalSales}`);
    }
    
    // Update marketplace_bots with random ratings and sales
    const bots = await pool.query('SELECT id, name FROM marketplace_bots');
    
    for (const bot of bots.rows) {
      const rating = (Math.random() * 0.7 + 4.3).toFixed(2); // 4.3 - 5.0
      const ratingCount = Math.floor(Math.random() * 60 + 20); // 20 - 80
      const totalSales = Math.floor(Math.random() * 200 + 50); // 50 - 250
      const winRate = (Math.random() * 15 + 70).toFixed(1); // 70 - 85%
      const monthlyReturn = (Math.random() * 20 + 8).toFixed(1); // 8 - 28%
      
      await pool.query(`
        UPDATE marketplace_bots 
        SET rating_average = $1, rating_count = $2, total_sales = $3, 
            win_rate = $4, monthly_return = $5, verified_performance = true
        WHERE id = $6
      `, [rating, ratingCount, totalSales, winRate, monthlyReturn, bot.id]);
      
      console.log(`  Updated: ${bot.name} - Rating: ${rating}, Reviews: ${ratingCount}, Sales: ${totalSales}`);
    }
    
    // Update signal_providers with random ratings and subscribers
    const providers = await pool.query('SELECT id, display_name FROM signal_providers');
    
    for (const provider of providers.rows) {
      const rating = (Math.random() * 0.6 + 4.4).toFixed(2); // 4.4 - 5.0
      const ratingCount = Math.floor(Math.random() * 45 + 10); // 10 - 55
      const subscribers = Math.floor(Math.random() * 300 + 100); // 100 - 400
      const winRate = (Math.random() * 12 + 72).toFixed(1); // 72 - 84%
      const totalPips = Math.floor(Math.random() * 15000 + 8000); // 8000 - 23000
      
      await pool.query(`
        UPDATE signal_providers 
        SET rating_average = $1, rating_count = $2, subscriber_count = $3,
            win_rate = $4, total_pips = $5
        WHERE id = $6
      `, [rating, ratingCount, subscribers, winRate, totalPips, provider.id]);
      
      console.log(`  Updated: ${provider.display_name} - Rating: ${rating}, Reviews: ${ratingCount}, Subscribers: ${subscribers}`);
    }
    
    console.log('\n✅ All product stats updated!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateProductStats();
