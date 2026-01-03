# Vercel Deployment Fix - Architecture Separation

## Problem Summary

Vercel deployments were incorrectly configured to run Prisma migrations during frontend builds. This caused issues because:
- Vercel is for **frontend deployment only**
- Database migrations should be managed by the **backend service (Render)**
- Running migrations in multiple places can cause conflicts and race conditions
- Frontend builds should be stateless and not modify database schema

## Root Cause

The original deployment configuration had Vercel running `prisma migrate deploy` during builds, which:
1. Violates the separation of concerns principle
2. Can cause P3005 errors when multiple deployments try to migrate simultaneously
3. Requires frontend to have full database write permissions
4. Makes frontend builds slower and more fragile
5. Creates unclear ownership of database schema changes

## Solution Implemented

### Architecture Change

**Before (Incorrect):**
```
Vercel Build:
  1. npm install
  2. prisma generate
  3. prisma migrate deploy ❌  # Frontend shouldn't do this
  4. next build
```

**After (Correct):**
```
Vercel Build (Frontend):
  1. npm install
  2. prisma generate ✅  # Only generate client
  3. next build

Render Build (Backend):
  1. npm install (root + backend)
  2. prisma generate
  3. prisma migrate deploy ✅  # Backend handles migrations
  4. Start Express server
```

## Solution Implemented

### 1. Updated Vercel Build Script (`scripts/vercel-build.js`)

The script has been completely refactored to remove all migration logic:

✅ **Frontend-Only Responsibilities**
- Generates Prisma Client for type definitions
- Tests database connectivity (optional, non-blocking)
- Does NOT run any migrations
- Does NOT modify database schema

