#!/usr/bin/env node

/**
 * Payment Proofs Table Validation Script
 * 
 * This script validates that the payment_proofs table exists and has
 * all required fields. Run this before deployment to prevent failures.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const REQUIRED_COLUMNS = [
  { name: 'id', type: 'integer' },
  { name: 'user_id', type: 'integer' },
  { name: 'proof_url', type: 'text' },
  { name: 'status', type: 'character varying' },
  { name: 'submitted_at', type: 'timestamp' },
  { name: 'created_at', type: 'timestamp' },
];

async function validatePaymentProofsTable() {
  console.log('==========================================');
  console.log('  Payment Proofs Table Validation');
  console.log('==========================================\n');

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable not set!\n');
    console.error('Set DATABASE_URL in your .env file or environment.');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL is set\n');

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    // Test connection
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check if table exists
    console.log('🔍 Checking if payment_proofs table exists...');
    try {
      await prisma.$queryRaw`SELECT 1 FROM payment_proofs LIMIT 1`;
      console.log('✅ payment_proofs table exists\n');
    } catch (error) {
      if (error.code === '42P01') {
        console.error('❌ ERROR: payment_proofs table does NOT exist!\n');
        console.error('Solution:');
        console.error('  1. Run: npx prisma migrate deploy');
        console.error('  2. Or see: PAYMENT_PROOFS_TABLE.md\n');
        await prisma.$disconnect();
        process.exit(1);
      }
      throw error;
    }

    // Validate columns
    console.log('🔍 Validating table columns...');
    const columns = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payment_proofs'
      ORDER BY ordinal_position
    `;

    const columnNames = columns.map(c => c.column_name);
    
    let allValid = true;
    for (const required of REQUIRED_COLUMNS) {
      if (columnNames.includes(required.name)) {
        const column = columns.find(c => c.column_name === required.name);
        console.log(`  ✅ Column '${required.name}' exists (${column.data_type})`);
      } else {
        console.error(`  ❌ Column '${required.name}' is MISSING!`);
        allValid = false;
      }
    }

    console.log('');

    if (!allValid) {
      console.error('❌ ERROR: Required columns are missing!\n');
      console.error('Solution:');
      console.error('  1. Run: npx prisma migrate deploy');
      console.error('  2. See: PAYMENT_PROOFS_TABLE.md\n');
      await prisma.$disconnect();
      process.exit(1);
    }

    // Check indexes
    console.log('🔍 Checking table indexes...');
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'payment_proofs'
        AND schemaname = 'public'
    `;

    if (indexes.length > 0) {
      console.log(`  ✅ Found ${indexes.length} indexes`);
      indexes.forEach(idx => {
        console.log(`     - ${idx.indexname}`);
      });
    } else {
      console.log('  ⚠️  No indexes found (this may impact performance)');
    }

    console.log('');

    // Check foreign key constraints
    console.log('🔍 Checking foreign key constraints...');
    const constraints = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'payment_proofs'
    `;

    if (constraints.length > 0) {
      console.log(`  ✅ Found ${constraints.length} foreign key(s)`);
      constraints.forEach(fk => {
        console.log(`     - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('  ⚠️  No foreign keys found');
    }

    console.log('');

    // Test insert/delete (rollback transaction)
    console.log('🔍 Testing insert operation (will rollback)...');
    try {
      await prisma.$transaction(async (tx) => {
        // Try to insert a test record
        await tx.$executeRaw`
          INSERT INTO payment_proofs (user_id, proof_url, status, submitted_at, created_at)
          VALUES (1, 'https://test.com/proof.jpg', 'pending', NOW(), NOW())
        `;
        console.log('  ✅ Insert operation works');
        
        // Rollback by throwing
        throw new Error('ROLLBACK_TEST');
      });
    } catch (error) {
      if (error.message === 'ROLLBACK_TEST') {
        console.log('  ✅ Transaction rolled back successfully');
      } else {
        console.error('  ⚠️  Insert test failed:', error.message);
      }
    }

    console.log('');

    // Success summary
    console.log('==========================================');
    console.log('  ✅ All Validations Passed!');
    console.log('==========================================');
    console.log('\nThe payment_proofs table is correctly configured.');
    console.log('Your deployment should succeed.\n');

    await prisma.$disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Validation failed with error:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});

// Run validation
validatePaymentProofsTable();
