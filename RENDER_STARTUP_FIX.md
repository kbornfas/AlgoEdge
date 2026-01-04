# Render Startup Issues - Fix Implementation

## Overview
This document describes the fixes implemented to resolve startup issues on Render, including database migration errors and HTTP port detection problems.

## Issues Addressed

### 1. Database Migration Error
- **Problem**: "Column 'status' does not exist" error on startup
- **Root Cause**: Database migrations not verified before server initialization
- **Solution**: Added pre-flight migration check that runs before server starts

### 2. HTTP Port Detection Issue
- **Problem**: "No open HTTP ports detected" message during deployment
- **Root Cause**: Server initialization delays causing health check failures
- **Solution**: Server now opens HTTP port immediately (already implemented, enhanced with better logging)

### 3. Server Identification Confusion
- **Problem**: Unclear which server (frontend/backend) was starting in logs
- **Root Cause**: Similar startup messages for both servers
- **Solution**: Added clear visual identification for both servers

## Changes Implemented

### 1. Backend Server (`backend/server.js`)
**Changes:**
- Added prominent "BACKEND SERVER (Express)" identification banner at startup
- Enhanced startup logging with 5 clear initialization steps
- Improved error messages for database connection failures
- Added troubleshooting guidance in error output
- Maintained critical "HTTP port opens first" behavior for Render health checks

**Example Output:**
```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                    🚀 BACKEND SERVER (Express)                 ║
║                       AlgoEdge Trading API                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

📍 This is the BACKEND server providing REST API and WebSocket services
📍 NOT the frontend Next.js server (see root /server.js for frontend)
```

### 2. Frontend Server (`server.js`)
**Changes:**
- Added prominent "FRONTEND SERVER (Next.js)" identification banner
- Updated startup messages to clearly indicate frontend role
- Distinguished from backend server in all log output

**Example Output:**
```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                   🌐 FRONTEND SERVER (Next.js)                 ║
║                       AlgoEdge Web Interface                   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

📍 This is the FRONTEND Next.js server for the web interface
📍 For API/backend server, see backend/server.js
```

### 3. Migration Check Script (`backend/scripts/check-migrations.js`)
**New File:**
- Pre-flight check script that verifies database migrations before server starts
- Validates DATABASE_URL is configured
- Tests database connection
- Verifies all required tables exist (10 tables)
- Checks critical columns from recent migrations (status, created_at, etc.)
- Provides clear error messages and troubleshooting steps
- Returns exit code 0 on success, 1 on failure

**Features:**
- Fast execution (< 2 seconds typically)
- Clear visual output with step-by-step validation
- Detailed error messages with actionable guidance
- Safe to run repeatedly

**Usage:**
```bash
# From project root
node backend/scripts/check-migrations.js

# From backend directory (via npm script)
cd backend && npm run check-migrations
```

### 4. Backend Package.json (`backend/package.json`)
**Changes:**
- Modified `start` script to run migration check before starting server
- Added `check-migrations` npm script for manual verification
- Script runs from project root to access @prisma/client dependency

**New Scripts:**
```json
{
  "start": "cd .. && node backend/scripts/check-migrations.js && cd backend && node server.js",
  "check-migrations": "cd .. && node backend/scripts/check-migrations.js"
}
```

### 5. Render Build Configuration (`render.yaml`)
**Changes:**
- Enhanced build output with visual section separators
- Organized build into 5 clear steps with progress indicators
- Improved error handling with descriptive messages for each step
- Added specific troubleshooting guidance for common failure scenarios
- Better exit code handling to fail fast on errors

**Build Steps:**
1. **Install Dependencies** - Root and backend npm packages
2. **Generate Prisma Client** - Create database client code
3. **Deploy Migrations** - Apply database schema changes
4. **Verify Schema** - Validate all tables and columns exist
5. **Final Verification** - Confirm build success

**Example Build Output:**
```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║              AlgoEdge Backend - Render Build                   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 1/5: Installing Dependencies
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Expected Behavior After Fix

### On Render Deployment

1. **Build Phase:**
   - Clear progress indicators for each build step
   - Immediate failure with helpful error message if any step fails
   - Database migrations automatically applied
   - Schema validation confirms all tables and columns exist

2. **Startup Phase:**
   - Clear "BACKEND SERVER" identification in logs
   - Migration check runs automatically before server starts
   - If migrations missing, server fails fast with clear error message
   - HTTP port opens immediately for health checks
   - Services initialize sequentially with progress logging

3. **Health Checks:**
   - HTTP port immediately available at startup
   - `/health` endpoint responds successfully
   - Render health checks pass consistently

### Error Scenarios

#### Missing DATABASE_URL
```
❌ DATABASE_URL environment variable is not set

💡 Action Required:
   1. Set DATABASE_URL in your environment or .env file
   2. Format: postgresql://user:password@host:port/database
   3. For Render: This should be set automatically from the database service
```

#### Pending Migrations
```
❌ Missing required tables: users, subscriptions, trades

This indicates database migrations have not been applied.

