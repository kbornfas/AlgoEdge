#!/usr/bin/env node

/**
 * P3005 Error Resolution Script
 * 
 * This script helps resolve Prisma P3005 errors ("database schema is not empty")
 * that occur when deploying migrations to an existing database.
 * 
 * Usage:
 *   node scripts/resolve-p3005.js [options]
 * 
 * Options:
 *   --auto      Automatically resolve all migrations without prompting
 *   --dry-run   Show what would be done without making changes
 * 
 * The script will:
 * 1. Check current migration status
 * 2. Identify all migrations that need to be marked as applied
 * 3. Mark each migration as applied
 * 4. Verify the final state
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const isAuto = args.includes('--auto');
const isDryRun = args.includes('--dry-run');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Execute command and return output
 */
function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024,
      ...options
    });
  } catch (error) {
    return {
      success: false,
      output: error.stderr || error.stdout || error.message,
      error: error
    };
  }
}

/**
 * Get all migration names from the migrations directory
 */
function getMigrationNames() {
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found:', migrationsDir);
    return [];
  }
  
  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
  return entries
    .filter(entry => 
      entry.isDirectory() && 
      !entry.name.startsWith('.') &&
      entry.name !== 'README.md'
    )
    .map(entry => entry.name)
    .sort();
}

/**
 * Check current migration status
 */
function checkMigrationStatus() {
  console.log('🔍 Checking migration status...\n');
  const output = exec('npx prisma migrate status');
  
  if (typeof output === 'string') {
    console.log(output);
    return { hasError: false, isPending: output.includes('pending'), output };
  } else {
    console.log(output.output);
    const hasP3005 = output.output.includes('P3005') || 
                     output.output.includes('database schema is not empty');
    return { hasError: true, hasP3005, output: output.output };
  }
}

/**
 * Prompt user for confirmation
 */
function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.toLowerCase().trim());
    });
  });
}

/**
 * Mark a migration as applied
 */
function resolveMigration(migrationName, dryRun = false) {
  if (dryRun) {
    console.log(`   [DRY RUN] Would mark "${migrationName}" as applied`);
    return true;
  }
  
  try {
    const output = execSync(
      `npx prisma migrate resolve --applied "${migrationName}"`,
      {
        encoding: 'utf-8',
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024,
      }
    );
    
    console.log(`   ✅ Marked "${migrationName}" as applied`);
    return true;
  } catch (error) {
    const errorMsg = error.stderr || error.stdout || error.message;
    
    // Check if already applied (not an error)
    if (errorMsg.includes('already applied') || errorMsg.includes('is applied')) {
      console.log(`   ℹ️  "${migrationName}" was already marked as applied`);
      return true;
    }
    
    console.error(`   ❌ Failed to resolve "${migrationName}":`, errorMsg);
    return false;
  }
}

/**
 * Main resolution process
 */
async function main() {
  console.log('========================================');
  console.log('  Prisma P3005 Error Resolution Tool');
  console.log('========================================\n');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    console.error('   Please set DATABASE_URL before running this script');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL is configured\n');
  
  // Check migration status
  const status = checkMigrationStatus();
  
  // Get all migrations
  const migrations = getMigrationNames();
  
  if (migrations.length === 0) {
    console.error('\n❌ No migrations found in prisma/migrations directory');
    process.exit(1);
  }
  
  console.log(`\n📋 Found ${migrations.length} migration(s):`);
  migrations.forEach((name, index) => {
    console.log(`   ${index + 1}. ${name}`);
  });
  
  // Determine if we need to resolve
  let shouldResolve = false;
  
  if (status.hasP3005) {
    console.log('\n⚠️  P3005 error detected: Database schema is not empty');
    console.log('   This means the database has tables but migration history is missing.');
    shouldResolve = true;
  } else if (status.hasError) {
    console.log('\n⚠️  Migration status check failed');
    shouldResolve = true;
  } else if (status.isPending) {
    console.log('\n⚠️  Pending migrations detected');
    shouldResolve = false;
  } else {
    console.log('\n✅ Database appears to be up to date');
    shouldResolve = false;
  }
  
  if (!shouldResolve) {
    console.log('\n✅ No P3005 resolution needed');
    
    if (!isAuto && !isDryRun) {
      const answer = await prompt('\nDo you want to mark migrations as applied anyway? (yes/no): ');
      if (answer !== 'yes' && answer !== 'y') {
        console.log('\n✅ Operation cancelled');
        rl.close();
        return;
      }
      shouldResolve = true;
    } else {
      rl.close();
      return;
    }
  }
  
  // Ask for confirmation unless in auto mode
  if (!isAuto && !isDryRun) {
    console.log('\n🔧 Resolution Strategy:');
    console.log('   1. Mark all existing migrations as applied');
    console.log('   2. This tells Prisma that the database already has these changes');
    console.log('   3. Future migrations can then be applied normally');
    
    const answer = await prompt('\nProceed with resolution? (yes/no): ');
    if (answer !== 'yes' && answer !== 'y') {
      console.log('\n✅ Operation cancelled');
      rl.close();
      return;
    }
  }
  
  rl.close();
  
  // Resolve all migrations
  console.log('\n🔧 Resolving migrations...\n');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const migration of migrations) {
    const success = resolveMigration(migration, isDryRun);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  console.log(`\n📊 Resolution Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
  
  if (isDryRun) {
    console.log('\n🔍 DRY RUN completed - no changes were made');
    console.log('   Run without --dry-run to apply changes');
    return;
  }
  
  // Check status again
  if (successCount > 0) {
    console.log('\n📊 Checking migration status after resolution...\n');
    checkMigrationStatus();
  }
  
  if (failureCount === 0) {
    console.log('\n========================================');
    console.log('  ✅ P3005 Resolution Completed!');
    console.log('========================================\n');
    console.log('Next steps:');
    console.log('  1. Run: npx prisma migrate deploy');
    console.log('  2. Or redeploy your application');
    console.log('');
  } else {
    console.log('\n========================================');
    console.log('  ⚠️  Resolution Completed with Errors');
    console.log('========================================\n');
    console.log('Some migrations could not be resolved.');
    console.log('Please review the errors above and resolve manually if needed.');
    console.log('');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  rl.close();
  process.exit(1);
});
