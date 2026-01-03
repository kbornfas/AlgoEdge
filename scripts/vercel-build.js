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
      maxBuffer: 10 * 1024 * 1024,
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
  
  // First, try to apply migrations normally
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
        // Try to query each table
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
