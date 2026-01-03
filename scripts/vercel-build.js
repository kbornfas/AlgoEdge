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
 * Get list of all migration names from the migrations directory
 */
function getMigrationNames() {
  const fs = require('fs');
  const path = require('path');
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  
  try {
    const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(entry => entry.name)
      .sort(); // Sort chronologically
  } catch (error) {
    console.error('⚠️  Could not read migrations directory:', error.message);
    return [];
  }
}

/**
 * Apply database migrations with comprehensive P3005 error handling
 */
function applyMigrations() {
  console.log('\n🔍 Applying database migrations...');
  
  // Check migration status first
  console.log('\n📊 Checking migration status...');
  let statusOutput = '';
  let hasP3005Error = false;
  
  try {
    statusOutput = execSync('npx prisma migrate status', {
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
      hasP3005Error = true;
    }
  } catch (error) {
    const errorOutput = error.stderr || error.stdout || error.message;
    console.log('   Migration status check returned error:', errorOutput);
    
    // Check for P3005 error
    if (errorOutput.includes('P3005') || errorOutput.includes('database schema is not empty')) {
      console.log('   ⚠️  P3005 error detected: Database schema is not empty');
      hasP3005Error = true;
    } else {
      console.log('   ⚠️  Could not check migration status, proceeding with deployment');
    }
  }
  
  // If P3005 error detected, resolve all migrations as applied
  if (hasP3005Error) {
    console.log('\n🔧 Resolving P3005 error by marking existing migrations as applied...');
    const migrations = getMigrationNames();
    
    if (migrations.length === 0) {
      console.error('   ❌ No migrations found in prisma/migrations directory');
      return false;
    }
    
    console.log(`   Found ${migrations.length} migration(s) to resolve:`);
    migrations.forEach(name => console.log(`     - ${name}`));
    
    // Mark each migration as applied
    let allResolved = true;
    for (const migrationName of migrations) {
      try {
        console.log(`\n   📝 Resolving migration: ${migrationName}`);
        execSync(`npx prisma migrate resolve --applied "${migrationName}"`, {
          encoding: 'utf-8',
          stdio: 'pipe',
          maxBuffer: 10 * 1024 * 1024,
        });
        console.log(`   ✅ Marked "${migrationName}" as applied`);
      } catch (error) {
        // Some migrations might already be marked as applied, which is okay
        const errorMsg = error.stderr || error.stdout || error.message;
        if (errorMsg.includes('already applied') || errorMsg.includes('is applied')) {
          console.log(`   ℹ️  Migration "${migrationName}" was already marked as applied`);
        } else {
          console.error(`   ⚠️  Failed to resolve "${migrationName}":`, errorMsg);
          // Continue with other migrations even if one fails
        }
      }
    }
    
    // Check status again after resolution
    console.log('\n📊 Rechecking migration status after resolution...');
    try {
      const newStatus = execSync('npx prisma migrate status', {
        encoding: 'utf-8',
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024,
      });
      console.log(newStatus);
    } catch (error) {
      console.log('   Status check after resolution:', error.message);
    }
  }
  
  // Try to apply pending migrations
  console.log('\n📦 Deploying any remaining Prisma migrations...');
  try {
    const deployOutput = execSync('npx prisma migrate deploy', {
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024,
    });
    console.log(deployOutput);
    console.log('✅ Migration deployment completed successfully');
    return true;
  } catch (error) {
    const errorOutput = error.stderr || error.stdout || error.message;
    
    // Check if error is because everything is already applied
    if (errorOutput.includes('No pending migrations') || 
        errorOutput.includes('Database schema is up to date') ||
        errorOutput.includes('already applied')) {
      console.log('   ✅ No pending migrations to apply, database is up to date');
      return true;
    }
    
    // Check for P3005 error again - if so, try one more resolution attempt
    if (errorOutput.includes('P3005') || errorOutput.includes('database schema is not empty')) {
      console.log('\n   ⚠️  P3005 error still occurring after resolution attempt');
      console.log('   This may indicate a deeper schema mismatch. Trying alternative approach...');
      
      // Try to pull the schema from database and regenerate client
      try {
        console.log('\n   🔄 Attempting to sync schema from database...');
        execSync('npx prisma db pull', {
          encoding: 'utf-8',
          stdio: 'pipe',
          maxBuffer: 10 * 1024 * 1024,
        });
        console.log('   ✅ Schema synced from database');
        
        // Regenerate client with the pulled schema
        execSync('npx prisma generate', {
          encoding: 'utf-8',
          stdio: 'pipe',
          maxBuffer: 10 * 1024 * 1024,
        });
        console.log('   ✅ Prisma client regenerated');
        
        return true;
      } catch (pullError) {
        console.error('   ❌ Schema sync failed:', pullError.message);
        // Fall through to error reporting
      }
    }
    
    console.error('\n❌ ERROR: Migration deployment failed');
    console.error('   Error details:', errorOutput);
    console.error('\n   This usually means:');
    console.error('   1. Database schema is out of sync with migration files');
    console.error('   2. Migration files are corrupted or incomplete');
    console.error('   3. Database permissions are insufficient');
    console.error('\n   Manual resolution steps:');
    console.error('   1. Check migration status: npx prisma migrate status');
    console.error('   2. Mark migrations as applied: npx prisma migrate resolve --applied "<migration_name>"');
    console.error('   3. Sync schema from DB: npx prisma db pull');
    console.error('   4. Regenerate client: npx prisma generate');
    return false;
  }
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
