// Script to seed reviews for all marketplace products
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Sample reviewer names
const reviewerNames = [
  'Michael T.', 'Sarah K.', 'David R.', 'Emma L.', 'James O.',
  'Jennifer M.', 'Robert C.', 'Lisa P.', 'William H.', 'Amanda S.',
  'Christopher B.', 'Jessica W.', 'Daniel F.', 'Ashley G.', 'Matthew N.',
  'Nicole V.', 'Andrew Z.', 'Stephanie R.', 'Joshua K.', 'Rachel M.',
  'Kevin L.', 'Michelle T.', 'Brandon H.', 'Amber C.', 'Tyler J.'
];

// Bot review templates
const botReviewTemplates = [
  { rating: 5, title: 'Excellent EA!', review: 'This EA has completely transformed my trading. The risk management is excellent and I\'ve seen consistent profits over the past 3 months. Highly recommended!' },
  { rating: 5, title: 'Best purchase I\'ve made', review: 'After trying many EAs, this one actually delivers. The win rate matches what was advertised and the support is fantastic.' },
  { rating: 4, title: 'Very good results', review: 'Solid performance overall. Running it for 2 months now with about 15% profit. Only 4 stars because documentation could be better.' },
  { rating: 5, title: 'Worth every penny', review: 'Excellent EA with great risk management. The developer is responsive and updates are regular. My account has grown 25% in 6 weeks.' },
  { rating: 4, title: 'Good but needs patience', review: 'Takes some time to get used to the settings but once optimized, results are impressive. Good customer support too.' },
  { rating: 5, title: 'Finally, an EA that works!', review: 'Skeptical at first but this EA proved me wrong. Consistent profits with reasonable drawdown. The best investment for my trading.' },
  { rating: 5, title: 'Professional quality', review: 'You can tell this was developed by professional traders. The entry logic is solid and risk management is top-notch.' },
  { rating: 4, title: 'Impressed so far', review: 'Running for 1 month and seeing positive results. Easy to set up and the documentation is comprehensive.' },
  { rating: 5, title: 'Game changer', review: 'This EA changed how I trade. No more emotional decisions, just consistent automated trading with great results.' },
  { rating: 5, title: 'Exceeded expectations', review: 'The performance stats are accurate. I\'ve verified the win rate myself over 200+ trades. Highly recommend.' },
];

// Product review templates
const productReviewTemplates = [
  { rating: 5, title: 'Life-changing content!', review: 'This completely transformed my understanding of trading. The concepts are explained clearly and the examples are practical.' },
  { rating: 5, title: 'Best investment in my education', review: 'Worth every penny. The depth of knowledge shared here is incredible. I\'ve improved my win rate significantly.' },
  { rating: 4, title: 'Great content', review: 'Very comprehensive and well-structured. Some sections could use more examples but overall excellent quality.' },
  { rating: 5, title: 'Highly recommended', review: 'If you\'re serious about trading, this is a must-have. The strategies work and are explained step by step.' },
  { rating: 5, title: 'Exceptional value', review: 'The amount of actionable information here is amazing. Already seeing improvements in my trading results.' },
  { rating: 4, title: 'Very informative', review: 'Learned a lot from this. Would give 5 stars but wish there were more advanced topics covered.' },
  { rating: 5, title: 'A must for every trader', review: 'This should be required reading for anyone in forex. The insights are practical and immediately applicable.' },
  { rating: 5, title: 'Professional quality', review: 'You can tell this was created by experienced traders. Every concept is backed by real market examples.' },
  { rating: 4, title: 'Solid content', review: 'Good balance of theory and practice. Helped me understand market dynamics much better.' },
  { rating: 5, title: 'Worth the investment', review: 'Paid for itself within the first month of applying the strategies. Highly recommend to anyone serious about trading.' },
];

// Signal provider review templates
const signalReviewTemplates = [
  { rating: 5, title: 'Best signals I\'ve used!', review: 'Been following for 3 months now and my account has grown 35%. The risk management is excellent and the analysis helps me learn.' },
  { rating: 5, title: 'Highly recommended', review: 'Clear entry/exit points and the Telegram group is very supportive. Finally found signals that actually work.' },
  { rating: 4, title: 'Solid performance', review: 'Good win rate and reasonable risk per trade. Only 4 stars because sometimes signals come during off-hours for my timezone.' },
  { rating: 5, title: 'Finally, signals that work', review: 'After trying 3 other providers that were scams, I finally found one that delivers. The transparency is refreshing.' },
  { rating: 5, title: 'Professional service', review: 'The technical analysis shared with each signal is top-notch. I\'ve learned so much just from following their setups.' },
  { rating: 5, title: 'Consistent profits', review: 'The win rate is accurate. I\'ve been profitable every month since subscribing. Excellent value for the price.' },
  { rating: 4, title: 'Good overall', review: 'Signals are accurate but wish there were more during Asian session. Otherwise very satisfied with the service.' },
  { rating: 5, title: 'Changed my trading', review: 'Before these signals I was losing. Now I\'m consistently profitable. The education aspect is a bonus.' },
  { rating: 5, title: 'Worth the subscription', review: 'The signals pay for themselves many times over. Clear TP/SL levels and good risk management.' },
  { rating: 5, title: 'Excellent provider', review: 'Very professional. Signals are sent on time with clear instructions. Support is quick to respond.' },
];

