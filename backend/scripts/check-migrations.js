#!/usr/bin/env node

/**
 * Migration Verification Script
 * 
 * ⚠️ IMPORTANT: This script MUST be run from the PROJECT ROOT directory
 * 
 * This script verifies that all Prisma database migrations have been applied
 * before the backend server starts. It performs the following checks:
 * 
 * 1. Validates DATABASE_URL is configured
 * 2. Tests database connection
 * 3. Verifies all required tables exist
 * 4. Checks critical columns that were added in recent migrations
 * 
 * Exit codes:
 * - 0: All migrations applied successfully
 * - 1: Migrations pending or database issues detected
 * 
 * This script is designed to be run as a prestart hook to catch
 * migration issues before the server attempts to start.
 * 
 * DEPENDENCY NOTE:
 * This script imports @prisma/client from the root node_modules.
 * The backend/package.json does not include @prisma/client as a
 * dependency - it is only in the root package.json. This is intentional
 * to maintain a single source of truth for Prisma configuration.
 * 
 * MAINTENANCE NOTE:
 * When adding new tables or critical columns from migrations:
 * 1. Update REQUIRED_TABLES array below
 * 2. Update CRITICAL_COLUMNS object below
 * 3. Reference the migration file in comments
 * 4. Test the script: npm run check-migrations (from backend dir)
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Tables that must exist for the application to function
// UPDATE THIS LIST when adding new tables to the schema
// Reference: prisma/schema.prisma
const REQUIRED_TABLES = [
  'users',           // Core user management
  'subscriptions',   // User subscription plans
  'mt5_accounts',    // MT5 trading account connections
  'trading_robots',  // Available trading robots/strategies
  'user_robot_configs', // User robot settings
  'trades',          // Trade history and records
  'user_settings',   // User preferences
  'verification_codes', // Email verification codes
  'audit_logs',      // Security audit trail
  'payment_proofs'   // Payment verification uploads
];

// Critical columns that should exist after recent migrations
// These are columns that were added in migrations and the app depends on
// UPDATE THIS OBJECT when migrations add critical columns
// 
// Format: { 'table_name': ['column1', 'column2'] }
// Include migration reference in comments for tracking
const CRITICAL_COLUMNS = {
  'mt5_accounts': ['status'], // Added in migration 20260104095900_add_status_to_mt5_accounts
  'payment_proofs': ['created_at'] // Added in migration 20260103113015_add_created_at_to_payment_proofs
  // Add new critical columns here as migrations are created
  // Example:
  // 'users': ['new_field'], // Added in migration YYYYMMDDHHMMSS_add_new_field
};

async function checkMigrations() {
  console.log('\n🔍 Pre-flight Migration Check');
  console.log('====================================');
  
  // Step 1: Validate DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('');
    console.error('💡 Action Required:');
    console.error('   1. Set DATABASE_URL in your environment or .env file');
    console.error('   2. Format: postgresql://user:password@host:port/database');
    console.error('   3. For Render: This should be set automatically from the database service');
    console.error('');
    return false;
  }
  
  console.log('✓ DATABASE_URL is configured');
  
  try {
    // Step 2: Test database connection
    console.log('');
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✓ Database connection successful');
    
    // Step 3: Check all required tables exist
    console.log('');
    console.log('📋 Checking required tables...');
    
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `;
    
    const existingTables = result.map(r => r.table_name);
    const missingTables = REQUIRED_TABLES.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.error('❌ Missing required tables:', missingTables.join(', '));
      console.error('');
      console.error('This indicates database migrations have not been applied.');
      console.error('');
      console.error('💡 Action Required:');
      console.error('   Run database migrations with:');
      console.error('   $ npx prisma migrate deploy');
      console.error('');
      console.error('   For Render deployment, this should happen automatically');
      console.error('   in the buildCommand. Check Render build logs for errors.');
      console.error('');
      return false;
    }
    
    console.log(`✓ All ${REQUIRED_TABLES.length} required tables exist`);
    
    // Step 4: Check critical columns from recent migrations
    console.log('');
    console.log('🔍 Checking critical columns from recent migrations...');
    
    let allColumnsExist = true;
    
    for (const [tableName, columns] of Object.entries(CRITICAL_COLUMNS)) {
      for (const columnName of columns) {
        const columnCheck = await prisma.$queryRaw`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
          AND column_name = ${columnName};
        `;
        
        if (columnCheck.length > 0) {
          console.log(`✓ ${tableName}.${columnName} exists`);
        } else {
          console.error(`❌ ${tableName}.${columnName} is missing`);
          console.error(`   This column was added in a recent migration`);
          allColumnsExist = false;
        }
      }
    }
    
    if (!allColumnsExist) {
      console.error('');
      console.error('❌ Some critical columns are missing');
      console.error('');
      console.error('💡 Action Required:');
      console.error('   Recent migrations have not been applied. Run:');
      console.error('   $ npx prisma migrate deploy');
      console.error('');
      return false;
    }
    
    // All checks passed
    console.log('');
    console.log('✅ All migration checks passed');
    console.log('====================================');
    console.log('');
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.error('');
    console.error('❌ Migration check failed with error:');
    console.error('');
    console.error(error.message);
    console.error('');
    
    if (error.code === 'P1001') {
      console.error('💡 Database connection error.');
      console.error('   Check that:');
      console.error('   1. Database server is running');
      console.error('   2. DATABASE_URL is correct');
      console.error('   3. Network connectivity to database is available');
      console.error('   4. Database credentials are valid');
    } else if (error.code === 'P2021') {
      console.error('💡 Database table does not exist.');
      console.error('   Run migrations: npx prisma migrate deploy');
    } else {
      console.error('💡 For more details, run:');
      console.error('   $ npx prisma migrate status');
    }
    
    console.error('');
    
    await prisma.$disconnect();
    return false;
  }
}

// Run the check
checkMigrations()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
