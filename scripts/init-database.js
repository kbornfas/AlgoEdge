#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * This script initializes the database by:
 * 1. Testing database connectivity
 * 2. Running Prisma migrations
 * 3. Verifying all tables are created
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Execute a command and stream output
 */
async function execCommand(command, description) {
  console.log(`\n📦 ${description}...`);
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

/**
 * Main initialization function
 */
async function main() {
  console.log('================================');
  console.log('   Database Initialization');
  console.log('================================');
  
  // Step 1: Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('\n❌ DATABASE_URL environment variable is not set!');
    console.error('   Please set DATABASE_URL in your .env file.');
    console.error('   Example: DATABASE_URL="postgresql://user:password@localhost:5432/algoedge"');
    process.exit(1);
  }
  
  console.log('\n✅ DATABASE_URL is set');
  
  // Step 2: Generate Prisma Client
  const generateSuccess = await execCommand(
    'npx prisma generate',
    'Generating Prisma Client'
  );
  
  if (!generateSuccess) {
    console.error('\n❌ Failed to generate Prisma Client. Please check your schema.prisma file.');
    process.exit(1);
  }
  
  // Step 3: Run migrations (for production) or db push (for development)
  console.log('\n🔍 Checking environment...');
  const isProduction = process.env.NODE_ENV === 'production';
  
  let migrateSuccess;
  if (isProduction) {
    console.log('   Production mode detected - using migrations');
    migrateSuccess = await execCommand(
      'npx prisma migrate deploy',
      'Applying database migrations'
    );
  } else {
    console.log('   Development mode detected - using db push');
    migrateSuccess = await execCommand(
      'npx prisma db push',
      'Syncing database schema'
    );
  }
  
  if (!migrateSuccess) {
    console.error('\n❌ Failed to initialize database schema.');
    console.error('   Please check your DATABASE_URL and ensure PostgreSQL is running.');
    process.exit(1);
  }
  
  // Step 4: Run database health check
  console.log('\n🔍 Verifying database setup...');
  const checkSuccess = await execCommand(
    'node scripts/check-database.js',
    'Running database health check'
  );
  
  if (!checkSuccess) {
    console.error('\n⚠️  Database health check failed, but schema might be initialized.');
    console.error('   You can try running the application anyway.');
  }
  
  // Success summary
  console.log('\n================================');
  console.log('   Initialization Complete!');
  console.log('================================');
  console.log('\n✅ Database is ready to use');
  console.log('\nNext steps:');
  console.log('  1. Seed admin user:      npm run seed:admin');
  console.log('  2. Seed trading robots:  npm run seed:robots');
  console.log('  3. Start the server:     npm run dev');
  console.log('');
  
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});

// Run main function
main().catch((error) => {
  console.error('\n❌ Initialization failed:', error);
  process.exit(1);
});
