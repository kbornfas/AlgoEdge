# Deployment Readiness Checklist

## ✅ Pre-Deployment Verification

This checklist ensures both backend (Render) and frontend (Vercel) are ready for deployment with environment variables already configured.

---

## 🟢 Backend (Render) - Deployment Checklist

### Configuration Files ✅
- [x] `render.yaml` exists and configured
- [x] Build command includes migrations: `npx prisma migrate deploy`
- [x] Start command: `cd backend && npm start`
- [x] Database service defined in `render.yaml`

### Environment Variables (Set in Render Dashboard)

**Required on Render:**
```bash
✅ DATABASE_URL           # Auto-populated from Render PostgreSQL
✅ JWT_SECRET            # Must match Vercel
✅ NODE_ENV=production   # Set in render.yaml
✅ SMTP_HOST             # Email service
✅ SMTP_PORT             # Usually 587
✅ SMTP_USER             # Email username
✅ SMTP_PASS             # Email password
✅ SMTP_FROM             # From email address
✅ FRONTEND_URL          # Your Vercel domain (e.g., https://yourapp.vercel.app)
```

**Optional but Recommended:**
```bash
METAAPI_TOKEN            # For MT5 integration
METAAPI_ACCOUNT_ID       # For MT5 integration
STRIPE_SECRET_KEY        # For payments
STRIPE_WEBHOOK_SECRET    # For Stripe webhooks
```

### Deployment Steps for Render

1. **Option A: Using Blueprint (Recommended)**
   ```
   1. Go to https://dashboard.render.com
   2. Click "New +" → "Blueprint"
   3. Connect GitHub repo: kbornfas/AlgoEdge
   4. Select branch: main (or your branch)
   5. Render creates database + backend automatically
   6. Set environment variables in Render dashboard
   7. Deploy!
   ```

2. **Option B: Manual Setup**
   - Create PostgreSQL database first
   - Create Web Service
   - Configure build/start commands from `render.yaml`
   - Set environment variables
   - Deploy

### Verification for Render ✅

After deployment, check Render logs for:
```
✅ Installing root dependencies...
✅ Installing backend dependencies...
✅ Generating Prisma Client...
✅ Running database migrations...
✅ The following migrations have been applied: [list]
✅ Build completed successfully
✅ Backend server started
```

**Test backend:**
```bash
curl https://your-backend.onrender.com/health
# Should return: {"status": "ok"}
```

---

## 🔵 Frontend (Vercel) - Deployment Checklist

### Configuration Files ✅
- [x] `vercel.json` exists and configured
- [x] Build command: `node scripts/vercel-build.js && npm run build`
- [x] `SKIP_DB_MIGRATIONS=true` set in vercel.json
- [x] `scripts/vercel-build.js` does NOT run migrations

### Environment Variables (Set in Vercel Dashboard)

**Required on Vercel:**
```bash
✅ SKIP_DB_MIGRATIONS=true           # Already in vercel.json
✅ JWT_SECRET                        # Must match Render
✅ NODE_ENV=production              
✅ NEXT_PUBLIC_APP_URL              # Your Vercel domain
✅ NEXT_PUBLIC_FRONTEND_URL         # Your Vercel domain
```

**Optional (for API routes):**
```bash
DATABASE_URL                        # For Next.js API routes (read-only)
SMTP_HOST                          # If using email from frontend
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM
METAAPI_TOKEN                      # If needed in frontend
NEXT_PUBLIC_WHATSAPP_URL           # Social links
NEXT_PUBLIC_INSTAGRAM_URL          # Social links
```

### Deployment Steps for Vercel

1. **Connect Repository**
   ```
   1. Go to https://vercel.com
   2. Click "Add New Project"
   3. Import GitHub repo: kbornfas/AlgoEdge
   4. Select branch: main (or your branch)
   5. Framework: Next.js (auto-detected)
   ```

2. **Configure Build**
   ```
   Build Command: Uses vercel.json automatically
   Output Directory: .next (auto-detected)
   Install Command: npm install (auto-detected)
   ```

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above
   - Set for "Production" environment

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build

### Verification for Vercel ✅

After deployment, check Vercel logs for:
```
✅ Architecture: Frontend-only deployment
✅ Generating Prisma Client for type definitions
✅ Frontend preparation completed!
✅ Building Next.js application...
✅ Deployment completed
```

**Important - Should NOT see:**
```
❌ Running database migrations...
❌ prisma migrate deploy
❌ Applying migrations...
```