❌ **Removed Functionality**
- No `prisma migrate deploy` calls
- No migration status checks
- No P3005 error handling (not needed anymore)
- No table verification (backend's responsibility)

The new script focuses solely on preparing the frontend build environment.

### 2. Created Render Deployment Config (`render.yaml`)

New configuration file that defines backend deployment:

✅ **Backend Build Process**
```yaml
buildCommand: |
  npm ci --prefix . &&
  npm ci --prefix backend &&
  npx prisma generate &&
  npx prisma migrate deploy
```

✅ **Responsibilities**
- Installs all dependencies
- Generates Prisma Client
- **Runs database migrations** (only place this happens)
- Starts Express backend

### 3. Updated Vercel Configuration (`vercel.json`)

Added environment variable to indicate frontend-only build:

```json
{
  "env": {
    "SKIP_DB_MIGRATIONS": "true"
  }
}
```

This makes it explicit that Vercel should not run migrations.

### 4. Updated Package Scripts

**Root `package.json`:**
```json
{
  "scripts": {
    "vercel:build": "node scripts/vercel-build.js && npm run build"
  }
}
```

Migrations are handled by Render's build command defined in `render.yaml`, not by npm scripts.

## Deployment Guide

### For Vercel (Frontend)

**What happens:**
1. Vercel detects push to main branch
2. Runs `node scripts/vercel-build.js && npm run build`
3. Script generates Prisma Client only
4. Next.js build completes
5. Frontend deployed ✅

**No migrations run on Vercel** - all database changes handled by Render.

### For Render (Backend)

**What happens:**
1. Render detects push to main branch
2. Runs build command from `render.yaml`:
   ```bash
   npm ci --prefix . &&
   npm ci --prefix backend &&
   npx prisma generate &&
   npx prisma migrate deploy
   ```
3. Migrations applied to database ✅
4. Backend server starts

**Expected Build Output:**
```
Installing dependencies...
Generating Prisma Client...
📦 Deploying Prisma migrations...
✅ The following migrations have been applied:
  ├─ 20260102090000_init
  ├─ 20260102090350_add_approval_status_and_rejection_reason
  └─ [other migrations]
✅ All migrations have been successfully applied
Starting backend server...
🚀 AlgoEdge Server Started Successfully
```

### Deployment Order

**Always deploy in this order:**
1. Push code to GitHub
2. Backend (Render) deploys first - runs migrations
3. Frontend (Vercel) deploys second - uses updated schema

This ensures the database schema is always updated before the frontend tries to use it.

## Files Changed

1. **scripts/vercel-build.js** (MODIFIED)
   - Removed all migration logic
   - Now only generates Prisma Client
   - Frontend-only responsibilities

2. **render.yaml** (NEW)
   - Defines backend deployment configuration
   - Includes database migration in build command
   - Configures environment variables

3. **vercel.json** (MODIFIED)
   - Added `SKIP_DB_MIGRATIONS=true` environment variable
   - Makes frontend-only deployment explicit

4. **package.json** (MODIFIED)
   - Added `render:migrate` script
   - Clarified script responsibilities

5. **DEPLOYMENT_ARCHITECTURE.md** (NEW)
   - Complete documentation of deployment architecture
   - Explains separation of concerns
   - Migration workflow guide

6. **RENDER_DEPLOYMENT.md** (MODIFIED)
   - Updated to reflect new architecture
   - Added migration verification steps

7. **PRODUCTION_DEPLOYMENT.md** (MODIFIED)
   - Updated deployment order
   - Added backend deployment section
   - Clarified environment variables for each service

## Migration Files

The payment_proofs table is defined in:
- **prisma/schema.prisma** (lines 209-227)
  - Model: `PaymentProof`
  - Table: `payment_proofs` (via `@@map("payment_proofs")`)

- **prisma/migrations/20260102090000_init/migration.sql**
  ```sql
  CREATE TABLE "payment_proofs" (
      "id" SERIAL NOT NULL,
      "user_id" INTEGER NOT NULL,
      "proof_url" TEXT NOT NULL,
      "amount" DECIMAL(10,2),
      "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
      "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
      "notes" TEXT,
      "reviewed_by" INTEGER,
      "reviewed_at" TIMESTAMP(3),
      "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "payment_proofs_pkey" PRIMARY KEY ("id")
  );
  ```

## Benefits of This Architecture

✅ **Clear Separation of Concerns**
- Frontend focuses on UI/UX
- Backend manages database layer
- No confusion about responsibilities

✅ **Prevents Migration Conflicts**
- Only one service runs migrations
- No race conditions between deployments
- Single source of truth for schema

✅ **Better Security**
- Frontend has minimal/read-only DB access
- Backend has full migration control
- Reduced attack surface

✅ **Faster Frontend Builds**
- No waiting for migration checks
- Stateless build process
- Predictable build times

✅ **Easier Debugging**
- Migration logs in one place (Render)
- Clear ownership of issues
- Simpler troubleshooting

## Troubleshooting

### Issue: Vercel build includes migration output

**Solution:** Verify `scripts/vercel-build.js` is updated and doesn't call `prisma migrate deploy`.

### Issue: Render build fails with migration error

**Possible causes:**
1. DATABASE_URL not set correctly
2. Database not accessible from Render
3. Migration files missing from git

**Solution:**
1. Check Render environment variables
2. Verify DATABASE_URL format
3. Ensure all migration files are committed
4. Check build logs for specific error

### Issue: Frontend can't connect to database

**Solution:** 
- Verify DATABASE_URL is set in Vercel (optional for read-only access)
- Ensure backend API is deployed and accessible
- Check CORS settings on backend

## Summary

This fix permanently resolves deployment architecture issues by:

✅ Separating frontend and backend deployment responsibilities
✅ Moving all database migrations to backend (Render)
✅ Removing migration logic from frontend builds (Vercel)
✅ Preventing race conditions and migration conflicts
✅ Providing clear documentation and guidelines

**Architecture:**
- **Vercel**: Builds Next.js frontend only
- **Render**: Handles all database migrations and backend API
- **Clear**: One service, one responsibility

---

**Date Fixed:** January 3, 2026
**Issue:** Separate Prisma migration and deployment processes
**Status:** ✅ Implemented and Documented
