#!/usr/bin/env node

/**
 * Script to delete old trading bots from the database
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const botsToDelete = [
  'algoedge_1_0',
  'ea888', 
  'poverty_killer',
  'golden_sniper',
  'scalp_master_pro',
  'trend_dominator',
  'profit_maximizer'
];

async function deleteOldBots() {
  try {
    const result = await pool.query(
      `DELETE FROM trading_robots WHERE id = ANY($1::text[])`,
      [botsToDelete]
    );
    console.log(`✅ Deleted ${result.rowCount} old trading robots`);
  } catch (error) {
    console.error('Error deleting bots:', error.message);
  } finally {
    await pool.end();
  }
}

deleteOldBots();
