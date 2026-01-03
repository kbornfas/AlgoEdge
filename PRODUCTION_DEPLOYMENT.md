# AlgoEdge Production Deployment Checklist

## ✅ Pre-Deployment Verification

### Code Quality
- [x] All builds passing (`npm run build`)
- [x] No TypeScript errors
- [x] ESLint configured and passing
- [x] No security vulnerabilities (CodeQL scan passed)
- [x] Code review completed
- [x] Git repository clean (no build artifacts)

### Security
- [x] Security headers configured in `next.config.js`
- [x] No hardcoded secrets in code
- [x] `.env.example` updated with all variables
- [x] JWT secret generation documented
- [x] Password hashing using bcrypt (12 rounds)
- [x] API routes use proper authentication
- [x] Error messages don't expose sensitive data
- [x] CORS configuration ready for production

### UI/UX
- [x] Custom 404 error page created
- [x] Custom error boundary page created
- [x] Loading states implemented
- [x] Responsive design (Material-UI handles this)
- [x] SEO metadata configured
- [x] Manifest.json for PWA support
- [x] Favicon configured

### Documentation
- [x] README.md updated with latest features
- [x] DEPLOYMENT_GUIDE.md exists
- [x] .env.example comprehensive
- [x] Security best practices documented
- [x] API endpoints documented

---

## 🚀 Deployment Steps

### 1. Database Setup (Required First)

**Option A: Render PostgreSQL (Recommended)**
1. Create account at https://render.com
2. Create new PostgreSQL database
3. Copy the **Internal Database URL**
4. Save for environment variables

**Option B: Neon PostgreSQL (Free Tier)**
1. Create account at https://neon.tech
2. Create new project
3. Copy connection string
4. Save for environment variables

### 2. Vercel Deployment

#### A. Connect Repository
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import `kbornfas/AlgoEdge` repository
4. Select `copilot/audit-finalize-website-deployment` branch

#### B. Configure Build Settings
- **Framework Preset**: Next.js
- **Build Command**: Automatically configured in `vercel.json` to run `prisma migrate deploy && npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

**CRITICAL**: The build command ensures all database migrations are applied before building the application. This includes creating the `payment_proofs` table which is **required** for deployment.

**Migration Validation**: The `vercel-build.js` script:
1. ✅ Validates DATABASE_URL is set
2. ✅ Tests database connectivity
3. ✅ Runs `npx prisma migrate deploy`
4. ✅ Verifies **payment_proofs** table exists
5. ✅ Handles migration conflicts with `prisma migrate resolve`

**See**: [PAYMENT_PROOFS_TABLE.md](./PAYMENT_PROOFS_TABLE.md) for complete troubleshooting guide.

#### C. Environment Variables (Critical!)

Add these in Vercel dashboard under "Environment Variables":

```bash
# Database (Required)
DATABASE_URL=postgresql://user:password@host:5432/algoedge?schema=public

# JWT Secret (Required - Generate new one!)
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-generated-secret-64-characters-minimum

# Email Service (Required for user registration)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=AlgoEdge <noreply@algoedge.com>

# App URLs (Update with your Vercel domain)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://your-domain.vercel.app

# Social Links (Required for CTAs)
NEXT_PUBLIC_WHATSAPP_URL=https://wa.me/1234567890
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/your_account

# MetaAPI (Required for trading)
METAAPI_TOKEN=your-metaapi-token
METAAPI_ACCOUNT_ID=your-metaapi-account-id

# Admin Credentials (CHANGE THESE!)
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-strong-admin-password

# Payment Settings
PAYMENT_WHATSAPP_NUMBER=1234567890
PAYMENT_PROOF_REQUIRED=true

# Production Environment
NODE_ENV=production
```

#### D. Deploy
1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Note your deployment URL

#### E. Verify Deployment Success

**CRITICAL**: After deployment, verify the payment_proofs table exists:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login and link to your project
vercel login
vercel link

# Pull production environment variables
vercel env pull .env.production

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

If validation fails, see [PAYMENT_PROOFS_TABLE.md](./PAYMENT_PROOFS_TABLE.md) for troubleshooting.

### 3. Post-Deployment Setup

#### A. Database Initialization

**IMPORTANT**: Migrations are automatically run during Vercel deployment via the `buildCommand` in `vercel.json`. However, if you need to manually initialize or seed the database, follow these steps:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Pull environment variables (this creates .env.local with production DATABASE_URL)
vercel env pull .env.local

# Generate Prisma Client (should already be done by postinstall)
npm run prisma:generate

# Note: Migrations are automatically applied during build
# If you need to manually apply migrations (should not be necessary):
# npm run prisma:migrate:deploy

# Seed database (use local .env.local)
npm run seed:admin
npm run seed:robots
```

