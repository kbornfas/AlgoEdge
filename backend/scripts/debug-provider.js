import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugProvider() {
  try {
    const providerId = 1;
    
    // Same query as in the route
    const provider = await pool.query(`
      SELECT sp.*, u.username, u.created_at as member_since
      FROM signal_providers sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = $1 AND sp.status = 'approved'
    `, [providerId]);

    console.log('Provider found:', provider.rows.length > 0 ? 'YES' : 'NO');
    
    if (provider.rows.length > 0) {
      const p = provider.rows[0];
      console.log('\nProvider details:');
      console.log('ID:', p.id);
      console.log('Display Name:', p.display_name);
      console.log('Monthly Price:', p.monthly_price);
      console.log('Quarterly Price:', p.quarterly_price);
      console.log('Yearly Price:', p.yearly_price);
      console.log('Win Rate:', p.win_rate);
      console.log('Total Pips:', p.total_pips);
      console.log('Subscriber Count:', p.subscriber_count);
      console.log('Rating Average:', p.rating_average);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugProvider();
