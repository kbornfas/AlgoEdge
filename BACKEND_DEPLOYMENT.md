# AlgoEdge Backend Deployment Guide

## Why Backend Deployment is Required

The trading robots need a **24/7 server** to execute trades automatically. The frontend on Vercel is serverless and cannot run continuous processes.

## Recommended: Deploy to Railway

Railway offers a free tier and easy deployment.

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub

### Step 2: Deploy Backend
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `AlgoEdge` repository
4. In deployment settings, set:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`

### Step 3: Configure Environment Variables
In Railway dashboard, add these environment variables:

```
PORT=3001
NODE_ENV=production
JWT_SECRET=your-jwt-secret
METAAPI_TOKEN=your-metaapi-token
DATABASE_URL=your-postgres-url
FRONTEND_URL=https://algoedgehub.com
```

### Step 4: Update Frontend to Use Backend URL
After deployment, Railway will give you a URL like `https://algoedge-backend.up.railway.app`

Update your frontend environment:
- `NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app`

## Alternative: Render.com

### Create `render.yaml` in project root:
```yaml
services:
  - type: web
    name: algoedge-backend
    runtime: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: PORT
        value: 3001
      - key: NODE_ENV
        value: production
```

## What Happens After Deployment

1. Backend starts and initializes MT5 connections
2. Trading scheduler starts running every 30 seconds
3. ALL active robots will execute trades automatically
4. Trades are forced when no signals found (guaranteed entry)
5. Works 24/7 regardless of browser state

## Monitoring

Check Railway logs to see:
```
🚀 TRADING SCHEDULER STARTED
[timestamp] ========== TRADING CYCLE ==========
📊 Processing X active robot(s)...
🤖 Processing robot: Scalper Gold (m1)
✅ SIGNAL: BUY XAUUSD @ 2650.12345
🎉 TRADE EXECUTED: #123 - XAUUSD BUY
```
