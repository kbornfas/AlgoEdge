import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkAndSeedBots() {
  try {
    // Check current counts
    const botsCount = await pool.query('SELECT COUNT(*) FROM marketplace_bots');
    const providersCount = await pool.query('SELECT COUNT(*) FROM signal_providers');
    const productsCount = await pool.query('SELECT category, COUNT(*) as count FROM marketplace_products WHERE status = $1 GROUP BY category', ['approved']);
    
    console.log('\n📊 Current Database Status:');
    console.log('Marketplace Bots:', botsCount.rows[0].count);
    console.log('Signal Providers:', providersCount.rows[0].count);
    console.log('Products by category:');
    console.table(productsCount.rows);

    // Get admin user
    const admin = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (admin.rows.length === 0) {
      console.log('No admin user found. Creating default admin...');
      return;
    }
    const sellerId = admin.rows[0].id;

    // Seed marketplace_bots if empty
    if (parseInt(botsCount.rows[0].count) === 0) {
      console.log('\n🤖 Seeding marketplace_bots...');
      
      const bots = [
        {
          name: 'Gold Scalper Pro',
          slug: 'gold-scalper-pro',
          description: 'Professional XAUUSD scalping EA with advanced risk management. Optimized for M5/M15 timeframes with smart lot sizing, news filter, and trailing stop functionality.',
          short_description: 'High-performance gold scalping bot with 72% win rate',
          category: 'scalper',
          price: 149.00,
          price_type: 'one_time',
          thumbnail_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
          tags: ['Gold', 'XAUUSD', 'Scalping', 'MT5'],
          win_rate: 72.5,
          monthly_return: 12.5,
          max_drawdown: 15.0,
          supported_pairs: ['XAUUSD'],
          supported_platforms: ['MT5'],
          minimum_balance: 500,
        },
        {
          name: 'Silver Trend Rider',
          slug: 'silver-trend-rider',
          description: 'Trend-following EA for XAGUSD with pyramid trading and intelligent position scaling based on ATR.',
          short_description: 'Catch silver trends with intelligent position scaling',
          category: 'trend',
          price: 129.00,
          price_type: 'one_time',
          thumbnail_url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400',
          tags: ['Silver', 'XAGUSD', 'Trend Following'],
          win_rate: 65.0,
          monthly_return: 10.0,
          max_drawdown: 12.0,
          supported_pairs: ['XAGUSD'],
          supported_platforms: ['MT5'],
          minimum_balance: 1000,
        },
        {
          name: 'Multi-Metal Portfolio EA',
          slug: 'multi-metal-portfolio',
          description: 'Diversified precious metals trading strategy for Gold, Silver and Platinum with correlation filter and risk diversification.',
          short_description: 'Trade Gold, Silver & Platinum with one EA',
          category: 'portfolio',
          price: 199.00,
          price_type: 'one_time',
          thumbnail_url: 'https://images.unsplash.com/photo-1624365168968-f283d506c6b6?w=400',
          tags: ['Gold', 'Silver', 'Platinum', 'Portfolio'],
          win_rate: 68.0,
          monthly_return: 8.5,
          max_drawdown: 10.0,
          supported_pairs: ['XAUUSD', 'XAGUSD', 'XPTUSD'],
          supported_platforms: ['MT5'],
          minimum_balance: 2000,
        },
        {
          name: 'News Trading Sniper',
          slug: 'news-trading-sniper',
          description: 'Capitalize on high-impact news events with automated spike detection and quick execution.',
          short_description: 'Automated news trading with spike detection',
          category: 'news',
          price: 179.00,
          price_type: 'one_time',
          thumbnail_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400',
          tags: ['News Trading', 'Volatility', 'Events'],
          win_rate: 58.0,
          monthly_return: 15.0,
          max_drawdown: 20.0,
          supported_pairs: ['XAUUSD', 'EURUSD', 'GBPUSD'],
          supported_platforms: ['MT5', 'MT4'],
          minimum_balance: 1000,
        },
        {
          name: 'Risk Manager Pro',
          slug: 'risk-manager-pro',
          description: 'Advanced account protection and risk management utility with daily loss limits, equity protection, and trade alerts.',
          short_description: 'Protect your capital with smart risk controls',
          category: 'utility',
          price: 79.00,
          price_type: 'one_time',
          thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
          tags: ['Risk Management', 'Utility', 'Protection'],
          win_rate: null,
          monthly_return: null,
          max_drawdown: null,
          supported_pairs: ['All'],
          supported_platforms: ['MT5', 'MT4'],
          minimum_balance: 100,
        },
      ];

      for (const bot of bots) {
        await pool.query(`
          INSERT INTO marketplace_bots (
            seller_id, name, slug, description, short_description, category,
            price, price_type, thumbnail_url, tags,
            win_rate, monthly_return, max_drawdown, 
            supported_pairs, supported_platforms, minimum_balance,
            status, is_official
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'approved', true)
        `, [
          sellerId, bot.name, bot.slug, bot.description, bot.short_description, bot.category,
          bot.price, bot.price_type, bot.thumbnail_url, bot.tags,
          bot.win_rate, bot.monthly_return, bot.max_drawdown,
          bot.supported_pairs, bot.supported_platforms, bot.minimum_balance
        ]);
        console.log(`  ✅ Added bot: ${bot.name}`);
      }
    }

    // Seed signal_providers if empty
    if (parseInt(providersCount.rows[0].count) === 0) {
      console.log('\n📡 Seeding signal_providers...');
      
      const providers = [
        {
          display_name: 'Gold Master Signals',
          slug: 'gold-master-signals',
          bio: 'Professional XAUUSD trader with 5+ years experience. Specialized in technical analysis and price action trading.',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          monthly_price: 49.00,
          win_rate: 75.0,
          total_pips: 12500,
          average_pips: 45,
          trading_style: 'day_trading',
          main_instruments: ['XAUUSD'],
          risk_level: 'medium',
        },
        {
          display_name: 'Precious Metals Pro',
          slug: 'precious-metals-pro',
          bio: 'Expert in Gold & Silver trading signals with comprehensive market analysis.',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          monthly_price: 39.00,
          win_rate: 70.0,
          total_pips: 9800,
          average_pips: 38,
          trading_style: 'swing',
          main_instruments: ['XAUUSD', 'XAGUSD'],
          risk_level: 'low',
        },
        {
          display_name: 'Scalp King',
          slug: 'scalp-king',
          bio: 'Quick scalping signals for intraday traders. Multiple signals daily with tight stop losses.',
          avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          monthly_price: 59.00,
          win_rate: 68.0,
          total_pips: 8500,
          average_pips: 25,
          trading_style: 'scalping',
          main_instruments: ['XAUUSD', 'EURUSD'],
          risk_level: 'high',
        },
        {
          display_name: 'Swing Trader Elite',
          slug: 'swing-trader-elite',
          bio: 'Medium-term swing trading signals based on technical and fundamental analysis.',
          avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
          monthly_price: 69.00,
          win_rate: 72.0,
          total_pips: 15000,
          average_pips: 85,
          trading_style: 'swing',
          main_instruments: ['XAUUSD', 'XAGUSD', 'EURUSD'],
          risk_level: 'medium',
        },
      ];

      for (const provider of providers) {
        await pool.query(`
          INSERT INTO signal_providers (
            user_id, display_name, slug, bio, avatar_url,
            monthly_price, win_rate, total_pips, average_pips,
            trading_style, main_instruments, risk_level, 
            status, is_official
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'approved', true)
        `, [
          sellerId, provider.display_name, provider.slug, provider.bio, provider.avatar_url,
          provider.monthly_price, provider.win_rate, provider.total_pips, provider.average_pips,
          provider.trading_style, provider.main_instruments, provider.risk_level
        ]);
        console.log(`  ✅ Added signal provider: ${provider.display_name}`);
      }
    }

    console.log('\n✅ Seeding complete!');
    
    // Final counts
    const finalBots = await pool.query('SELECT COUNT(*) FROM marketplace_bots');
    const finalProviders = await pool.query('SELECT COUNT(*) FROM signal_providers');
    console.log('\n📊 Final Counts:');
    console.log('Marketplace Bots:', finalBots.rows[0].count);
    console.log('Signal Providers:', finalProviders.rows[0].count);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkAndSeedBots();
