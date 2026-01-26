// Script to add missing signal provider ID 2
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addMissingProvider() {
  try {
    // Check if provider 2 exists
    const existing = await pool.query('SELECT id FROM signal_providers WHERE id = 2');
    
    if (existing.rows.length === 0) {
      await pool.query(`
        INSERT INTO signal_providers (
          id, user_id, display_name, slug, bio, trading_style, risk_level, 
          monthly_price, quarterly_price, yearly_price, status, 
          main_instruments, avatar_url, win_rate, total_pips, total_signals,
          subscriber_count, rating_average, rating_count
        ) VALUES (
          2, 12, 'Forex Elite', 'forex-elite', 
          'Former institutional trader with 10+ years experience. Focus on major currency pairs with strict risk management.',
          'Swing Trading', 'conservative', 
          79, 199, 699, 'approved',
          ARRAY['EURUSD', 'GBPUSD', 'USDJPY'],
          'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
          72.3, 8920, 420, 456, 4.9, 156
        )
      `);
      console.log('✅ Added Forex Elite (ID 2) signal provider');
    } else {
      // Update to approved status
      await pool.query(`UPDATE signal_providers SET status = 'approved' WHERE id = 2`);
      console.log('✅ Updated Forex Elite (ID 2) status to approved');
    }

    // Verify
    const providers = await pool.query('SELECT id, display_name, status FROM signal_providers ORDER BY id');
    console.log('\nCurrent signal providers:');
    providers.rows.forEach(p => console.log(`  ${p.id}: ${p.display_name} (${p.status})`));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

addMissingProvider();
