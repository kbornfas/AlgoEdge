# AlgoEdge Scripts

This directory contains utility scripts for database management, deployment, and maintenance.

## Database Scripts

### `check-database.js`
**Purpose:** Validates database health and connectivity

**Usage:**
```bash
npm run db:check
```

**What it does:**
- Checks database connection
- Verifies Prisma client is generated
- Confirms all migrations are applied
- Validates required tables exist

**When to use:**
- Before starting the application
- When troubleshooting database issues
- After applying migrations

---

### `init-database.js`
**Purpose:** Initializes the database with schema and migrations

**Usage:**
```bash
npm run db:init
```

**What it does:**
- Validates DATABASE_URL is set
- Generates Prisma Client
- Applies migrations (production) or db push (development)
- Verifies database setup

**When to use:**
- First-time setup of a new database
- After cloning the repository
- When setting up a new environment

---

### `vercel-build.js` ⭐ NEW
**Purpose:** Enhanced build script for Vercel deployments with comprehensive validation

**Usage:**
```bash
npm run vercel:build
# OR directly:
node scripts/vercel-build.js && npm run build
```

**What it does:**
1. ✅ Validates DATABASE_URL environment variable
2. ✅ Tests database connectivity
3. ✅ Generates Prisma Client
4. ✅ Applies all pending migrations
5. ✅ Verifies all required tables exist (including payment_proofs)
6. ✅ Provides detailed error messages

**When to use:**
- **Automatically** during Vercel deployments (configured in vercel.json)
- Local testing before deploying to Vercel
- Troubleshooting deployment issues

**Required tables verified:**
- users
- subscriptions
- mt5_accounts
- trading_robots
- user_robot_configs
- trades
- user_settings
- verification_codes
- audit_logs
- payment_proofs ← This was the missing table causing deployment failures

**See also:** [VERCEL_DEPLOYMENT_FIX.md](../VERCEL_DEPLOYMENT_FIX.md) for complete documentation

---

### `resolve-migration-conflict.js`
**Purpose:** Resolves Prisma migration conflicts

**Usage:**
```bash
node scripts/resolve-migration-conflict.js
```

**What it does:**
- Interactive script to resolve migration state conflicts
- Helps mark migrations as applied when needed
- Useful for P3005 errors

**When to use:**
- When Prisma reports migration state conflicts
- After manual database changes
- When switching between deployment environments

---

## Seeding Scripts

### `seed-admin.js`
**Purpose:** Seeds the database with default admin user

**Usage:**
```bash
npm run seed:admin
```

**Creates:**
- Admin user with credentials from environment variables
- Default settings and permissions

**When to use:**
- Initial setup
- After database reset
- When admin user is missing

---

### `seed-robots.js`
**Purpose:** Seeds the database with default trading robots

**Usage:**
```bash
npm run seed:robots
```

**Creates:**
- Default trading robots with configurations
- Sample strategies and parameters

**When to use:**
- Initial setup
- After database reset
- When adding new robot templates

---

### `seed-all` (NPM Script)
**Purpose:** Runs both admin and robot seeding

**Usage:**
```bash
npm run seed:all
```

Equivalent to:
```bash
npm run seed:admin && npm run seed:robots
```

---

## Maintenance Scripts

### `send-daily-reports.js`
**Purpose:** Sends daily trading reports to users

**Usage:**
```bash
node scripts/send-daily-reports.js
```

**What it does:**
- Generates daily trading summaries
- Sends email reports to subscribed users
- Logs report generation status

**When to use:**
- As a cron job (daily)
- Manual report generation when needed

---

### `test-error-handling.js`
**Purpose:** Tests error handling and reporting

**Usage:**
```bash
node scripts/test-error-handling.js
```

**What it does:**
- Tests various error scenarios
- Validates error logging
- Checks error recovery mechanisms

**When to use:**
- During development
- Before deploying error handling changes
- Troubleshooting error reporting issues

---

## NPM Script Reference

All scripts can be run via npm scripts defined in `package.json`:

```bash
# Database
npm run db:check           # Check database health
npm run db:init            # Initialize database
npm run prisma:generate    # Generate Prisma Client
npm run prisma:push        # Push schema to database (dev)
npm run prisma:migrate     # Create migration (dev)
npm run prisma:migrate:deploy  # Deploy migrations (prod)
npm run prisma:migrate:status  # Check migration status

# Seeding
npm run seed:admin         # Seed admin user
npm run seed:robots        # Seed trading robots
npm run seed:all           # Seed both

# Building
npm run build              # Build Next.js app
npm run vercel:build       # Build with enhanced validation (for Vercel)

# Development
npm run dev                # Start development server
npm start                  # Start production server
```

## Environment Variables

Scripts that require environment variables:

- **DATABASE_URL** (required for all database scripts)
  - Format: `postgresql://user:password@host:port/database`
  - Example: `postgresql://postgres:mypass@localhost:5432/algoedge`

- **JWT_SECRET** (required for seed-admin.js)
- **ADMIN_USERNAME** (optional for seed-admin.js, defaults to "admin")
- **ADMIN_PASSWORD** (optional for seed-admin.js, defaults to "admin123")
- **ADMIN_EMAIL** (optional for seed-admin.js, defaults to "admin@algoedge.com")

## Troubleshooting

### Script fails with "Cannot find module"
```bash
npm install
```

### Script fails with "DATABASE_URL is not set"
```bash
# Create .env file with DATABASE_URL
echo 'DATABASE_URL="postgresql://user:pass@localhost:5432/algoedge"' > .env
```

### Script fails with "Cannot connect to database"
- Verify PostgreSQL is running
- Check DATABASE_URL is correct
- Ensure database exists
- Verify network connectivity

### Migration conflicts (P3005 error)
```bash
node scripts/resolve-migration-conflict.js
```

## Best Practices

1. **Always test locally before deploying**
   ```bash
   npm run vercel:build
   ```

2. **Check database health regularly**
   ```bash
   npm run db:check
   ```

3. **Keep migrations committed to git**
   ```bash
   git add prisma/migrations/
   git commit -m "Add migration"
   ```

4. **Use appropriate migration commands**
   - Development: `npm run prisma:migrate`
   - Production: `npm run prisma:migrate:deploy`

5. **Monitor script output**
   - Scripts provide detailed logs
   - Check exit codes (0 = success, 1 = error)

## Related Documentation

- [PRISMA_MIGRATION_GUIDE.md](../PRISMA_MIGRATION_GUIDE.md) - Comprehensive migration guide
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) - General troubleshooting
- [VERCEL_DEPLOYMENT_FIX.md](../VERCEL_DEPLOYMENT_FIX.md) - Vercel deployment fix details
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment procedures

---

_Last updated: January 3, 2026_
