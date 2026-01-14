#!/usr/bin/env node

/**
 * ⚠️ CRITICAL: Vercel Frontend-Only Build Script
 *
 * ARCHITECTURE SEPARATION:
 * - Backend (Render): Runs ALL database migrations via render.yaml
 * - Frontend (Vercel): This script - NO migrations, only Prisma client generation
 *
 * This script prepares the Next.js frontend for deployment on Vercel.
 *
 * IMPORTANT: This script does NOT run database migrations.
 *
 * Architecture:
 * - Vercel (Frontend): Builds Next.js app, generates Prisma client (read-only)
 * - Render (Backend): Runs database migrations and manages schema
 *
 * This script:
 * 1. Validates DATABASE_URL is set (optional for read-only access)
 * 2. Generates Prisma Client (for type definitions and queries)
 * 3. Does NOT apply migrations (migrations run on backend/Render only)
 * 4. Does NOT modify database schema
 *
 * See: BACKEND_RENDER_FRONTEND_VERCEL.md for complete separation details
 */

const { execSync } = require('child_process');

console.log('\n⚠️  NOTE: This is a FRONTEND-ONLY build script.');
console.log('   Database migrations are handled by the backend (Render).');
console.log('   This script only generates the Prisma client for type safety.\n');

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

// Environment validation removed - DATABASE_URL is optional for frontend builds

/**
 * Check database connectivity (optional, non-blocking)
 * Always returns true to avoid blocking frontend builds
 */
async function checkDatabaseConnection() {
  console.log('\n🔍 Testing database connection (optional for frontend)...');

  try {
    // Using require() because this is a CommonJS script (not ES modules)
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
    });

    await prisma.$connect();
    console.log('✅ Database connection successful (read-only access)');
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log('⚠️  Database connection test skipped or failed');
    console.log('   This is OK for frontend builds - the backend handles DB operations');
    console.log('   Error:', error.message);
    return true; // Don't fail build if DB is unreachable
  }
}

// Migration functions removed - migrations are handled by backend (Render) only

/**
 * Main build preparation function - Frontend only
 */
async function main() {
  console.log('==========================================');
  console.log('  Vercel Build - Frontend Preparation');
  console.log('==========================================');
  console.log('\n🎯 Architecture: Frontend-only deployment');
  console.log('   - Frontend (Vercel): Builds Next.js app');
  console.log('   - Backend (Render): Handles DB migrations\n');

  // Step 1: Validate environment (optional for frontend)
  console.log('🔍 Step 1: Validating environment...');
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not set - this is OK for frontend builds');
    console.log('   The frontend will use API routes to communicate with backend');
  } else {
    console.log('✅ DATABASE_URL is set (for read-only queries)');
  }

  // Step 2: Test database connection (optional, non-blocking)
  console.log('\n🔍 Step 2: Testing database connection (optional)...');
  await checkDatabaseConnection();

  // Step 3: Generate Prisma Client
  console.log('\n🔍 Step 3: Generating Prisma Client...');
  const generateOk = execCommand(
    'npx prisma generate',
    'Generating Prisma Client for type definitions'
  );
  if (!generateOk) {
    console.error('\n💥 Build failed: Cannot generate Prisma Client');
    console.error('   This is required for TypeScript types and type safety');
    process.exit(1);
  }

  console.log('\n==========================================');
  console.log('  ✅ Frontend preparation completed!');
  console.log('==========================================\n');
  console.log('📝 Important Notes:');
  console.log('   - Database migrations are handled by the backend (Render)');
  console.log('   - This build only prepares the Next.js frontend');
  console.log('   - The Prisma client provides type-safe database access\n');
  console.log('Proceeding with Next.js build...\n');
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Unexpected error during build preparation:');
  console.error(error);
  process.exit(1);
});