function getRandomDate(daysAgo = 90) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function seedReviews() {
  try {
    console.log('🌱 Seeding reviews...\n');

    // Get user ID for reviews (use admin or first available user)
    const users = await pool.query('SELECT id FROM users LIMIT 5');
    if (users.rows.length === 0) {
      console.log('❌ No users found. Creating a system user for reviews...');
      return;
    }
    const userIds = users.rows.map(u => u.id);

    // Seed Bot Reviews
    const bots = await pool.query('SELECT id, name FROM marketplace_bots');
    console.log(`📦 Found ${bots.rows.length} bots`);
    
    for (const bot of bots.rows) {
      const reviewCount = 5 + Math.floor(Math.random() * 6); // 5-10 reviews per bot
      const shuffledReviews = shuffleArray(botReviewTemplates);
      const shuffledNames = shuffleArray(reviewerNames);
      
      for (let i = 0; i < reviewCount; i++) {
        const template = shuffledReviews[i % shuffledReviews.length];
        const reviewerName = shuffledNames[i % shuffledNames.length];
        const userId = userIds[i % userIds.length];
        
        await pool.query(`
          INSERT INTO marketplace_bot_reviews (bot_id, user_id, rating, title, review, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `, [bot.id, userId, template.rating, template.title, template.review, getRandomDate()]);
      }
      console.log(`  ✅ Added ${reviewCount} reviews for "${bot.name}"`);
    }

    // Update bot rating stats
    await pool.query(`
      UPDATE marketplace_bots b SET
        rating_average = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM marketplace_bot_reviews WHERE bot_id = b.id), 4.8),
        rating_count = COALESCE((SELECT COUNT(*) FROM marketplace_bot_reviews WHERE bot_id = b.id), 0)
    `);

    // Seed Product Reviews
    const products = await pool.query('SELECT id, name FROM marketplace_products');
    console.log(`\n📚 Found ${products.rows.length} products`);
    
    for (const product of products.rows) {
      const reviewCount = 5 + Math.floor(Math.random() * 6);
      const shuffledReviews = shuffleArray(productReviewTemplates);
      const shuffledNames = shuffleArray(reviewerNames);
      
      for (let i = 0; i < reviewCount; i++) {
        const template = shuffledReviews[i % shuffledReviews.length];
        const reviewerName = shuffledNames[i % shuffledNames.length];
        const userId = userIds[i % userIds.length];
        
        await pool.query(`
          INSERT INTO marketplace_product_reviews (product_id, user_id, rating, title, review, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `, [product.id, userId, template.rating, template.title, template.review, getRandomDate()]);
      }
      console.log(`  ✅ Added ${reviewCount} reviews for "${product.name}"`);
    }

    // Update product rating stats
    await pool.query(`
      UPDATE marketplace_products p SET
        rating_average = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM marketplace_product_reviews WHERE product_id = p.id), 4.8),
        rating_count = COALESCE((SELECT COUNT(*) FROM marketplace_product_reviews WHERE product_id = p.id), 0)
    `);

    // Seed Signal Provider Reviews
    const providers = await pool.query('SELECT id, display_name FROM signal_providers');
    console.log(`\n📡 Found ${providers.rows.length} signal providers`);
    
    for (const provider of providers.rows) {
      const reviewCount = 5 + Math.floor(Math.random() * 6);
      const shuffledReviews = shuffleArray(signalReviewTemplates);
      const shuffledNames = shuffleArray(reviewerNames);
      
      for (let i = 0; i < reviewCount; i++) {
        const template = shuffledReviews[i % shuffledReviews.length];
        const reviewerName = shuffledNames[i % shuffledNames.length];
        const userId = userIds[i % userIds.length];
        
        await pool.query(`
          INSERT INTO signal_provider_reviews (provider_id, user_id, rating, title, review, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `, [provider.id, userId, template.rating, template.title, template.review, getRandomDate()]);
      }
      console.log(`  ✅ Added ${reviewCount} reviews for "${provider.display_name}"`);
    }

    // Update signal provider rating stats
    await pool.query(`
      UPDATE signal_providers sp SET
        rating_average = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM signal_provider_reviews WHERE provider_id = sp.id), 4.8),
        rating_count = COALESCE((SELECT COUNT(*) FROM signal_provider_reviews WHERE provider_id = sp.id), 0)
    `);

    // Also update bot purchase/sales stats for credibility
    await pool.query(`
      UPDATE marketplace_bots SET
        total_sales = CASE 
          WHEN total_sales = 0 THEN 50 + floor(random() * 200)::int
          ELSE total_sales
        END
    `);

    await pool.query(`
      UPDATE marketplace_products SET
        total_sales = CASE 
          WHEN total_sales = 0 THEN 30 + floor(random() * 150)::int
          ELSE total_sales
        END
    `);

    await pool.query(`
      UPDATE signal_providers SET
        subscriber_count = CASE 
          WHEN subscriber_count = 0 THEN 100 + floor(random() * 400)::int
          ELSE subscriber_count
        END
    `);

    console.log('\n✨ Review seeding completed!');

    // Show summary
    const botReviewCount = await pool.query('SELECT COUNT(*) FROM marketplace_bot_reviews');
    const productReviewCount = await pool.query('SELECT COUNT(*) FROM marketplace_product_reviews');
    const signalReviewCount = await pool.query('SELECT COUNT(*) FROM signal_provider_reviews');

    console.log('\n📊 Summary:');
    console.log(`  Bot reviews: ${botReviewCount.rows[0].count}`);
    console.log(`  Product reviews: ${productReviewCount.rows[0].count}`);
    console.log(`  Signal reviews: ${signalReviewCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error seeding reviews:', error.message);
  } finally {
    await pool.end();
  }
}

seedReviews();
