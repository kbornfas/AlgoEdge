# Render Deployment Guide

## Overview
This guide explains how to deploy AlgoEdge backend to Render. The backend is responsible for running database migrations and managing the database schema.

## Important: Deployment Architecture

⚠️ **AlgoEdge uses a split deployment architecture:**
- **Vercel (Frontend)**: Deploys Next.js app, generates Prisma client (read-only)
- **Render (Backend)**: Deploys Express API, **runs all database migrations**

See [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md) for complete details.

## What Was Fixed
The deployment now correctly separates responsibilities:
- ✅ Render runs database migrations during build
- ✅ Vercel only builds frontend (no migrations)
- ✅ Database schema managed in one place (Render)
- ✅ No race conditions or migration conflicts

## Render Configuration

### 1. Automatic Deployment with render.yaml

The project includes a `render.yaml` blueprint file that automatically configures:
- PostgreSQL database
- Backend web service
- Environment variables
- Build and start commands

**To deploy:**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository: `kbornfas/AlgoEdge`
4. Select branch: `main` (or your working branch)
5. Render will automatically detect `render.yaml` and create all services

**Build Process (Automated):**
```bash
# Install dependencies
npm ci --prefix .
npm ci --prefix backend

# Generate Prisma Client
npx prisma generate

# Run database migrations ✅
npx prisma migrate deploy

# Start backend
cd backend && npm start
```

### 2. Manual Deployment Configuration

If not using the blueprint, configure manually:

**Service Settings:**
```
Name: algoedge-backend
Environment: Node
Region: Oregon (or closest to your users)
Branch: main

Build Command: npm ci --prefix . && npm ci --prefix backend && npx prisma generate && npx prisma migrate deploy
Start Command: cd backend && npm start
```
**Required Variables:**
```bash
# Database (use Render PostgreSQL)
DATABASE_URL=your-postgres-connection-string

# JWT Authentication (generate secure key)
JWT_SECRET=your-secure-random-key-min-32-chars

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=AlgoEdge <noreply@algoedge.com>

# Application URLs (will be provided by Render)
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
NEXT_PUBLIC_FRONTEND_URL=https://your-app.onrender.com

# External Services
NEXT_PUBLIC_WHATSAPP_URL=https://wa.me/your-number
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/your-account
METAAPI_TOKEN=your-metaapi-token
METAAPI_ACCOUNT_ID=your-account-id

# Admin Credentials
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-secure-password

# Environment
NODE_ENV=production
```

### 3. Set Environment Variables

**IMPORTANT:** Render automatically sets the `PORT` environment variable. Do NOT manually set it.

### 4. Advanced Settings
- **Auto-Deploy**: Enable for automatic deployments on git push
- **Health Check Path**: `/` (default)
- **Instance Type**: Start with "Free" or "Starter"

## Expected Startup Logs

When your service starts successfully on Render, you should see:

```
==========================================
  Vercel Build - Frontend Preparation
==========================================

🎯 Architecture: Frontend-only deployment
   - Frontend (Vercel): Builds Next.js app
   - Backend (Render): Handles DB migrations

🔍 Step 1: Validating environment...
✅ DATABASE_URL is set (for read-only queries)

🔍 Step 2: Testing database connection (optional)...
✅ Database connection successful (read-only access)

🔍 Step 3: Generating Prisma Client...
✅ Prisma Client generation completed

📦 Deploying Prisma migrations...
✅ Migration deployment completed successfully

==========================================
  ✅ Backend build completed successfully!
==========================================

🚀 AlgoEdge Server Started Successfully
========================================
Environment: production
Server listening on: http://0.0.0.0:10000
Port: 10000 (from process.env.PORT)
Hostname: 0.0.0.0
Ready for connections
========================================
```

**Key Indicators:**
- Port shows a number (usually 10000) from `process.env.PORT`
- Hostname is `0.0.0.0` (not localhost)
- No error messages about port detection

## Health Check
Render will automatically check for an open HTTP port on `0.0.0.0`.
With this fix, the health check should pass and your service will stay live.

## Troubleshooting

### Migration Failures

If migrations fail during deployment, you'll see clear error messages in the Render logs:

**Symptoms:**
- `❌ Migration deployment failed` in build logs
- `❌ Database validation failed` in build logs
- `errorMissingColumn` errors at runtime

**Common Causes:**

1. **Database URL not set or incorrect**
   ```
   Error: P1001: Can't reach database server
   ```
   **Solution:** Check that `DATABASE_URL` environment variable is set correctly in Render

2. **Database doesn't exist**
   ```
   Error: P1003: Database does not exist
   ```
   **Solution:** Ensure the PostgreSQL database service is created and linked to your web service

3. **Migration conflicts**
   ```
   Error: Migration ... failed to apply
   ```
   **Solution:** Check migration history with `npx prisma migrate status`

