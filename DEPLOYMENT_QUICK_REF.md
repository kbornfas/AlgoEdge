# Quick Reference: Deployment & Migrations

## 🎯 Architecture at a Glance

```
┌─────────────────┐         ┌─────────────────┐
│  Vercel         │         │  Render         │
│  (Frontend)     │         │  (Backend)      │
├─────────────────┤         ├─────────────────┤
│ Next.js Build   │         │ Express API     │
│ Prisma Generate │◄────────┤ DB Migrations ✅│
│ (Read-only)     │         │ Schema Mgmt     │
└─────────────────┘         └─────────────────┘
                                     │
                            ┌────────▼────────┐
                            │   PostgreSQL    │
                            │   (Render DB)   │
                            └─────────────────┘
```

## 📋 Deployment Checklist

### Before Deploying

- [ ] Commit all migration files to git
- [ ] Test migrations locally: `npm run prisma:migrate:status`
- [ ] Review schema changes for breaking changes
- [ ] Update environment variables if needed

### Deployment Order

1. **Backend (Render)** deploys first - runs migrations
2. **Frontend (Vercel)** deploys second - uses updated schema

## 🚀 Common Commands

### Local Development

```bash
# Create a new migration
npx prisma migrate dev --name add_feature_x

# Check migration status
npm run prisma:migrate:status

# Generate Prisma Client
npm run prisma:generate

# Test Vercel build locally
npm run vercel:build
```

### Production (Render)

```bash
# Run on Render backend deployment (automated)
npm run render:migrate

# Equivalent to:
npx prisma migrate deploy
```

## 🔍 What Runs Where

### Vercel (Frontend)
```bash
# Build command:
node scripts/vercel-build.js && npm run build

# What happens:
✅ Generates Prisma Client
❌ NO migrations
✅ Builds Next.js app
```

### Render (Backend)
```bash
# Build command (from render.yaml):
npm ci --prefix . &&
npm ci --prefix backend &&
npx prisma generate &&
npx prisma migrate deploy

# What happens:
✅ Installs dependencies
✅ Generates Prisma Client
✅ Runs ALL migrations
✅ Starts Express backend
```

## 🐛 Troubleshooting

### "prisma migrate deploy failed"
- Check DATABASE_URL is set correctly on Render
- Verify all migration files are committed to git
- Check Render build logs for specific error

### "Table doesn't exist" error on frontend
- Backend deployment may have failed
- Migrations didn't run successfully
- Check Render logs for migration errors

### "P3005 error" during migration
- Run: `npm run migrate:resolve-p3005 -- --auto`
- This marks existing migrations as applied
- Then redeploy backend

### Vercel build showing migration output
- You're using old `vercel-build.js`
- Pull latest changes from main branch
- Verify `scripts/vercel-build.js` doesn't call `migrate deploy`

## 📚 Documentation

- [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md) - Complete architecture guide
- [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) - Backend deployment
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Full deployment guide
- [VERCEL_DEPLOYMENT_FIX.md](./VERCEL_DEPLOYMENT_FIX.md) - Frontend deployment

## ⚠️ Important Rules

1. **NEVER** run migrations on Vercel
2. **ALWAYS** deploy backend before frontend
3. **ALWAYS** commit migration files
4. **NEVER** use `prisma db push` in production
5. **ALWAYS** test migrations in staging first

## 🔐 Environment Variables

### Vercel (Frontend)
- `DATABASE_URL` - Optional, read-only access
- `SKIP_DB_MIGRATIONS=true` - Prevent migrations

### Render (Backend)
- `DATABASE_URL` - Required, full access
- Other backend-specific variables

## 📞 Need Help?

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review deployment logs (Vercel/Render dashboards)
3. Verify environment variables are set
4. Check migration status: `npx prisma migrate status`

---

**Last Updated:** January 3, 2026
**Version:** 2.0 (Architecture Separation)
