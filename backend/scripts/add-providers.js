import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addMoreProviders() {
  const admin = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  const sellerId = admin.rows[0].id;
  
  const providers = [
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

  for (const p of providers) {
    try {
      // Check if exists
      const exists = await pool.query('SELECT id FROM signal_providers WHERE slug = $1', [p.slug]);
      if (exists.rows.length > 0) {
        console.log(`Skip (exists): ${p.display_name}`);
        continue;
      }
      
      await pool.query(`
        INSERT INTO signal_providers (
          user_id, display_name, slug, bio, avatar_url,
          monthly_price, win_rate, total_pips, average_pips,
          trading_style, main_instruments, risk_level, 
          status, is_official
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'approved', true)
      `, [
        sellerId, p.display_name, p.slug, p.bio, p.avatar_url,
        p.monthly_price, p.win_rate, p.total_pips, p.average_pips,
        p.trading_style, p.main_instruments, p.risk_level
      ]);
      console.log(`Added: ${p.display_name}`);
    } catch (e) {
      console.log(`Error: ${p.display_name}:`, e.message);
    }
  }
  
  const count = await pool.query('SELECT COUNT(*) FROM signal_providers');
  console.log('\nTotal signal providers:', count.rows[0].count);
  
  await pool.end();
  process.exit(0);
}

addMoreProviders();
