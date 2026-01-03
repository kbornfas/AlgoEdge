# ⚡ Quick Deployment Checklist

**Use this checklist before ANY deployment to ensure payment_proofs table issues never occur again.**

## Pre-Deployment Validation

### 1. Schema Validation
```bash
# Verify PaymentProof model in schema
grep -A 20 "model PaymentProof" prisma/schema.prisma
```

Expected: Model should have `id`, `createdAt`, `userId`, `proofUrl`, `status` fields.

### 2. Migration Files Validation
```bash
# Verify all migration files exist
ls -la prisma/migrations/
```

Required migrations:
- ✅ `20260102090000_init/` - Initial schema
- ✅ `20260102090350_add_approval_status_and_rejection_reason/`
- ✅ `20260103113015_add_created_at_to_payment_proofs/` - Adds createdAt field

### 3. Local Database Test

```bash
# Set DATABASE_URL in .env
export DATABASE_URL="postgresql://user:pass@localhost:5432/algoedge"

# Generate Prisma Client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate:deploy

# Validate payment_proofs table
npm run db:validate-payment-proofs
```

Expected output:
```
✅ DATABASE_URL is set
✅ Database connection successful
✅ payment_proofs table exists
✅ All required columns present
✅ All Validations Passed!
```

### 4. Build Test

```bash
# Test build with production-like environment
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
JWT_SECRET="test-secret-for-build-only" \
npm run build
```

Should complete without errors.

## Deployment Steps

### For Vercel

1. **Environment Variables** (in Vercel dashboard):
   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public
   JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   # ... other required vars
   ```

2. **Deploy**:
   - Push to branch
   - Vercel auto-deploys
   - `vercel-build.js` runs automatically and:
     - ✅ Validates DATABASE_URL
     - ✅ Tests connection
     - ✅ Runs migrations
     - ✅ Verifies payment_proofs table
     - ✅ Handles conflicts

3. **Verify**:
   ```bash
   vercel env pull .env.production
   npm run db:validate-payment-proofs
   ```

### For Railway/Render

1. **Build Command**:
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy && npm run build
   ```

2. **Start Command**:
   ```bash
   npm start
   ```

3. **Verify**:
   - Check build logs for migration success
   - Visit `/api/health` endpoint
   - Test user registration flow

## Post-Deployment Validation

### 1. Health Check
```bash
curl https://your-domain.vercel.app/api/health
```

### 2. Database Validation
```bash
# Pull production env
vercel env pull .env.production

# Validate
npm run db:validate-payment-proofs
```

### 3. Smoke Tests

Test these critical flows:
- [ ] User registration works
- [ ] Payment proof upload works
- [ ] Admin can view payment proofs
- [ ] User activation works after approval

## Troubleshooting

### Issue: "Missing required tables: payment_proofs"

**Quick Fix:**
```bash
# Check migration status
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy

# If tables exist but migrations show as failed:
npx prisma migrate resolve --applied "20260102090000_init"
npx prisma migrate resolve --applied "20260102090350_add_approval_status_and_rejection_reason"
npx prisma migrate resolve --applied "20260103113015_add_created_at_to_payment_proofs"

# Then retry deploy
npx prisma migrate deploy
```

**See**: [PAYMENT_PROOFS_TABLE.md](./PAYMENT_PROOFS_TABLE.md) for detailed troubleshooting.

### Issue: Migration Fails During Build

**Cause**: Database already has tables but migrations not recorded.

**Fix**:
1. SSH into deployment environment (or use Vercel CLI)
2. Run migration resolution:
   ```bash
   npx prisma migrate resolve --applied "20260102090000_init"
   npx prisma migrate deploy
   ```

### Issue: Build Succeeds But App Crashes

**Cause**: Runtime database connection issue.

**Fix**:
1. Verify DATABASE_URL is correct
2. Check database is accessible from deployment
3. Verify connection string format:
   ```
   postgresql://user:password@host:5432/database?schema=public
   ```

## Manual Validation

Before deploying, manually verify:
- ✅ Run migrations against test database locally
- ✅ Verify payment_proofs table exists
- ✅ Validate required columns present
- ✅ Test database connectivity
- ✅ Run build locally to catch errors early

Use `npm run vercel:build` to test the frontend build process locally (this runs `scripts/vercel-build.js` which generates Prisma client without running migrations).

## Documentation References

- 📘 [PAYMENT_PROOFS_TABLE.md](./PAYMENT_PROOFS_TABLE.md) - Complete table documentation
- 📘 [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Full deployment guide
- 📘 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - General troubleshooting
- 📘 [PRISMA_MIGRATION_GUIDE.md](./PRISMA_MIGRATION_GUIDE.md) - Migration guide

## Quick Commands Reference

```bash
# Validate locally
npm run db:validate-payment-proofs

# Check migration status
npm run prisma:migrate:status

# Apply migrations
npm run prisma:migrate:deploy

# Generate Prisma Client
npm run prisma:generate

# Seed database
npm run seed:admin
npm run seed:robots

# Build application
npm run build

# Start production
npm start
```

---

**✅ If all checks pass, your deployment will succeed!**

**Last Updated**: January 3, 2026  
**Maintainer**: AlgoEdge Development Team
