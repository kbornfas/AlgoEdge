#!/usr/bin/env node

/**
 * Migration Conflict Resolution Script
 * 
 * This script helps resolve Prisma migration conflicts (P3005 error)
 * when deploying to a database that already has schema.
 * 
 * Usage:
 *   npm run migrate:resolve
 *   node scripts/resolve-migration-conflict.js
 */

// Load environment variables
require('dotenv').config();

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const execAsync = promisify(exec);
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for input
 */
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Execute a command and return output
 */
async function execCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });
    return { success: true, stdout, stderr };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    };
  }
}

/**
 * Get list of migrations
 */
function getMigrations() {
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }
  
  return fs.readdirSync(migrationsDir)
    .filter(item => {
      const itemPath = path.join(migrationsDir, item);
      return fs.statSync(itemPath).isDirectory() && item !== '_prisma_migrations';
    })
    .sort();
}

/**
 * Main function
 */
async function main() {
  console.log('=====================================');
  console.log('  Migration Conflict Resolution');
  console.log('=====================================\n');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    console.error('   Please set DATABASE_URL in your .env file.\n');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL is set\n');
  
  // Check migration status
  console.log('🔍 Checking current migration status...\n');
  const statusResult = await execCommand('npx prisma migrate status');
  
  if (statusResult.stdout) {
    console.log(statusResult.stdout);
  }
  
  if (statusResult.stderr && statusResult.stderr.includes('P3005')) {
    console.log('\n⚠️  Detected P3005 error: Database schema is not empty\n');
  }
  
  // Get available migrations
  const migrations = getMigrations();
  
  if (migrations.length === 0) {
    console.log('⚠️  No migrations found in prisma/migrations/ directory\n');
    console.log('Options:');
    console.log('1. If you used "prisma db push" instead of migrations:');
    console.log('   - This is expected. Continue using "prisma db push" for development');
    console.log('2. If you need to set up migrations:');
    console.log('   - Run "npx prisma migrate dev" to create initial migration\n');
    rl.close();
    return;
  }
  
  console.log('\nAvailable migrations:');
  migrations.forEach((migration, index) => {
    console.log(`  ${index + 1}. ${migration}`);
  });
  
  console.log('\n=====================================');
  console.log('Resolution Options:');
  console.log('=====================================\n');
  console.log('1. Mark ALL migrations as applied');
  console.log('2. Mark specific migration as applied');
  console.log('3. Sync schema from database (prisma db pull)');
  console.log('4. Show migration status only');
  console.log('5. Exit\n');
  
  const choice = await question('Select an option (1-5): ');
  
  switch (choice) {
    case '1':
      // Mark all migrations as applied
      console.log('\n📝 Marking all migrations as applied...\n');
      for (const migration of migrations) {
        console.log(`Processing: ${migration}`);
        const result = await execCommand(`npx prisma migrate resolve --applied "${migration}"`);
        if (result.success) {
          console.log(`✅ Marked as applied: ${migration}`);
        } else {
          console.error(`❌ Failed to mark: ${migration}`);
          if (result.stderr) console.error(result.stderr);
        }
      }
      
      // Verify status
      console.log('\n🔍 Verifying migration status...\n');
      const verifyResult = await execCommand('npx prisma migrate status');
      if (verifyResult.stdout) console.log(verifyResult.stdout);
      break;
      
    case '2':
      // Mark specific migration as applied
      console.log('\nAvailable migrations:');
      migrations.forEach((migration, index) => {
        console.log(`  ${index + 1}. ${migration}`);
      });
      
      const migrationChoice = await question('\nSelect migration number: ');
      const migrationIndex = parseInt(migrationChoice) - 1;
      
      if (migrationIndex >= 0 && migrationIndex < migrations.length) {
        const selectedMigration = migrations[migrationIndex];
        console.log(`\n📝 Marking as applied: ${selectedMigration}\n`);
        
        const result = await execCommand(`npx prisma migrate resolve --applied "${selectedMigration}"`);
        if (result.success) {
          console.log(`✅ Successfully marked as applied: ${selectedMigration}`);
        } else {
          console.error(`❌ Failed to mark as applied`);
          if (result.stderr) console.error(result.stderr);
        }
      } else {
        console.error('❌ Invalid migration number');
      }
      break;
      
    case '3':
      // Sync schema from database
      console.log('\n📥 Syncing schema from database...\n');
      console.log('⚠️  This will overwrite your prisma/schema.prisma file!');
      const confirm = await question('Continue? (yes/no): ');
      
      if (confirm.toLowerCase() === 'yes') {
        const pullResult = await execCommand('npx prisma db pull');
        if (pullResult.success) {
          console.log('\n✅ Schema synced from database');
          console.log('   Review the changes with: git diff prisma/schema.prisma');
          console.log('   Then run: npx prisma generate');
        } else {
          console.error('❌ Failed to sync schema');
          if (pullResult.stderr) console.error(pullResult.stderr);
        }
      } else {
        console.log('Cancelled.');
      }
      break;
      
    case '4':
      // Just show status (already shown above)
      console.log('\n✅ Migration status displayed above.');
      break;
      
    case '5':
      console.log('\nExiting...');
      break;
      
    default:
      console.error('\n❌ Invalid option');
  }
  
  console.log('\n=====================================');
  console.log('  Resolution Complete');
  console.log('=====================================\n');
  console.log('Next steps:');
  console.log('  1. Verify migration status: npx prisma migrate status');
  console.log('  2. Deploy remaining migrations: npx prisma migrate deploy');
  console.log('  3. Generate Prisma client: npx prisma generate');
  console.log('  4. Seed database if needed: npm run seed:all\n');
  
  rl.close();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  rl.close();
  process.exit(1);
});

// Run main function
main().catch((error) => {
  console.error('\n❌ Script failed:', error);
  rl.close();
  process.exit(1);
});