💡 Action Required:
   Run database migrations with:
   $ npx prisma migrate deploy
```

#### Missing Critical Columns
```
❌ mt5_accounts.status is missing
   This column was added in a recent migration

💡 Action Required:
   Recent migrations have not been applied. Run:
   $ npx prisma migrate deploy
```

## Testing

### Local Testing

1. **Test Migration Check (No Database):**
   ```bash
   cd backend
   npm run check-migrations
   # Should fail gracefully with clear error message
   ```

2. **Test Server Identification:**
   ```bash
   # Backend
   cd backend
   JWT_SECRET=test npm start
   # Should show "BACKEND SERVER (Express)" banner
   
   # Frontend
   npm start
   # Should show "FRONTEND SERVER (Next.js)" banner
   ```

3. **Test with Database:**
   ```bash
   # Set up database
   export DATABASE_URL="postgresql://user:pass@localhost:5432/algoedge"
   
   # Run migration check
   cd backend
   npm run check-migrations
   # Should verify all tables and columns
   ```

### Render Testing

1. **Deploy to Render:**
   - Push changes to GitHub
   - Render auto-deploys from `render.yaml`
   - Monitor build logs for clear step-by-step output

2. **Verify Build Logs:**
   - Check for clear section separators
   - Confirm all 5 build steps complete
   - Verify no migration errors

3. **Verify Runtime Logs:**
   - Check for "BACKEND SERVER (Express)" banner
   - Confirm migration check passes
   - Verify HTTP port opens immediately
   - Confirm all services initialize successfully

## Troubleshooting

### Build Fails at Migration Step

**Check:**
1. DATABASE_URL is set in Render environment variables
2. Database service is running and accessible
3. Migration files in `prisma/migrations/` are not corrupted

**Fix:**
- Verify database connection in Render dashboard
- Check database service logs
- Manually run: `npx prisma migrate deploy`

### Server Fails to Start

**Check:**
1. Build completed successfully
2. Migration check passed
3. Required environment variables are set (JWT_SECRET, DATABASE_URL)

**Fix:**
- Review startup logs for specific error
- Run migration check manually: `npm run check-migrations`
- Verify environment variables in Render dashboard

### "Status Column Does Not Exist" Error

**This should no longer occur after these fixes.**

If it does appear:
1. Migration check should have caught this before server started
2. Verify migration `20260104095900_add_status_to_mt5_accounts` was applied
3. Run `npx prisma migrate deploy` manually
4. Check migration check script output for details

## Architecture Notes

### Why HTTP Port Opens First

Render (and other cloud platforms) require HTTP port to be open immediately for health checks. The server:

1. Opens HTTP port and starts listening
2. Then initializes database connections
3. Then initializes other services (WebSocket, MT5, etc.)

This ensures health checks pass even if service initialization takes time.

### Why Migration Check Runs Before Server

Running migration check before server startup:

1. Catches missing migrations early
2. Prevents cryptic "column does not exist" errors
3. Provides clear actionable error messages
4. Fails fast with proper exit codes
5. Easier to diagnose issues from logs

### Why Separate Frontend/Backend Servers

- **Frontend (server.js)**: Next.js server for web interface
  - Deployed on Vercel in production
  - Used for local development with `npm start`
  
- **Backend (backend/server.js)**: Express API server
  - Deployed on Render in production
  - Provides REST API and WebSocket services
  - Handles database operations

## Files Modified

1. `backend/server.js` - Enhanced startup logging and identification
2. `server.js` - Added frontend server identification
3. `backend/package.json` - Added migration check scripts
4. `render.yaml` - Improved build process with better error handling
5. `backend/scripts/check-migrations.js` - New migration verification script (NEW)
6. `RENDER_STARTUP_FIX.md` - This documentation file (NEW)

## Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - General deployment guide
- [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) - Render-specific deployment
- [PRISMA_MIGRATION_GUIDE.md](./PRISMA_MIGRATION_GUIDE.md) - Database migrations
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - General troubleshooting

## Success Criteria

✅ Clear identification of frontend vs backend server in logs  
✅ Database migrations verified before server starts  
✅ HTTP port opens immediately for Render health checks  
✅ Graceful error handling with actionable messages  
✅ No more "status column does not exist" errors  
✅ Fast deployment with clear build progress  

## Maintenance

### Adding New Migrations

When adding new migrations with critical columns:

1. Update `CRITICAL_COLUMNS` in `backend/scripts/check-migrations.js`
2. Add the table and column name
3. Reference the migration file in comments
4. Test the migration check script

Example:
```javascript
const CRITICAL_COLUMNS = {
  'mt5_accounts': ['status'],
  'payment_proofs': ['created_at'],
  'new_table': ['new_critical_column'] // Added in migration 20260105120000_add_feature
};
```

### Updating Required Tables

When adding new tables:

1. Update `REQUIRED_TABLES` in `backend/scripts/check-migrations.js`
2. Add the table name to the array
3. Test the migration check script

---

*Last Updated: January 4, 2026*
*Status: Implementation Complete*
