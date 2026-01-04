#!/usr/bin/env node

/**
 * Render Deployment Validation Script
 * 
 * This script validates that the database is properly set up after deployment.
 * It checks:
 * 1. Database connection is working
 * 2. All required tables exist
 * 3. Prisma Client is properly generated
 * 
 * This is run as part of the Render build process to ensure
 * the deployment is successful before the service starts.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REQUIRED_TABLES = [
  'users', 'subscriptions', 'mt5_accounts', 'trading_robots',
  'user_robot_configs', 'trades', 'user_settings', 
  'verification_codes', 'audit_logs', 'payment_proofs'
];

async function validateDatabase() {
  console.log('🔍 Validating database schema...');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check tables
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `;
    
    const existingTables = result.map(r => r.table_name);
    const missing = REQUIRED_TABLES.filter(t => !existingTables.includes(t));
    
    if (missing.length > 0) {
      console.error('❌ Missing tables:', missing);
      console.error('');
      console.error('Database tables were not created properly during migration.');
      console.error('This indicates the "npx prisma migrate deploy" command may have failed silently.');
      console.error('');
      console.error('Troubleshooting steps:');
      console.error('1. Check that DATABASE_URL is correctly set in Render');
      console.error('2. Verify the database exists and is accessible');
      console.error('3. Check Render build logs for migration errors');
      console.error('4. Manually run migrations: npx prisma migrate deploy');
      await prisma.$disconnect();
      process.exit(1);
    }
    
    console.log('✅ All required tables exist');
    console.log(`   Found ${existingTables.length} tables: ${existingTables.join(', ')}`);
    console.log('✅ Database validation passed');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database validation failed:', error.message);
    console.error('');
    console.error('Error details:', error);
    console.error('');
    console.error('Troubleshooting steps:');
    console.error('1. Check that DATABASE_URL is correctly set');
    console.error('2. Verify the database is running and accessible');
    console.error('3. Check that Prisma Client was generated: npx prisma generate');
    console.error('4. Check database connection string format');
    await prisma.$disconnect();
    process.exit(1);
  }
}

validateDatabase();
