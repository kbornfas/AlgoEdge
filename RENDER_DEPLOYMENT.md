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

**Last Updated:** January 3, 2026
**Branch:** copilot/fix-server-port-listening-again