4. **Prisma Client not generated**
   ```
   Error: Cannot find module '@prisma/client'
   ```
   **Solution:** The build command should run `npx prisma generate` before migrations

### Verifying Database State

After a successful deployment, your Render build logs should show:

```
✅ Database connection successful
✅ All required tables exist
   Found 10 tables: users, subscriptions, mt5_accounts, trading_robots, ...
✅ Database validation passed
✅ Build completed successfully
```

If you see `❌ Missing tables`, the migrations didn't run properly.

### Manual Migration Troubleshooting

If automatic migrations fail, you can manually investigate:

1. **Connect to your Render database:**
   ```bash
   # Get the DATABASE_URL from Render dashboard
   psql "your-database-url-here"
   ```

2. **Check if tables exist:**
   ```sql
   \dt
   -- or
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

3. **Check migration history:**
   ```sql
   SELECT * FROM _prisma_migrations;
   ```

4. **Manually run migrations (if needed):**
   ```bash
   # In Render Shell or locally with DATABASE_URL set
   npx prisma migrate deploy
   ```

### Force Fresh Migration

If your database is in an inconsistent state:

1. **⚠️ WARNING: This will delete all data!**
2. In Render dashboard, go to your database service
3. Delete and recreate the database
4. Trigger a new deployment - migrations will run on the fresh database

### Checking Current Deployment

To verify your current deployment status:

1. **Check Render logs:**
   - Go to your web service in Render
   - Click "Logs" tab
   - Look for the build output and validation messages

2. **Test the API:**
   ```bash
   curl https://your-app.onrender.com/health
   ```

3. **Check database connection:**
   ```bash
   # Run validation script (requires DATABASE_URL)
   npm run render:validate
   ```

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `errorMissingColumn` | Table or column doesn't exist | Migrations didn't run - check build logs |
| `P1001` | Can't reach database | Check DATABASE_URL is set |
| `P1003` | Database doesn't exist | Create database service in Render |
| `P3005` | Migration conflict | Resolve with `prisma migrate resolve` |
| `ECONNREFUSED` | Connection refused | Database not accessible from Render |

## Troubleshooting

### If service still shuts down:
1. Check the logs in Render dashboard
2. Verify environment variables are set correctly
3. Ensure DATABASE_URL is accessible from Render
4. Check that all required environment variables are present

### If build fails:
1. Ensure all dependencies are in package.json
2. Check that Prisma schema is correct
3. Verify Node version compatibility (20.x)

### If database connection fails:
1. Use Render's PostgreSQL "Internal Database URL"
2. Ensure the database is in the same region as the web service
3. Check that the connection string format is correct

## Post-Deployment

### 1. Initialize Database

After first deployment, initialize the database with proper migrations:

**Option A: Fresh Database (Recommended)**
```bash
# Set DATABASE_URL from Render
export DATABASE_URL="your-render-database-url"

# Generate Prisma client
npm run prisma:generate

# Deploy migrations (production-safe)
npx prisma migrate deploy

# Seed initial data
npm run seed:all
```

**Option B: Existing Database with Schema**

If your database already has schema but no migration history:

```bash
# Set DATABASE_URL from Render
export DATABASE_URL="your-render-database-url"

# Pull current schema to sync
npx prisma db pull

# Review changes
git diff prisma/schema.prisma

# Generate Prisma client
npm run prisma:generate

# If schema matches, mark migrations as applied
npx prisma migrate resolve --applied "20260102090350_add_approval_status_and_rejection_reason"

# Or use helper script
npm run migrate:resolve

# Verify migration status
npx prisma migrate status

# Seed initial data if needed
npm run seed:all
```

**Option C: Database has different schema**

If the database schema doesn't match your Prisma schema:

```bash
# Backup the database first!
pg_dump $DATABASE_URL > backup.sql

# Create a baseline migration
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql

# Mark baseline as applied
npx prisma migrate resolve --applied 0_init

# Deploy any remaining migrations
npx prisma migrate deploy

# Seed initial data
npm run seed:all
```

### 2. Verify Deployment
1. Visit your Render URL: `https://your-app.onrender.com`
2. Check admin login: `https://your-app.onrender.com/admin/login`
3. Test user registration: `https://your-app.onrender.com/auth/register`

### 3. Monitor Logs
- Watch Render logs for any errors
- Verify the startup message shows correct port
- Check that health checks are passing

## Security Notes
- Never commit `.env` files
- Use strong, random JWT_SECRET (32+ characters)
- Change default admin credentials after first login
- Enable HTTPS (Render does this automatically)
- Keep environment variables secure

## Support
If you encounter issues:
1. Check Render logs first
2. Verify all environment variables are set
3. Review this guide's troubleshooting section
4. Check Render's [documentation](https://render.com/docs)

---

**Last Updated:** January 4, 2026
**Branch:** copilot/fix-render-deployment-errors
