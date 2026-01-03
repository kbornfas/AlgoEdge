# Deployment Architecture - Prisma Migration Fix

## Overview

This document explains the corrected deployment architecture for AlgoEdge, specifically addressing where Prisma migrations should run.

## Problem Statement

Previously, Prisma migrations were running during Vercel (frontend) builds, which caused issues because:
1. Vercel is designed for frontend deployment only
2. Database migrations should be managed by the backend service
3. Running migrations in multiple places can cause conflicts and race conditions
4. Vercel builds should be stateless and not modify database schema

## Solution: Separation of Concerns

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AlgoEdge System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  Vercel          │         │  Render          │             │
│  │  (Frontend)      │         │  (Backend)       │             │
│  ├──────────────────┤         ├──────────────────┤             │
│  │                  │         │                  │             │
│  │ Next.js Build    │         │ Express API      │             │
│  │ Prisma Generate  │◄────────┤ DB Migrations    │             │
│  │ (Read-only)      │         │ Schema Management│             │
│  │                  │         │                  │             │
│  └──────────────────┘         └──────────────────┘             │
│                                        │                        │
│                                        │ PostgreSQL             │
│                                        ▼                        │
│                              ┌──────────────────┐              │
│                              │   Database       │              │
│                              │   (Render)       │              │
│                              └──────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Deployment Responsibilities

#### Vercel (Frontend) - ✅ DO:
- Build Next.js application
- Generate Prisma Client (for types and read-only queries)
- Serve static assets and API routes
- Handle frontend routing

#### Vercel (Frontend) - ❌ DON'T:
- Run `prisma migrate deploy`
- Run `prisma db push`
- Modify database schema
- Create/alter/drop tables

#### Render (Backend) - ✅ DO:
- Run `prisma migrate deploy` during build
- Manage database schema
- Handle database migrations
- Verify migration integrity
- Run database initialization scripts

#### Render (Backend) - ❌ DON'T:
- Build frontend assets
- Run Next.js build commands

## Implementation Details

### 1. Vercel Configuration

**File: `vercel.json`**
```json
{
  "version": 2,
  "buildCommand": "node scripts/vercel-build.js && npm run build",
  "env": {
    "SKIP_DB_MIGRATIONS": "true"
  }
}
```

**File: `scripts/vercel-build.js`**
- ✅ Generates Prisma Client only
- ✅ Tests database connectivity (non-blocking)
- ❌ Does NOT run migrations
- ❌ Does NOT modify schema

### 2. Render Configuration

**File: `render.yaml`**
```yaml
services:
  - type: web
    name: algoedge-backend
    buildCommand: |
      npm ci --prefix . &&
      npm ci --prefix backend &&
      npx prisma generate &&
      npx prisma migrate deploy
    startCommand: cd backend && npm start
```

**Build Process:**
1. Install root dependencies (includes Prisma)
2. Install backend dependencies
3. Generate Prisma Client
4. **Run database migrations** ✅
5. Start Express backend

### 3. Package.json Scripts

**Root `package.json`:**
```json
{
  "scripts": {
    "vercel:build": "node scripts/vercel-build.js && npm run build"
  }
}
```

Migrations are handled by Render's build command (defined in `render.yaml`).

## Migration Workflow

### Development
```bash
# 1. Create migration locally
npx prisma migrate dev --name add_new_feature

# 2. Test migration
npm run prisma:migrate:status

# 3. Commit migration files
git add prisma/migrations/
git commit -m "Add new feature migration"

# 4. Push to repository
git push origin main
```

### Production Deployment

**When code is pushed to main:**

1. **Render (Backend) Deployment:**
   - Detects new code
   - Runs build command
   - Executes `npx prisma migrate deploy`
   - Applies new migrations
   - Starts backend server
   - ✅ Database schema updated

2. **Vercel (Frontend) Deployment:**
   - Detects new code
   - Runs build command
   - Executes `npx prisma generate`
   - Builds Next.js app
   - Deploys frontend
   - ✅ Uses updated schema types

## Environment Variables

### Vercel (Frontend)
```bash
# Optional - for read-only queries via API routes
DATABASE_URL=postgresql://...
# Other frontend env vars
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Render (Backend)
```bash
# Required - for migrations and backend operations
DATABASE_URL=postgresql://...  # From Render PostgreSQL
JWT_SECRET=...
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
# Other backend env vars
```

## Troubleshooting

### Issue: Vercel build fails with migration error

**Cause:** Vercel trying to run migrations (old configuration)

**Solution:**
1. Verify `scripts/vercel-build.js` doesn't call `prisma migrate deploy`
2. Check `vercel.json` uses the correct build command
3. Confirm `SKIP_DB_MIGRATIONS=true` is set in Vercel env vars

### Issue: Render fails to run migrations

**Cause:** Missing Prisma dependencies or incorrect build command

**Solution:**
1. Verify `render.yaml` includes `npx prisma generate && npx prisma migrate deploy`
2. Ensure DATABASE_URL is set correctly on Render
3. Check build logs for specific error messages
4. Use `npm run migrate:resolve-p3005` if P3005 error occurs

### Issue: Database schema mismatch

**Cause:** Migrations not applied or applied out of order

**Solution:**
1. Check migration status: `npx prisma migrate status`
2. On Render, trigger a manual deploy
3. Verify all migration files are committed to git
4. Use `prisma migrate resolve` if needed

## Testing

### Local Testing

**Test Vercel Build:**
```bash
# Should NOT run migrations
npm run vercel:build
# Verify no migration output, only Prisma client generation
```

**Test Render Migration:**
```bash
# Set DATABASE_URL to test database
export DATABASE_URL="postgresql://..."

# Run migration command (same as used by Render)
npx prisma migrate deploy

# Verify migrations applied
npx prisma migrate status
```

### CI/CD Testing

The CI pipeline simulates both environments:
- **database-validation** job: Runs migrations (simulates Render)
- **build** job: Builds frontend without migrations (simulates Vercel)

## Security Considerations

1. **Database Credentials:**
   - Vercel: Optional, read-only access
   - Render: Required, full access for migrations

2. **Migration Safety:**
   - Always test migrations in staging first
   - Use transactions where possible
   - Have rollback plan ready
   - Backup database before major migrations

3. **Access Control:**
   - Limit who can deploy to production
   - Review all schema changes
   - Use migration naming conventions

## Benefits of This Architecture

✅ **Clear separation of concerns**
- Frontend focuses on UI/UX
- Backend manages data layer

✅ **Prevents race conditions**
- Only one service runs migrations
- No conflicts between deployments

✅ **Better security**
- Frontend has minimal DB permissions
- Backend has full migration control

✅ **Easier debugging**
- Migration logs in one place (Render)
- Clear ownership of schema changes

✅ **Faster frontend builds**
- No waiting for migrations
- Stateless build process

## Migration Checklist

Before deploying migrations to production:

- [ ] Test migration locally
- [ ] Verify migration is reversible (if needed)
- [ ] Check migration affects expected tables/columns
- [ ] Test with production-like data volume
- [ ] Review for breaking changes
- [ ] Update API documentation if schema changes
- [ ] Notify team of deployment
- [ ] Monitor Render build logs during deployment
- [ ] Verify frontend deploys successfully after backend
- [ ] Test critical user flows post-deployment

## References

- [Prisma Migrations Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Render Deployment Guide](./RENDER_DEPLOYMENT.md)
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT_FIX.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

**Last Updated:** January 3, 2026
**Issue:** Fix Prisma migration deployment separation
**Status:** ✅ Implemented
