// Script to seed reviews with profile pictures for all marketplace products
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false }
});

// Profile images for reviewers (using Unsplash)
const reviewerAvatars = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1557862921-37829c790f19?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=60&h=60&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=60&h=60&fit=crop&crop=face',
];

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
    console.log('🌱 Seeding reviews with profile pictures...\n');

    // Clear existing reviews first
    await pool.query('DELETE FROM marketplace_bot_reviews');
    await pool.query('DELETE FROM marketplace_product_reviews');
    await pool.query('DELETE FROM signal_provider_reviews');
    console.log('🗑️  Cleared existing reviews\n');
    
    // Drop unique constraints that prevent multiple reviews per user
    await pool.query('ALTER TABLE marketplace_bot_reviews DROP CONSTRAINT IF EXISTS marketplace_bot_reviews_bot_id_user_id_key');
    await pool.query('ALTER TABLE marketplace_product_reviews DROP CONSTRAINT IF EXISTS marketplace_product_reviews_product_id_user_id_key');
    await pool.query('ALTER TABLE signal_provider_reviews DROP CONSTRAINT IF EXISTS signal_provider_reviews_provider_id_user_id_key');
    console.log('🔓 Removed unique constraints\n');

    // Get user ID for reviews (use first available user)
    const users = await pool.query('SELECT id FROM users LIMIT 1');
    if (users.rows.length === 0) {
      console.log('❌ No users found.');
      return;
    }
    const userId = users.rows[0].id;

    let botReviewCount = 0;
    let productReviewCount = 0;
    let signalReviewCount = 0;

    // Seed Bot Reviews
    const bots = await pool.query('SELECT id, name FROM marketplace_bots');
    console.log(`📦 Found ${bots.rows.length} bots`);
    
    for (const bot of bots.rows) {
      const reviewCount = 5 + Math.floor(Math.random() * 6); // 5-10 reviews per bot
      const shuffledReviews = shuffleArray(botReviewTemplates);
      const shuffledNames = shuffleArray(reviewerNames);
      const shuffledAvatars = shuffleArray(reviewerAvatars);
      
      for (let i = 0; i < reviewCount; i++) {
        const template = shuffledReviews[i % shuffledReviews.length];
        const reviewerName = shuffledNames[i % shuffledNames.length];
        const reviewerAvatar = shuffledAvatars[i % shuffledAvatars.length];
        
        await pool.query(`
          INSERT INTO marketplace_bot_reviews (bot_id, user_id, rating, title, review, reviewer_name, reviewer_avatar, created_at, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published')
        `, [bot.id, userId, template.rating, template.title, template.review, reviewerName, reviewerAvatar, getRandomDate()]);
        botReviewCount++;
      }
      console.log(`  ✅ Added ${reviewCount} reviews for "${bot.name}"`);
    }

    // Update bot rating stats
    await pool.query(`
      UPDATE marketplace_bots b SET
        rating_average = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM marketplace_bot_reviews WHERE bot_id = b.id), 4.8),
        rating_count = COALESCE((SELECT COUNT(*) FROM marketplace_bot_reviews WHERE bot_id = b.id), 0),
        total_sales = GREATEST(total_sales, 10 + floor(random() * 90))
    `);

    // Seed Product Reviews
    const products = await pool.query('SELECT id, name FROM marketplace_products');
    console.log(`\n📚 Found ${products.rows.length} products`);
    
    for (const product of products.rows) {
      const reviewCount = 5 + Math.floor(Math.random() * 6);
      const shuffledReviews = shuffleArray(productReviewTemplates);
      const shuffledNames = shuffleArray(reviewerNames);
      const shuffledAvatars = shuffleArray(reviewerAvatars);
      
      for (let i = 0; i < reviewCount; i++) {
        const template = shuffledReviews[i % shuffledReviews.length];
        const reviewerName = shuffledNames[i % shuffledNames.length];
        const reviewerAvatar = shuffledAvatars[i % shuffledAvatars.length];
        
        await pool.query(`
          INSERT INTO marketplace_product_reviews (product_id, user_id, rating, title, review, reviewer_name, reviewer_avatar, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [product.id, userId, template.rating, template.title, template.review, reviewerName, reviewerAvatar, getRandomDate()]);
        productReviewCount++;
      }
      console.log(`  ✅ Added ${reviewCount} reviews for "${product.name}"`);
    }

    // Update product rating stats
    await pool.query(`
      UPDATE marketplace_products p SET
        rating_average = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM marketplace_product_reviews WHERE product_id = p.id), 4.8),
        rating_count = COALESCE((SELECT COUNT(*) FROM marketplace_product_reviews WHERE product_id = p.id), 0),
        total_sales = GREATEST(total_sales, 10 + floor(random() * 90))
    `);

    // Seed Signal Provider Reviews
    const providers = await pool.query('SELECT id, display_name FROM signal_providers');
    console.log(`\n📡 Found ${providers.rows.length} signal providers`);
    
    for (const provider of providers.rows) {
      const reviewCount = 5 + Math.floor(Math.random() * 6);
      const shuffledReviews = shuffleArray(signalReviewTemplates);
      const shuffledNames = shuffleArray(reviewerNames);
      const shuffledAvatars = shuffleArray(reviewerAvatars);
      
      for (let i = 0; i < reviewCount; i++) {
        const template = shuffledReviews[i % shuffledReviews.length];
        const reviewerName = shuffledNames[i % shuffledNames.length];
        const reviewerAvatar = shuffledAvatars[i % shuffledAvatars.length];
        
        await pool.query(`
          INSERT INTO signal_provider_reviews (provider_id, user_id, rating, title, review, reviewer_name, reviewer_avatar, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [provider.id, userId, template.rating, template.title, template.review, reviewerName, reviewerAvatar, getRandomDate()]);
        signalReviewCount++;
      }
      console.log(`  ✅ Added ${reviewCount} reviews for "${provider.display_name}"`);
    }

    // Update signal provider rating stats
    await pool.query(`
      UPDATE signal_providers sp SET
        rating_average = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM signal_provider_reviews WHERE provider_id = sp.id), 4.8),
        rating_count = COALESCE((SELECT COUNT(*) FROM signal_provider_reviews WHERE provider_id = sp.id), 0),
        subscriber_count = GREATEST(subscriber_count, 20 + floor(random() * 200))
    `);

    console.log('\n📊 Summary:');
    console.log(`   Bot reviews: ${botReviewCount}`);
    console.log(`   Product reviews: ${productReviewCount}`);
    console.log(`   Signal reviews: ${signalReviewCount}`);
    console.log('\n✨ Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

seedReviews();
