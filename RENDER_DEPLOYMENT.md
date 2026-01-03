# Render Deployment Guide

## Overview
This guide explains how to deploy AlgoEdge to Render with the fixed port binding configuration.

## What Was Fixed
The server now:
- ✅ Listens on `process.env.PORT` (required by Render)
- ✅ Binds to `0.0.0.0` (all network interfaces)
- ✅ Logs the port being used at startup

## Render Configuration

### 1. Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `kbornfas/AlgoEdge`
4. Select branch: `copilot/fix-server-port-listening-again`

### 2. Configure Build Settings
```
Name: algoedge
Environment: Node
Region: Choose closest to your users
Branch: copilot/fix-server-port-listening-again

Build Command: npm install && npm run build --ignore-scripts
Start Command: npm start
```

### 3. Set Environment Variables
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

**Note:** Render automatically sets the `PORT` environment variable. Do NOT manually set it.

### 4. Advanced Settings
- **Auto-Deploy**: Enable for automatic deployments on git push
- **Health Check Path**: `/` (default)
- **Instance Type**: Start with "Free" or "Starter"

## Expected Startup Logs
When your service starts successfully on Render, you should see:
```
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
After first deployment, run these commands locally:
```bash
# Set DATABASE_URL from Render
export DATABASE_URL="your-render-database-url"

# Generate Prisma client and push schema
npm run prisma:generate
npm run prisma:push

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
