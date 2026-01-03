# P3005 Error Resolution Guide - Production Deployments

## Overview

This guide explains how to resolve Prisma P3005 errors during production deployments to Vercel or other hosting platforms.

## What is P3005?

**Error:** `P3005: The database schema is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline`

This error occurs when:
1. Your production database already has tables/schema
2. Prisma's `_prisma_migrations` tracking table is missing or out of sync
3. Prisma migrate deploy cannot determine if migrations have been applied

## Common Scenarios

### Scenario 1: Fresh Vercel Deployment with Existing Database

**Situation:** You're deploying to Vercel for the first time, but your database already has schema (created manually or via `prisma db push`).

**Solution:** The enhanced `vercel-build.js` script automatically handles this! Just deploy normally:

```bash
git push origin main
```

**What happens:**
1. Vercel runs: `node scripts/vercel-build.js && npm run build`
2. The script detects P3005 error
3. Automatically marks all migrations as applied
4. Retries migration deployment
5. Verifies all tables exist
6. Continues with build

### Scenario 2: Manual Deployment Requiring P3005 Resolution

**Situation:** You're deploying manually or the automatic resolution failed.

**Solution:** Use the interactive resolution script:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:port/database"

# Run the P3005 resolution tool (interactive)
npm run migrate:resolve-p3005

# Or automatic mode for CI/CD
npm run migrate:resolve-p3005 -- --auto
```

### Scenario 3: Local Development to Production Migration

**Situation:** You've been using `prisma db push` in development and now want to use proper migrations in production.

**Solution:** 

**Step 1:** Create initial migration from current schema
```bash
# In development
npx prisma migrate dev --name init
git add prisma/migrations/
git commit -m "Add initial migration"
```

**Step 2:** Deploy to production - the vercel-build.js handles P3005 automatically

**Step 3:** Verify deployment
```bash
# Check Vercel build logs for:
# "✅ Migration deployment completed successfully"
```

### Scenario 4: Production Database Already Has Partial Migrations

**Situation:** Some migrations are applied, but not all are tracked properly.

**Solution:** Use the resolution script to mark all as applied:

```bash
export DATABASE_URL="your-production-url"
npm run migrate:resolve-p3005 -- --auto
```

This will:
- Check current status
- Mark all migrations as applied
- Allow future migrations to be applied normally

## Automated Resolution (Vercel/CI)

The `scripts/vercel-build.js` provides automatic P3005 resolution:

### How It Works

1. **Detection:** Checks migration status, catches P3005 error
2. **Discovery:** Scans `prisma/migrations/` directory for all migrations
3. **Resolution:** Marks each migration as applied using `prisma migrate resolve --applied`
4. **Retry:** Attempts migration deployment again
5. **Fallback:** If still failing, syncs schema from database
6. **Verification:** Confirms all required tables exist

### Monitoring Automatic Resolution

Check Vercel build logs for these messages:

```
🔧 Resolving P3005 error by marking existing migrations as applied...
   Found 3 migration(s) to resolve:
     - 20260102090000_init
     - 20260102090350_add_approval_status_and_rejection_reason
     - 20260103113015_add_created_at_to_payment_proofs

   📝 Resolving migration: 20260102090000_init
   ✅ Marked "20260102090000_init" as applied
   ...

📦 Deploying any remaining Prisma migrations...
✅ Migration deployment completed successfully
```

## Manual Resolution Steps

If automatic resolution fails or you need to resolve manually:

### Step 1: Connect to Production Database

```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
```

### Step 2: Check Current Status

```bash
npx prisma migrate status
```

**Expected output with P3005:**
```
Error: P3005

The database schema for `default` is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline
```

### Step 3: Run Resolution Script

```bash
# Interactive mode (asks for confirmation)
npm run migrate:resolve-p3005

# Automatic mode (no prompts)
npm run migrate:resolve-p3005 -- --auto

# Dry run (preview changes)
npm run migrate:resolve-p3005 -- --dry-run
```

### Step 4: Verify Resolution

```bash
npx prisma migrate status
```

**Expected output after resolution:**
```
Database schema is up to date!
```

### Step 5: Deploy Application

```bash
# For Vercel
git push origin main

# Or manually
npm run vercel:build
```

## Advanced Scenarios

### Case 1: Migration Files Don't Match Database Schema

**Problem:** Your schema.prisma doesn't match what's in the database.

**Solution:**

```bash
# Option A: Pull schema from database (recommended if DB is source of truth)
npx prisma db pull
npx prisma generate

# Option B: Force schema to database (if schema.prisma is source of truth)
npm run migrate:resolve-p3005 -- --auto
npx prisma migrate deploy
```

### Case 2: Corrupted Migration History

**Problem:** `_prisma_migrations` table exists but has incorrect entries.

**Solution:**

```bash
# 1. Reset the migrations table (CAUTION: Requires manual SQL)
psql $DATABASE_URL -c "TRUNCATE TABLE _prisma_migrations;"

