# DEPLOYMENT SEPARATION: Backend (Render) vs Frontend (Vercel)

## 🎯 Critical: Complete Separation of Concerns

This document establishes the **absolute separation** between backend and frontend deployments.

---

## 📍 Where Each Component Goes

### Backend → Render (ONLY)

**What deploys to Render:**
```
✅ Express API server (backend/server.js)
✅ Database migrations (prisma migrate deploy)
✅ Database schema management
✅ WebSocket server
✅ All database write operations
✅ Backend routes and controllers
```

**Configuration file:** `render.yaml`

**Build command on Render:**
```bash
set -e
npm ci --prefix .
npm ci --prefix backend
npx prisma generate
npx prisma migrate deploy  # ✅ ONLY HERE
cd backend && npm start
```

**Environment:** Production PostgreSQL on Render

---

### Frontend → Vercel (ONLY)

**What deploys to Vercel:**
```
✅ Next.js application
✅ Prisma client generation (types only)
✅ Frontend pages and components
✅ API routes (Next.js API routes)
✅ Static assets
❌ NO database migrations
❌ NO schema modifications
❌ NO prisma migrate commands
```

**Configuration file:** `vercel.json`

**Build command on Vercel:**
```bash
node scripts/vercel-build.js  # Generates Prisma client ONLY
npm run build                  # Builds Next.js
```

**Environment:** Vercel serverless functions

---

## 🚫 What NOT to Do

### ❌ NEVER on Vercel (Frontend)
```bash
# These commands should NEVER run on Vercel:
npx prisma migrate deploy
npx prisma migrate dev
npx prisma db push
npm run prisma:migrate:deploy
```

### ❌ NEVER on Render (Backend)
```bash
# Backend should NOT build frontend assets:
npm run build  # This is Next.js build - stays on Vercel
next build
```

---

## ✅ Deployment Checklist

### Step 1: Deploy Backend to Render FIRST

1. Push code to GitHub
2. Render detects changes
3. **Render runs migrations** ✅
4. Backend API starts
5. **Database schema is now up to date**

**Verify in Render logs:**
```
✅ Running database migrations...
✅ The following migrations have been applied:
✅ Build completed successfully
🚀 Backend server started
```

### Step 2: Deploy Frontend to Vercel SECOND

1. Vercel detects changes (same push)
2. **Vercel generates Prisma client** ✅
3. **Vercel does NOT run migrations** ✅
4. Next.js build completes
5. Frontend deployed

**Verify in Vercel logs:**
```
🎯 Architecture: Frontend-only deployment
✅ Generating Prisma Client for type definitions
❌ No migrations run (handled by backend)
✅ Frontend preparation completed!
```

---

## 🔧 Configuration Files

### render.yaml (Backend Configuration)

```yaml
services:
  - type: web
    name: algoedge-backend
    runtime: node
    buildCommand: |
      set -e
      npm ci --prefix .
      npm ci --prefix backend
      npx prisma generate
      npx prisma migrate deploy  # ✅ Migrations HERE
    startCommand: cd backend && npm start

databases:
  - name: algoedge-db
    plan: starter
```

### vercel.json (Frontend Configuration)

```json
{
  "version": 2,
  "buildCommand": "node scripts/vercel-build.js && npm run build",
  "framework": "nextjs",
  "env": {
    "SKIP_DB_MIGRATIONS": "true"  # ✅ Explicit: NO migrations
  }
}
```

---

## 📂 Repository Structure

```
AlgoEdge/
├── backend/              ← Goes to Render
│   ├── server.js        ← Express API
│   ├── config/          ← Backend config
│   ├── controllers/     ← API controllers
│   ├── routes/          ← API routes
│   └── package.json     ← Backend dependencies
│
├── src/                 ← Goes to Vercel
│   ├── app/             ← Next.js app
│   ├── components/      ← React components
│   └── pages/           ← Next.js pages
│
├── prisma/              ← Schema (Render manages, Vercel reads)
│   ├── schema.prisma    ← Database schema
│   └── migrations/      ← Migration files (applied by Render)
│
├── render.yaml          ← Backend deployment config
├── vercel.json          ← Frontend deployment config
└── package.json         ← Root dependencies (Prisma)
```

---

## 🔐 Environment Variables

### Render (Backend) - Full Access

```bash
# Required on Render
DATABASE_URL=postgresql://...  # Internal Database URL (full access)
JWT_SECRET=...
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Vercel (Frontend) - Read-Only (Optional)

```bash
# Optional on Vercel (for API routes)
DATABASE_URL=postgresql://...  # External Database URL (read-only)
SKIP_DB_MIGRATIONS=true        # Must be set
JWT_SECRET=...                 # For API routes
NODE_ENV=production
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Running migrations on both platforms
**Problem:** Race conditions, duplicate migrations, conflicts

**Solution:** Migrations run ONLY on Render (backend)

### ❌ Mistake 2: Deploying frontend before backend
**Problem:** Frontend tries to use schema that doesn't exist yet

**Solution:** Always deploy Render first, then Vercel

### ❌ Mistake 3: Mixed responsibilities
**Problem:** Frontend trying to manage database, backend building Next.js

**Solution:** Clear separation - backend = database, frontend = UI

### ❌ Mistake 4: Shared build scripts
**Problem:** Same script used for both deployments

**Solution:** 
- Render: Uses `render.yaml` buildCommand
- Vercel: Uses `scripts/vercel-build.js`

---

## 📊 Validation Commands

### Verify Render is handling migrations:

```bash
# Check Render build logs for:
grep "prisma migrate deploy" render-logs.txt
# Should show: "Running database migrations..."
```

### Verify Vercel is NOT handling migrations:

```bash
# Check Vercel build logs for:
grep "prisma migrate" vercel-logs.txt
# Should show: "No migrations run (handled by backend)"
```

---

## 📞 Troubleshooting

### Issue: "Table doesn't exist" error
**Cause:** Backend migrations didn't run or failed
**Fix:** Check Render build logs, redeploy backend

### Issue: Vercel build shows migration output
**Cause:** Old build script or configuration
**Fix:** Pull latest changes, verify `vercel-build.js` doesn't call migrations

### Issue: Schema mismatch errors
**Cause:** Frontend deployed before backend
**Fix:** Deploy backend first, wait for completion, then deploy frontend

---

## ✅ Deployment Flow Summary

```
1. Developer pushes code to GitHub
         ↓
2. ⚡ Render detects change → Deploys Backend
         ↓
   • Installs dependencies
   • Generates Prisma Client
   • ✅ RUNS DATABASE MIGRATIONS
   • Starts Express API
         ↓
3. ⚡ Vercel detects change → Deploys Frontend
         ↓
   • Installs dependencies
   • Generates Prisma Client (types)
   • ❌ NO MIGRATIONS
   • Builds Next.js app
         ↓
4. ✅ Complete: Backend + Frontend deployed with correct schema
```

---

## 📚 Related Documentation

- [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md) - Detailed architecture
- [DEPLOYMENT_QUICK_REF.md](./DEPLOYMENT_QUICK_REF.md) - Quick commands
- [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) - Render setup guide
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Full deployment guide

---

**Remember:** 
- **Backend (Render)** = Database authority → Manages all schema changes
- **Frontend (Vercel)** = Presentation layer → Consumes schema, never modifies

**Last Updated:** January 3, 2026  
**Status:** ✅ Production Ready - Complete Separation Enforced
