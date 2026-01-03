# Payment Proofs Table - Production Requirement

## Overview

The `payment_proofs` table is a **critical production requirement** for AlgoEdge deployment. This document ensures the table exists and is properly configured in all environments.

## Table Schema

### Required Fields

The `payment_proofs` table **MUST** have the following fields:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | INT | YES | autoincrement | Primary key |
| `created_at` | TIMESTAMP(3) | YES | CURRENT_TIMESTAMP | Record creation timestamp |
| `user_id` | INT | YES | - | Foreign key to users table |
| `proof_url` | TEXT | YES | - | URL to payment proof document |
| `amount` | DECIMAL(10,2) | NO | - | Payment amount |
| `currency` | VARCHAR(10) | NO | 'USD' | Payment currency |
| `status` | VARCHAR(50) | NO | 'pending' | Review status |
| `notes` | TEXT | NO | - | Additional notes |
| `reviewed_by` | INT | NO | - | Admin user who reviewed |
| `reviewed_at` | TIMESTAMP(3) | NO | - | Review timestamp |
| `submitted_at` | TIMESTAMP(3) | NO | CURRENT_TIMESTAMP | Submission timestamp |

### Database Migration

The table is created by migrations in `prisma/migrations/`:
- `20260102090000_init/` - Initial table creation
- `20260103113015_add_created_at_to_payment_proofs/` - Adds explicit `created_at` field

## Deployment Requirements

### 1. Pre-Deployment Checklist

Before deploying to any environment, verify:

- [ ] `prisma/schema.prisma` contains complete `PaymentProof` model
- [ ] All migration files exist in `prisma/migrations/`
- [ ] `DATABASE_URL` environment variable is set
- [ ] Database is accessible from deployment environment

### 2. Migration Deployment

**ALWAYS** run migrations before starting the application:

```bash
# For production deployments
npx prisma migrate deploy

# For development
npx prisma migrate dev
```

### 3. Verifying Table Exists

After migration, verify the table:

```bash
# Check migration status
npx prisma migrate status

# Verify table exists (PostgreSQL)
psql $DATABASE_URL -c "\d payment_proofs"

# Or use Prisma
npx prisma db execute --stdin <<EOF
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_proofs'
ORDER BY ordinal_position;
EOF
```

## Troubleshooting

### Error: "Missing required tables: payment_proofs"

This error occurs when the database schema is out of sync with the application.

#### Cause 1: Migrations Not Applied

**Solution:**
```bash
# Check what migrations are pending
npx prisma migrate status

# Apply all pending migrations
npx prisma migrate deploy
```

#### Cause 2: Database Has Tables But Migrations Not Recorded

This happens when tables were created manually or migrations were applied outside of Prisma.

**Solution:**
```bash
# Check migration status
npx prisma migrate status

# If tables exist but migrations show as "not applied", mark them as applied:
npx prisma migrate resolve --applied "20260102090000_init"
npx prisma migrate resolve --applied "20260102090350_add_approval_status_and_rejection_reason"
npx prisma migrate resolve --applied "20260103113015_add_created_at_to_payment_proofs"

# Then deploy any remaining migrations
npx prisma migrate deploy
```

#### Cause 3: Missing Migration Files

If migration files are missing from `prisma/migrations/`:

**Solution:**
1. Check Git history to restore migration files
2. Or, if in production with existing data, create a baseline:
```bash
# WARNING: Only use if you have existing production data
npx prisma migrate resolve --applied "20260102090000_init"
# Then create new migrations for any schema differences
```

#### Cause 4: Wrong Database Connection

**Solution:**
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
npx prisma db execute --stdin <<EOF
SELECT 1;
EOF
```

### Error: Migration Failed During Deployment

**Symptoms:**
- Build fails with "Migration deployment failed"
- `npx prisma migrate deploy` exits with error code 1

**Solutions:**

1. **Check database connectivity:**
   ```bash
   # Test if database is reachable
   npx prisma db execute --stdin <<EOF
   SELECT version();
   EOF
   ```

2. **Check for migration conflicts:**
   ```bash
   npx prisma migrate status
   ```

3. **Manual resolution (if tables already exist):**
   ```bash
   # Mark migrations as applied if tables are already present
   npx prisma migrate resolve --applied "20260102090000_init"
   npx prisma migrate deploy
   ```

4. **Reset database (DEVELOPMENT ONLY - destroys all data):**
   ```bash
   npx prisma migrate reset
   ```

### Verifying in Production

After deployment, verify the table exists:

```javascript
// Node.js validation script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyPaymentProofs() {
  try {
    // Check table exists
    await prisma.$queryRaw`SELECT 1 FROM payment_proofs LIMIT 1`;
    console.log('✅ payment_proofs table exists');
    
    // Check required columns
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment_proofs'
      AND column_name IN ('id', 'created_at')
    `;
    
    if (columns.length === 2) {
      console.log('✅ Required columns present');
    } else {
      console.error('❌ Missing required columns');
      process.exit(1);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifyPaymentProofs();
```

## CI/CD Integration

### GitHub Actions

The workflow at `.github/workflows/ci-cd.yml` automatically:
1. ✅ Runs migrations against test database
2. ✅ Verifies `payment_proofs` table exists
3. ✅ Validates required columns are present
4. ✅ Tests database connectivity

### Vercel Deployment

The `scripts/vercel-build.js` script:
1. ✅ Validates `DATABASE_URL` environment variable
2. ✅ Tests database connection
3. ✅ Runs `npx prisma migrate deploy`
4. ✅ Verifies all required tables including `payment_proofs`
5. ✅ Attempts to resolve migration conflicts automatically

### Railway/Render Deployment

Add build command:
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

Start command:
```bash
npm start
```

## Environment Variables

Required environment variables for migration:

```bash
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# For connection pooling (optional)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&connection_limit=5"

# For SSL connections (production)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&sslmode=require"
```

## Maintenance

### Adding New Fields

If you need to add fields to `payment_proofs`:

1. Update `prisma/schema.prisma`
2. Create migration:
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```
3. Commit both schema and migration files
4. Deploy:
   ```bash
   npx prisma migrate deploy
   ```

### Rollback (if needed)

Prisma doesn't support automatic rollback. Manual steps:

1. Identify the migration to rollback
2. Manually write SQL to undo changes
3. Mark migration as rolled back:
   ```bash
   npx prisma migrate resolve --rolled-back "<migration_name>"
   ```

## Support Resources

- **Prisma Migration Guide**: See `PRISMA_MIGRATION_GUIDE.md`
- **Troubleshooting**: See `TROUBLESHOOTING.md`
- **Deployment Guide**: See `PRODUCTION_DEPLOYMENT.md`

## Quick Reference Commands

```bash
# Check status
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy

# Resolve conflicts
npx prisma migrate resolve --applied "<migration_name>"

# Verify table
npx prisma db execute --stdin <<EOF
SELECT * FROM payment_proofs LIMIT 1;
EOF

# Reset (DEV ONLY)
npx prisma migrate reset
```

---

**Last Updated:** January 3, 2026  
**Maintainer:** AlgoEdge Development Team  
**Status:** ✅ Production Ready
