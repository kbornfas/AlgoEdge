# Database Migrations

This directory contains all Prisma database migrations for AlgoEdge.

## Migration Order

Migrations are applied in chronological order based on their timestamp prefix:

1. **20260102090000_init** - Initial migration that creates all base tables:
   - users
   - subscriptions
   - mt5_accounts
   - trading_robots
   - user_robot_configs
   - trades
   - user_settings
   - verification_codes
   - audit_logs
   - **payment_proofs** (this was the missing table causing deployment failures)

2. **20260102090350_add_approval_status_and_rejection_reason** - Adds approval workflow columns to users table:
   - approval_status
   - rejection_reason

## How Migrations Work

- Migrations are automatically applied during Vercel deployment via the build command in `vercel.json`
- The build command runs: `prisma migrate deploy && npm run build`
- If migration fails, the build stops (bash `&&` operator ensures this)
- All migrations are tracked in the `_prisma_migrations` table in the database

## Adding New Migrations

To create a new migration:

```bash
# 1. Modify schema.prisma
# 2. Generate migration
npx prisma migrate dev --name descriptive_migration_name

# 3. Review the generated SQL in prisma/migrations/
# 4. Commit the migration files to git
```

## Applying Migrations in Production

Migrations are automatically applied during deployment. If you need to manually apply:

```bash
# With DATABASE_URL set in environment
npx prisma migrate deploy
```

## Important Notes

- **NEVER** delete or modify existing migration files - this will cause sync issues
- **ALWAYS** commit migration files to version control
- **NEVER** use `prisma db push` in production - it can cause data loss
- Migration files are the single source of truth for database schema changes

## Troubleshooting

If you encounter migration errors:

1. Check that DATABASE_URL is correctly set
2. Verify database is accessible
3. Check Vercel build logs for specific error messages
4. Ensure all migration files are committed to git
5. Refer to TROUBLESHOOTING.md for detailed solutions
