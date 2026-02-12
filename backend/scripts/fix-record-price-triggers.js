import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL?.trim(), max: 2 });

async function fix() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    await client.query('DROP TRIGGER IF EXISTS track_bot_price_changes ON marketplace_bots');
    await client.query('DROP TRIGGER IF EXISTS track_provider_price_changes ON signal_providers');
    await client.query('DROP TRIGGER IF EXISTS track_product_price_changes ON marketplace_products');
    await client.query('DROP FUNCTION IF EXISTS record_price_change()');
    console.log('Dropped old triggers and function');

    await client.query(`
      CREATE OR REPLACE FUNCTION record_bot_price_change()
      RETURNS TRIGGER AS $func$
      BEGIN
        IF OLD.price IS DISTINCT FROM NEW.price OR OLD.price_type IS DISTINCT FROM NEW.price_type THEN
          INSERT INTO price_history (bot_id, old_price, new_price, old_price_type, new_price_type, changed_by)
          VALUES (NEW.id, OLD.price, NEW.price, OLD.price_type, NEW.price_type, NEW.seller_id);
        END IF;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql;
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION record_provider_price_change()
      RETURNS TRIGGER AS $func$
      BEGIN
        IF OLD.monthly_price IS DISTINCT FROM NEW.monthly_price THEN
          INSERT INTO price_history (provider_id, old_price, new_price, changed_by)
          VALUES (NEW.id, OLD.monthly_price, NEW.monthly_price, NEW.user_id);
        END IF;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql;
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION record_product_price_change()
      RETURNS TRIGGER AS $func$
      BEGIN
        IF OLD.price IS DISTINCT FROM NEW.price THEN
          INSERT INTO price_history (product_id, old_price, new_price, changed_by)
          VALUES (NEW.id, OLD.price, NEW.price, NEW.seller_id);
        END IF;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql;
    `);
    console.log('Created separate trigger functions');

    await client.query('CREATE TRIGGER track_bot_price_changes BEFORE UPDATE ON marketplace_bots FOR EACH ROW EXECUTE FUNCTION record_bot_price_change()');
    await client.query('CREATE TRIGGER track_provider_price_changes BEFORE UPDATE ON signal_providers FOR EACH ROW EXECUTE FUNCTION record_provider_price_change()');
    await client.query('CREATE TRIGGER track_product_price_changes BEFORE UPDATE ON marketplace_products FOR EACH ROW EXECUTE FUNCTION record_product_price_change()');
    console.log('Created new triggers');

    await client.query('COMMIT');
    console.log('\n✅ All triggers fixed!');

    // Test featured toggle
    const bot = (await client.query("SELECT id, is_featured FROM marketplace_bots LIMIT 1")).rows[0];
    await client.query("UPDATE marketplace_bots SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [!bot.is_featured, bot.id]);
    await client.query("UPDATE marketplace_bots SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [bot.is_featured, bot.id]);
    console.log('✅ Bot featured toggle works!');

    const sp = (await client.query("SELECT id, is_featured FROM signal_providers LIMIT 1")).rows[0];
    await client.query("UPDATE signal_providers SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [!sp.is_featured, sp.id]);
    await client.query("UPDATE signal_providers SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [sp.is_featured, sp.id]);
    console.log('✅ Signal featured toggle works!');

    const prod = (await client.query("SELECT id, is_featured FROM marketplace_products LIMIT 1")).rows[0];
    await client.query("UPDATE marketplace_products SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [!prod.is_featured, prod.id]);
    await client.query("UPDATE marketplace_products SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [prod.is_featured, prod.id]);
    console.log('✅ Product featured toggle works!');

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Fix failed:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fix();