# 2. Mark all migrations as applied
npm run migrate:resolve-p3005 -- --auto

# 3. Verify
npx prisma migrate status
```

### Case 3: Multiple Environments with Different States

**Problem:** Dev, staging, and production have different migration states.

**Solution for Each Environment:**

1. **Development:** Use `prisma migrate dev`
   ```bash
   npx prisma migrate dev
   ```

2. **Staging:** Use resolution then deploy
   ```bash
   export DATABASE_URL="staging-url"
   npm run migrate:resolve-p3005 -- --auto
   npx prisma migrate deploy
   ```

3. **Production:** Vercel handles automatically or use resolution script
   ```bash
   export DATABASE_URL="production-url"
   npm run migrate:resolve-p3005 -- --auto
   ```

## Troubleshooting

### Issue: Resolution Script Fails

**Error:** "Failed to resolve migration: already applied"

**Solution:** This is actually okay! It means that migration was already marked as applied. The script will continue with other migrations.

### Issue: Tables Still Missing After Resolution

**Error:** "Table 'payment_proofs' does not exist"

**Solution:**

```bash
# 1. Check if tables really exist
psql $DATABASE_URL -c "\dt"

# 2. If tables missing, apply migrations
npx prisma migrate deploy

# 3. If tables exist but not visible, check schema
npx prisma db pull
```

### Issue: Permissions Error

**Error:** "Insufficient privileges"

**Solution:** Ensure your database user has:
- CREATE privileges
- ALTER privileges  
- SELECT/INSERT/UPDATE/DELETE on all tables
- CREATE privileges on `_prisma_migrations` table

```sql
-- Grant required permissions
GRANT CREATE, ALTER ON DATABASE your_database TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

### Issue: Vercel Build Still Failing

**Symptoms:** P3005 error persists even after resolution

**Solution:**

1. **Check Vercel environment variables:**
   - Go to Vercel Project Settings > Environment Variables
   - Verify `DATABASE_URL` is set correctly
   - Ensure format: `postgresql://user:password@host:port/database`

2. **Check database connectivity:**
   - Ensure database allows connections from Vercel IPs
   - Verify firewall rules

3. **Check migration files:**
   ```bash
   ls -la prisma/migrations/
   # Ensure all migration directories exist and contain migration.sql
   ```

4. **Manual override:**
   ```bash
   # Connect to production DB
   export DATABASE_URL="production-url"
   
   # Manually resolve all
   npm run migrate:resolve-p3005 -- --auto
   
   # Redeploy
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```

## Prevention Strategies

### For New Projects

1. **Start with migrations from day one:**
   ```bash
   npx prisma migrate dev --name init
   git add prisma/migrations/
   git commit -m "Initial migration"
   ```

2. **Never use `db push` in production:**
   - Development: `prisma db push` is OK
   - Production: Always use `prisma migrate deploy`

### For Existing Projects

1. **Document migration strategy in README**

2. **Add pre-deployment checks:**
   ```bash
   # In CI/CD pipeline
   - name: Verify migration files
     run: |
       if [ ! -d "prisma/migrations" ]; then
         echo "❌ No migrations found!"
         exit 1
       fi
   ```

3. **Use staging environment:**
   - Test all migrations in staging first
   - Only promote to production after verification

4. **Backup before migrations:**
   ```bash
   # Before deployment
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

## Quick Reference

### Commands

```bash
# Check migration status
npx prisma migrate status

# Resolve P3005 (interactive)
npm run migrate:resolve-p3005

# Resolve P3005 (automatic)
npm run migrate:resolve-p3005 -- --auto

# Resolve P3005 (dry run)
npm run migrate:resolve-p3005 -- --dry-run

# Deploy migrations
npx prisma migrate deploy

# Pull schema from DB
npx prisma db pull

# Generate Prisma client
npx prisma generate

# Test Vercel build locally
npm run vercel:build
```

### Environment Variables

```bash
# Required for all operations
DATABASE_URL="postgresql://user:password@host:port/database"

# Optional: Enable Prisma debug logging
DEBUG="prisma:*"
```

## Support

For more information, see:
- [PRISMA_MIGRATION_GUIDE.md](./PRISMA_MIGRATION_GUIDE.md) - Comprehensive migration guide
- [VERCEL_DEPLOYMENT_FIX.md](./VERCEL_DEPLOYMENT_FIX.md) - Vercel-specific deployment fixes
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - General troubleshooting guide

---

*Last Updated: January 3, 2026*
*Version: 2.0 (Enhanced with automatic resolution)*