**Migration Notes**:
- ✅ Migrations are automatically deployed during the Vercel build process
- ✅ The `buildCommand` in `vercel.json` runs `prisma migrate deploy` before building
- ✅ Never use `prisma db push` in production as it may cause data loss
- ✅ All migrations in `prisma/migrations` are version-controlled and applied in order
- ✅ The **payment_proofs** table is created by migrations `20260102090000_init` and `20260103113015_add_created_at_to_payment_proofs`
- ✅ Migration conflicts are automatically resolved by `vercel-build.js` using `prisma migrate resolve`
- ⚠️  If deployment fails with "Missing required tables: payment_proofs", see [PAYMENT_PROOFS_TABLE.md](./PAYMENT_PROOFS_TABLE.md)

#### B. Test Admin Access
1. Go to `https://your-domain.vercel.app/admin/login`
2. Login with admin credentials from environment variables
3. Verify admin dashboard loads

#### C. Test User Registration
1. Go to `https://your-domain.vercel.app/auth/register`
2. Create test account
3. Check email for verification link
4. Verify email arrives correctly

#### D. Configure Custom Domain (Optional)
1. In Vercel dashboard, go to "Settings" > "Domains"
2. Add your custom domain
3. Update DNS records as instructed
4. Update environment variables with new domain

---

## 🔍 Post-Deployment Testing

### Critical Paths to Test
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] Email verification received
- [ ] User login successful
- [ ] Dashboard displays correctly
- [ ] Payment proof submission works
- [ ] Admin login works
- [ ] Admin can approve payments
- [ ] Robot management functional
- [ ] WhatsApp/Instagram CTAs work
- [ ] 404 page displays
- [ ] Error handling works

### Performance Checks
- [ ] Page load time < 3 seconds
- [ ] Lighthouse score > 85
- [ ] Mobile responsive
- [ ] No console errors
- [ ] API responses < 500ms

---

## 🔧 Troubleshooting

### Build Fails
- Check all environment variables are set
- Verify DATABASE_URL is correct
- Check Vercel build logs for specific errors

### Database Connection Errors
- Verify DATABASE_URL format
- Check database is accepting external connections
- Ensure Prisma client is generated

### Email Not Sending
- Verify SMTP credentials
- For Gmail, use App Password not regular password
- Check spam folder
- Verify SMTP_HOST and SMTP_PORT

### Admin Can't Login
- Verify ADMIN_EMAIL and ADMIN_PASSWORD in environment
- Check if admin user was seeded
- Run seed script manually if needed

### API Routes Returning 500
- Check Vercel function logs
- Verify environment variables
- Check database connection
- Review API route error logs

---

## 📊 Monitoring Setup (Recommended)

### Vercel Analytics
- Enable in Vercel dashboard
- Track page views and performance

### Error Tracking (Optional)
Consider integrating:
- Sentry (https://sentry.io)
- LogRocket (https://logrocket.com)
- Rollbar (https://rollbar.com)

### Uptime Monitoring (Optional)
- UptimeRobot (https://uptimerobot.com)
- Pingdom (https://pingdom.com)

---

## 🔐 Security Reminders

1. **Change Default Admin Password** - First thing after deployment!
2. **Rotate JWT Secret** - Regularly update in production
3. **Monitor Audit Logs** - Check for suspicious activity
4. **Keep Dependencies Updated** - Run `npm audit` weekly
5. **Backup Database** - Set up automated backups
6. **Use HTTPS** - Vercel provides this automatically
7. **Rate Limiting** - Consider adding Vercel rate limiting

---

## 📈 Scaling Considerations

### When to Scale Database
- More than 1000 active users
- Slow query performance
- Connection pool exhausted

### When to Upgrade Vercel Plan
- More than 100GB bandwidth/month
- Need faster builds
- Need more concurrent builds
- Custom domains on free tier

### Performance Optimization
- Enable Vercel Edge Functions for API routes
- Add Redis for session management
- Implement CDN for static assets
- Add database read replicas

---

## 🎉 Launch Checklist

- [ ] All environment variables configured
- [ ] Database seeded with admin and robots
- [ ] Admin login working
- [ ] User registration working
- [ ] Email delivery working
- [ ] Payment flow tested
- [ ] Social media CTAs working
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Monitoring enabled
- [ ] Team trained on admin panel
- [ ] Support channels ready
- [ ] Marketing materials prepared
- [ ] Launch announcement ready

---

## 📞 Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **MetaAPI Support**: https://metaapi.cloud/docs

---

**Good luck with your deployment! 🚀📈**

For issues or questions, refer to TROUBLESHOOTING.md or contact the development team.
