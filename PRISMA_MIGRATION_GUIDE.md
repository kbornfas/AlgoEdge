# Prisma Migration Guide

This guide explains how to manage database migrations in the AlgoEdge project using Prisma.

## Table of Contents

1. [Understanding Prisma Migrations](#understanding-prisma-migrations)
2. [Development Workflow](#development-workflow)
3. [Production Deployment](#production-deployment)
4. [Troubleshooting](#troubleshooting)
5. [Common Scenarios](#common-scenarios)

---

## Understanding Prisma Migrations

Prisma provides two main approaches for managing database schema:

### 1. Prisma Migrate (Recommended for Production)

- **Command:** `npx prisma migrate dev` (development), `npx prisma migrate deploy` (production)
- **Use case:** Production environments, team collaboration
- **Benefits:** 
  - Full migration history
  - Reproducible deployments
  - Team synchronization
  - Rollback capability
- **Tracks:** All schema changes in `prisma/migrations/` directory

### 2. Prisma DB Push (Development Only)

- **Command:** `npx prisma db push`
- **Use case:** Rapid prototyping, local development
- **Benefits:**
  - Fast iteration
  - No migration files
  - Schema sync without history
- **Limitation:** No migration history, not suitable for production

---

## Development Workflow

### Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up DATABASE_URL in .env
echo "DATABASE_URL=postgresql://user:password@localhost:5432/algoedge" > .env

# 3. Generate Prisma Client
npm run prisma:generate

# 4. Push schema to database (creates tables)
npm run prisma:push

# 5. Seed initial data
npm run seed:all
```

### Making Schema Changes

**Option A: Using DB Push (Fast Development)**

```bash
# 1. Modify prisma/schema.prisma

# 2. Push changes to database
npm run prisma:push

# 3. No migration files created
```

**Option B: Creating Migrations (Production-Ready)**

```bash
# 1. Modify prisma/schema.prisma

# 2. Create migration
npm run prisma:migrate
# or
npx prisma migrate dev --name descriptive_name

# 3. Migration files created in prisma/migrations/

# 4. Commit migration files to git
git add prisma/migrations/
git commit -m "Add migration: descriptive_name"
```

---

## Production Deployment

### New Production Database

```bash
# 1. Set production DATABASE_URL
export DATABASE_URL="postgresql://user:password@production-host:5432/algoedge"

# 2. Generate Prisma Client
npm run prisma:generate

# 3. Deploy all migrations
npm run prisma:migrate:deploy
# or
npx prisma migrate deploy

# 4. Seed initial data
npm run seed:all
```

### Existing Production Database

If your production database already has schema but no migration history:

**Step 1: Check Current State**

```bash
# Check migration status
npm run prisma:migrate:status

# If you see P3005 error, continue to Step 2
```

**Step 2: Choose Resolution Strategy**

**Strategy A: Pull Schema from Database**

```bash
# Sync Prisma schema with database
npm run prisma:db:pull
# or
npx prisma db pull

# Review changes
git diff prisma/schema.prisma

# Generate client
npm run prisma:generate

# Continue using db push or set up migrations
```

**Strategy B: Mark Migrations as Applied**

```bash
# Use interactive script
npm run migrate:resolve

# Or manually:
# Check existing migrations
ls prisma/migrations/

# Mark specific migration as applied
npx prisma migrate resolve --applied "20260102090350_add_approval_status_and_rejection_reason"

# Verify status
npm run prisma:migrate:status
```

**Strategy C: Baseline the Database**

```bash
# Create baseline migration (doesn't apply it)
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql

# Mark baseline as applied
npx prisma migrate resolve --applied 0_init

# Deploy any remaining migrations
npx prisma migrate deploy
```

---

## Troubleshooting

### Error: P3005 - Database schema is not empty

**Problem:** Attempting to run migrations on a database that already has schema.

**Solutions:**

1. **Use the automated P3005 resolution script (Recommended):**
   ```bash
   # Interactive mode
   npm run migrate:resolve-p3005
   
   # Automatic mode (no prompts)
   npm run migrate:resolve-p3005 -- --auto
   
   # Dry run (see what would be done)
   npm run migrate:resolve-p3005 -- --dry-run
   ```

2. **Pull schema from database:**
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

3. **Mark migrations as applied manually:**
   ```bash
   npm run migrate:resolve
   ```

4. **Create baseline migration:**
   ```bash
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
   npx prisma migrate resolve --applied 0_init
   ```

**Note:** The vercel-build.js script now automatically handles P3005 errors during deployment by detecting and resolving all migrations.

### Error: Migrations are out of sync

**Problem:** Local migration history doesn't match database.

**Solution:**

```bash
# Check status
npx prisma migrate status

# Reset migrations (WARNING: Loses data)
npx prisma migrate reset

# Or resolve individually
npm run migrate:resolve
```

### Error: Prisma Client not generated

**Solution:**

```bash
npm run prisma:generate
```

### Error: Cannot connect to database

**Solution:**

```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                # macOS
```

---

## Common Scenarios

### Scenario 1: Switching from DB Push to Migrations

If you've been using `prisma db push` and want to start using migrations:

```bash
# 1. Create initial migration from current schema
npx prisma migrate dev --name init

# 2. This creates migration files in prisma/migrations/

# 3. Commit to git
git add prisma/migrations/
git commit -m "Add initial migration"

# 4. Continue using migrate for future changes
npx prisma migrate dev --name your_change
```

### Scenario 2: Deploying to Multiple Environments

**Development:**
```bash
npm run prisma:push  # Fast iteration
```

**Staging:**
```bash
npm run prisma:migrate:deploy  # Test migrations
```

**Production:**
```bash
npm run prisma:migrate:deploy  # Deploy tested migrations
```

### Scenario 3: Hotfix in Production

If you need to make urgent schema changes:

```bash
# 1. Create migration locally
npx prisma migrate dev --name hotfix_description

# 2. Test locally

# 3. Commit and push
git add prisma/migrations/
git commit -m "Hotfix: description"
git push

# 4. Deploy to production
npx prisma migrate deploy

# 5. Verify
npx prisma migrate status
```

### Scenario 4: Team Collaboration

When a teammate adds a migration:

```bash
# 1. Pull latest code
git pull

# 2. Apply new migrations
npx prisma migrate deploy  # Production
# or
npx prisma migrate dev     # Development

# 3. Regenerate Prisma Client
npm run prisma:generate
```

---

## Best Practices

1. **Always backup before migrations:**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

2. **Test migrations in staging first:**
   - Never deploy untested migrations to production
   - Use a staging environment with production-like data

3. **Keep migrations atomic:**
   - One migration per logical change
   - Don't mix unrelated changes

4. **Document complex migrations:**
   - Add comments in migration SQL
   - Update this guide for special cases

5. **Version control:**
   - Always commit migration files
   - Never edit existing migration files
   - Create new migrations for changes

6. **Use descriptive names:**
   ```bash
   # Good
   npx prisma migrate dev --name add_user_activation_fields
   
   # Bad
   npx prisma migrate dev --name changes
   ```

7. **Monitor migration deployment:**
   - Watch logs during deployment
   - Verify data integrity after migrations
   - Have rollback plan ready

---

## Available Scripts

The project provides these migration-related scripts:

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database (development)
npm run prisma:push

# Create migration (development)
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:migrate:deploy

# Check migration status
npm run prisma:migrate:status

# Pull schema from database
npm run prisma:db:pull

# Resolve P3005 error (database schema not empty)
# Use this script specifically for P3005 errors during deployment
npm run migrate:resolve-p3005
# Options: --auto (no prompts), --dry-run (preview only)

# Resolve general migration conflicts (interactive)
# Use this for other migration issues (not P3005)
npm run migrate:resolve

# Initialize database
npm run db:init

# Check database health
npm run db:check
```

**Note:** 
- `migrate:resolve-p3005` - Specialized tool for P3005 errors (database schema not empty)
- `migrate:resolve` - General-purpose interactive migration conflict resolution tool

---

## Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma DB Push Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate/db-push)
- [Migration Troubleshooting](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)

---

*Last updated: January 3, 2026*