**Test frontend:**
```bash
# Visit your Vercel URL
https://your-app.vercel.app
# Should load the homepage
```

---

## 🎯 Deployment Order (CRITICAL)

### Step 1: Deploy Backend (Render) FIRST ✅
1. Push code to GitHub
2. Render detects change
3. Render runs build (including migrations)
4. Backend starts
5. **Wait for "Build completed successfully"**

### Step 2: Deploy Frontend (Vercel) SECOND ✅
1. Vercel detects same push (or trigger manually)
2. Vercel runs build (NO migrations)
3. Frontend builds
4. Frontend deployed

**Why this order?**
- Backend migrations update database schema
- Frontend needs updated schema to build correctly
- Frontend Prisma client must match backend schema

---

## 🔍 Post-Deployment Verification

### 1. Check Backend is Running
```bash
# Health check
curl https://your-backend.onrender.com/health

# Expected: {"status": "ok"}
```

### 2. Check Database Migrations Applied
```bash
# On local machine with DATABASE_URL set to production:
export DATABASE_URL="your-render-database-url"
npx prisma migrate status

# Expected: "Database schema is up to date!"
```

### 3. Check Frontend is Running
```bash
# Visit your app
https://your-app.vercel.app

# Check these pages:
- / (homepage)
- /auth/login
- /auth/register
- /dashboard (after login)
```

### 4. Check Frontend-Backend Communication
```bash
# From browser console on your frontend:
fetch('https://your-backend.onrender.com/api/some-endpoint')
  .then(r => r.json())
  .then(console.log)

# Should work without CORS errors
```

---

## 🚨 Troubleshooting

### Backend Issues

**Issue: Build fails with "DATABASE_URL not found"**
```
Solution: 
1. Verify Render PostgreSQL database is created
2. Check DATABASE_URL is set in environment variables
3. Use "Internal Database URL" from Render
```

**Issue: Migrations fail with P3005 error**
```
Solution:
1. Check Render logs for specific error
2. May need to resolve migrations manually
3. Use: npx prisma migrate resolve --applied "migration_name"
```

**Issue: Backend starts but /health returns 500**
```
Solution:
1. Check Render logs for errors
2. Verify all required environment variables are set
3. Check database connection
```

### Frontend Issues

**Issue: Build fails with Prisma client error**
```
Solution:
1. Verify backend deployed successfully first
2. Check DATABASE_URL is valid (optional for frontend)
3. Clear Vercel build cache and redeploy
```

**Issue: Build shows migration output**
```
Solution:
1. You're using old code - pull latest changes
2. Verify scripts/vercel-build.js doesn't call migrate
3. Check vercel.json has SKIP_DB_MIGRATIONS=true
```

**Issue: Frontend can't connect to backend**
```
Solution:
1. Check CORS settings on backend
2. Verify FRONTEND_URL is set correctly on Render
3. Check backend is running and accessible
```

---

## 📋 Final Checklist

Before marking deployment as complete:

### Backend (Render)
- [ ] Backend deployed successfully
- [ ] Database migrations applied (check logs)
- [ ] Health endpoint returns 200
- [ ] All environment variables set
- [ ] Logs show no errors

### Frontend (Vercel)
- [ ] Frontend deployed successfully
- [ ] Build logs show NO migration attempts
- [ ] Homepage loads correctly
- [ ] Can access login/register pages
- [ ] All environment variables set

### Integration
- [ ] Frontend can communicate with backend
- [ ] No CORS errors
- [ ] Authentication works
- [ ] Database queries work from frontend API routes

---

## 🎉 Success Criteria

Both deployments are successful when:

✅ Backend on Render shows "Backend server started"  
✅ Database migrations completed successfully  
✅ Frontend on Vercel shows homepage  
✅ No migration commands in Vercel logs  
✅ Users can register/login  
✅ Dashboard loads correctly after login  
✅ No console errors in browser  

---

## 📞 Support

If you encounter issues not covered here:

1. Check deployment logs (Render/Vercel dashboards)
2. Review [BACKEND_RENDER_FRONTEND_VERCEL.md](./BACKEND_RENDER_FRONTEND_VERCEL.md)
3. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
4. Check [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md)

---

**Deployment Status:** ✅ Ready for Production  
**Last Updated:** January 3, 2026  
**Architecture:** Backend (Render) + Frontend (Vercel) - Fully Separated
