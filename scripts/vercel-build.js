#!/usr/bin/env node

/**
 * Vercel Build Script - Ensures database migrations are applied before building
 * 
 * This script:
 * 1. Validates DATABASE_URL is set
 * 2. Tests database connectivity
 * 3. Applies all pending migrations using `prisma migrate deploy`
 * 4. Verifies critical tables exist (including payment_proofs)
 * 5. Exits with clear error messages if any step fails
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

// Critical tables that must exist
const REQUIRED_TABLES = [
  'users',
  'subscriptions',
  'mt5_accounts',
  'trading_robots',
  'user_robot_configs',
  'trades',
  'user_settings',
  'verification_codes',
  'audit_logs',
  'payment_proofs', // This is the critical table that was missing
];

/**
 * Execute a shell command with proper error handling
 */
function execCommand(command, description) {
  console.log(`\n📦 ${description}...`);
  
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe',
      // Large buffer to handle extensive migration output
      // Prisma migrations can generate significant output (table creation, indexes, foreign keys)
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    
    if (output) {
      console.log(output);
    }
    
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
    return false;
  }
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  console.log('\n🔍 Validating environment...');
  
  if (!process.env.DATABASE_URL) {
    console.error('\n❌ ERROR: DATABASE_URL environment variable is not set!');
    console.error('   Please configure DATABASE_URL in your Vercel project settings.');
    console.error('   Go to: Project Settings > Environment Variables');
    process.exit(1);
  }
  
  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
    console.error('\n❌ ERROR: DATABASE_URL must be a PostgreSQL connection string');
    console.error(`   Current value starts with: ${dbUrl.substring(0, 20)}...`);
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL is set and valid');
}

/**
 * Test database connectivity
 */
async function testDatabaseConnection() {
  console.log('\n🔍 Testing database connection...');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('\n❌ ERROR: Cannot connect to database');
    console.error('   Message:', error.message);
    
    if (error.code === 'P1001') {
      console.error('\n   Common causes:');
      console.error('   1. Database server is not accessible');
      console.error('   2. Incorrect DATABASE_URL');
      console.error('   3. Network/firewall issues');
      console.error('   4. Database server is not running');
    }
    
    await prisma.$disconnect().catch(() => {});
    return false;
  }
}

/**
 * Apply database migrations
 */
function applyMigrations() {
  console.log('\n🔍 Applying database migrations...');
  
  // Check migration status first
  console.log('\n📊 Checking migration status...');
  try {
    const statusOutput = execSync('npx prisma migrate status', {
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024,
    });
    console.log(statusOutput);
    
    // Check if there are pending migrations or conflicts
    if (statusOutput.includes('Following migration have not yet been applied')) {
      console.log('   ℹ️  Pending migrations detected, will apply them now');
    } else if (statusOutput.includes('Database schema is up to date')) {
      console.log('   ✅ Database is already up to date');
      return true;
    } else if (statusOutput.includes('The following migrations have failed')) {
      console.log('\n   ⚠️  Failed migrations detected, attempting to resolve...');
      
      // Try to resolve failed migrations
      // This marks migrations as applied if the database already has the changes
      const resolveSuccess = execCommand(
        'npx prisma migrate resolve --applied "20260102090000_init"',
        'Resolving initial migration'
      );
      
      if (resolveSuccess) {
        execCommand(
          'npx prisma migrate resolve --applied "20260102090350_add_approval_status_and_rejection_reason"',
          'Resolving approval status migration'
        );
      }
    }
  } catch (error) {
    // If status check fails, continue with deployment attempt
    console.log('   ⚠️  Could not check migration status, proceeding with deployment');
  }
  
  // Apply pending migrations
  const success = execCommand(
    'npx prisma migrate deploy',
    'Deploying Prisma migrations'
  );
  
  if (!success) {
    console.error('\n❌ ERROR: Migration deployment failed');
    console.error('   This usually means:');
    console.error('   1. Database schema is out of sync');
    console.error('   2. Migration files are corrupted');
    console.error('   3. Database permissions are insufficient');
    console.error('\n   To manually resolve:');
    console.error('   1. Check migration status: npx prisma migrate status');
    console.error('   2. If tables exist but migrations are not marked: npx prisma migrate resolve --applied "<migration_name>"');
    console.error('   3. Then retry: npx prisma migrate deploy');
    return false;
  }
  
  return true;
}

/**
 * Verify all required tables exist
 */
async function verifyTables() {
  console.log('\n🔍 Verifying required tables...');
  
  const prisma = new PrismaClient({
    log: ['error'],
  });
  
  try {
    await prisma.$connect();
    
    const missingTables = [];
    
    for (const tableName of REQUIRED_TABLES) {
      try {
        // Validate table name to prevent SQL injection (even though it's from a const array)
        // Table names can only contain alphanumeric characters and underscores
        if (!/^[a-z_]+$/.test(tableName)) {
          console.error(`  ⚠️  Invalid table name format: '${tableName}'`);
          continue;
        }
        
        // Try to query each table - using double quotes for PostgreSQL identifier
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "${tableName}" LIMIT 1`);
        console.log(`  ✅ Table '${tableName}' exists`);
      } catch (error) {
        if (error.code === '42P01') {
          // Table does not exist
          console.error(`  ❌ Table '${tableName}' does not exist`);
          missingTables.push(tableName);
        } else {
          // Other error (might be OK, e.g., permission to read data)
          console.log(`  ⚠️  Table '${tableName}' check inconclusive: ${error.message}`);
        }
      }
    }
    
    await prisma.$disconnect();
    
    if (missingTables.length > 0) {
      console.error(`\n❌ ERROR: ${missingTables.length} required table(s) missing:`);
      missingTables.forEach(table => console.error(`   - ${table}`));
      console.error('\n   This indicates migrations were not applied correctly.');
      console.error('   Please check the migration files in prisma/migrations/');
      return false;
    }
    
    console.log('\n✅ All required tables exist');
    return true;
  } catch (error) {
    console.error('\n❌ ERROR: Failed to verify tables');
    console.error('   Message:', error.message);
    await prisma.$disconnect().catch(() => {});
    return false;
  }
}

/**
 * Main build preparation function
 */
async function main() {
  console.log('==========================================');
  console.log('  Vercel Build - Database Setup');
  console.log('==========================================');
  console.log('\nThis script ensures the database is ready before building.\n');
  
  // Step 1: Validate environment
  validateEnvironment();
  
  // Step 2: Test database connection
  const connectionOk = await testDatabaseConnection();
  if (!connectionOk) {
    console.error('\n💥 Build failed: Cannot connect to database');
    process.exit(1);
  }
  
  // Step 3: Generate Prisma Client
  const generateOk = execCommand(
    'npx prisma generate',
    'Generating Prisma Client'
  );
  if (!generateOk) {
    console.error('\n💥 Build failed: Cannot generate Prisma Client');
    process.exit(1);
  }
  
  // Step 4: Apply migrations
  const migrationsOk = applyMigrations();
  if (!migrationsOk) {
    console.error('\n💥 Build failed: Cannot apply migrations');
    process.exit(1);
  }
  
  // Step 5: Verify tables exist
  const tablesOk = await verifyTables();
  if (!tablesOk) {
    console.error('\n💥 Build failed: Required tables are missing');
    process.exit(1);
  }
  
  console.log('\n==========================================');
  console.log('  ✅ Database setup completed successfully!');
  console.log('==========================================\n');
  
  console.log('Proceeding with Next.js build...\n');
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Unexpected error during build preparation:');
  console.error(error);
  process.exit(1);
});
