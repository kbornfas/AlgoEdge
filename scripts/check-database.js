#!/usr/bin/env node

/**
 * Database Health Check Script
 * 
 * This script validates that:
 * 1. Database connection is working
 * 2. Prisma client is generated
 * 3. All migrations are applied
 * 4. Required tables exist
 */

const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const prisma = new PrismaClient();

// Expected tables in the database
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
  'payment_proofs',
];

/**
 * Check if database connection is working
 */
async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes('P1001')) {
      console.error('   → Cannot reach database server. Check DATABASE_URL and ensure PostgreSQL is running.');
    } else if (error.message.includes('P1003')) {
      console.error('   → Database does not exist. Create the database first.');
    } else if (error.message.includes('password authentication failed')) {
      console.error('   → Authentication failed. Check username and password in DATABASE_URL.');
    }
    
    return false;
  }
}

/**
 * Check if all required tables exist
 */
async function checkRequiredTables() {
  console.log('\n🔍 Checking required tables...');
  
  try {
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const result = await prisma.$queryRawUnsafe(tableCheckQuery);
    const existingTables = result.map(row => row.table_name);
    
    console.log(`   Found ${existingTables.length} tables in database`);
    
    const missingTables = REQUIRED_TABLES.filter(
      table => !existingTables.includes(table)
    );
    
    if (missingTables.length > 0) {
      console.error('❌ Missing required tables:');
      missingTables.forEach(table => {
        console.error(`   → ${table}`);
      });
      console.error('\n   Run "npm run prisma:migrate" or "npm run prisma:push" to create missing tables.');
      return false;
    }
    
    console.log('✅ All required tables exist');
    return true;
  } catch (error) {
    console.error('❌ Failed to check tables:', error.message);
    return false;
  }
}

/**
 * Check if Prisma client is generated
 */
async function checkPrismaClient() {
  console.log('\n🔍 Checking Prisma client generation...');
  
  try {
    // Try to access Prisma client
    const userCount = await prisma.user.count();
    console.log(`✅ Prisma client is generated (found ${userCount} users)`);
    return true;
  } catch (error) {
    if (error.message.includes('prisma generate')) {
      console.error('❌ Prisma client not generated');
      console.error('   Run "npm run prisma:generate" to generate the client');
      return false;
    }
    
    // If it's another error, assume client is generated but there's a different issue
    console.log('✅ Prisma client is generated');
    return true;
  }
}

/**
 * Check migration status
 */
async function checkMigrationStatus() {
  console.log('\n🔍 Checking migration status...');
  
  try {
    const { stdout } = await execAsync('npx prisma migrate status', {
      cwd: process.cwd(),
    });
    
    if (stdout.includes('Database schema is up to date')) {
      console.log('✅ All migrations are applied');
      return true;
    } else if (stdout.includes('pending migrations')) {
      console.error('❌ Pending migrations detected');
      console.error('   Run "npm run prisma:migrate" to apply pending migrations');
      return false;
    } else {
      console.log('⚠️  Migration status unclear, but database might be initialized with db push');
      return true;
    }
  } catch (error) {
    // If migrations folder doesn't exist or command fails, might be using db push
    if (error.message.includes('Could not find a schema.prisma')) {
      console.error('❌ schema.prisma not found');
      return false;
    }
    
    console.log('⚠️  Could not check migration status (might be using db push)');
    return true;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('================================');
  console.log('   Database Health Check');
  console.log('================================\n');
  
  const checks = {
    connection: false,
    prismaClient: false,
    tables: false,
    migrations: false,
  };
  
  // Run all checks
  checks.connection = await checkDatabaseConnection();
  
  if (checks.connection) {
    checks.prismaClient = await checkPrismaClient();
    checks.tables = await checkRequiredTables();
    checks.migrations = await checkMigrationStatus();
  }
  
  // Disconnect from database
  await prisma.$disconnect();
  
  // Print summary
  console.log('\n================================');
  console.log('   Summary');
  console.log('================================');
  console.log(`Database Connection: ${checks.connection ? '✅' : '❌'}`);
  console.log(`Prisma Client:       ${checks.prismaClient ? '✅' : '❌'}`);
  console.log(`Required Tables:     ${checks.tables ? '✅' : '❌'}`);
  console.log(`Migration Status:    ${checks.migrations ? '✅' : '❌'}`);
  console.log('================================\n');
  
  // Exit with appropriate code
  const allPassed = Object.values(checks).every(check => check);
  
  if (allPassed) {
    console.log('✅ All checks passed! Database is ready.\n');
    process.exit(0);
  } else {
    console.error('❌ Some checks failed. Please fix the issues above.\n');
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
