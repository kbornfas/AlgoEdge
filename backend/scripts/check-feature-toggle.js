import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL?.trim(), max: 2 });

async function check() {
  // Check admin user
  const admin = await pool.query("SELECT id, username, has_blue_badge FROM users WHERE username = 'admin' OR email = 'kbonface03@gmail.com' LIMIT 1");
  console.log('Admin user:', admin.rows[0]);

  // Try the exact update that the admin panel does
  const botId = (await pool.query("SELECT id, name, is_featured, seller_id FROM marketplace_bots LIMIT 1")).rows[0];
  console.log('\nTest bot:', botId);

  try {
    const result = await pool.query(
      "UPDATE marketplace_bots SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, slug, is_featured",
      [!botId.is_featured, botId.id]
    );
    console.log('✅ Update succeeded:', result.rows[0]);
    
    // Revert
    await pool.query(
      "UPDATE marketplace_bots SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [botId.is_featured, botId.id]
    );
    console.log('✅ Reverted back');
  } catch (e) {
    console.error('❌ Update FAILED:', e.message);
  }

  // Check triggers
  const triggers = await pool.query(`
    SELECT trigger_name, event_manipulation, action_statement 
    FROM information_schema.triggers 
    WHERE event_object_table = 'marketplace_bots'
  `);
  console.log('\nTriggers on marketplace_bots:');
  triggers.rows.forEach(t => console.log(`  ${t.event_manipulation}: ${t.trigger_name} -> ${t.action_statement}`));

  await pool.end();
}

check().catch(e => { console.error(e); pool.end(); });
