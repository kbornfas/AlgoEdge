# Vercel Configuration Notes

## ⚠️ CRITICAL: Frontend ONLY Deployment

This `vercel.json` configures **frontend deployment only**.

**Important:**
- **NO database migrations** run on Vercel
- Migrations run on **Render (backend)** only
- See `BACKEND_RENDER_FRONTEND_VERCEL.md` for complete architecture

## Configuration

- **Build Command:** `node scripts/vercel-build.js && npm run build`
  - Generates Prisma Client (types only)
  - Builds Next.js application
  - Does NOT run migrations

- **Environment Variable:** `SKIP_DB_MIGRATIONS=true`
  - Explicitly indicates no migrations

## Deployment Order

1. **Backend (Render)** deploys first → runs migrations
2. **Frontend (Vercel)** deploys second → uses updated schema

## Documentation

- [BACKEND_RENDER_FRONTEND_VERCEL.md](./BACKEND_RENDER_FRONTEND_VERCEL.md)
- [DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)
- [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md)
