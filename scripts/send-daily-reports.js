#!/usr/bin/env node

/**
 * Daily Trade Report Sender
 * 
 * This script sends daily trading performance summaries to all eligible users.
 * It uses a dedicated database connection that is properly closed after execution.
 * 
 * Usage:
 *   node scripts/send-daily-reports.js
 * 
 * Schedule with cron (daily at 6 PM):
 *   0 18 * * * cd /path/to/AlgoEdge && node scripts/send-daily-reports.js >> logs/daily-reports.log 2>&1
 * 
 * Requirements:
 *   - SMTP environment variables configured
 *   - Database connection available
 *   - Users with trades for the current day
 */

import { sendDailyReportsToAllUsers } from '../backend/services/emailService.js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function main() {
  // Create a dedicated pool for this script
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('========================================');
  console.log('📧 AlgoEdge Daily Trade Report Sender');
  console.log('========================================');
  console.log(`Started: ${new Date().toISOString()}\n`);

  try {
    // Send daily reports to all eligible users
    const summary = await sendDailyReportsToAllUsers(pool);
    
    console.log('\n========================================');
    console.log('📊 Report Summary:');
    console.log('========================================');
    console.log(`Total Users:    ${summary.total}`);
    console.log(`Sent:           ${summary.sent} ✅`);
    console.log(`Failed:         ${summary.failed} ❌`);
    console.log(`Timestamp:      ${summary.timestamp}`);
    
    if (summary.error) {
      console.error(`\n❌ Error: ${summary.error}`);
      process.exit(1);
    }
    
    console.log('\n✅ Daily report batch completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Failed to send daily reports:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close database connection created by this script
    await pool.end();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
