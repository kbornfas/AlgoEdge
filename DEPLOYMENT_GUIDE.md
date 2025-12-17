# AlgoEdge Deployment Guide

Complete guide for deploying AlgoEdge to production with Vercel (frontend) and Render (backend).

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Vercel Deployment](#vercel-deployment)
- [Backend Deployment](#backend-deployment)
- [Post-Deployment](#post-deployment)

---

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Render account (or Railway/Heroku)
- PostgreSQL database (Render provides free PostgreSQL)
- SMTP email service (Gmail, SendGrid, etc.)
- MetaAPI account (for MT5 trading)

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/kbornfas/AlgoEdge.git
cd AlgoEdge
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/algoedge?schema=public"

# JWT Authentication
JWT_SECRET="your-generated-secret-key"
JWT_EXPIRES_IN="7d"

# Email Service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="AlgoEdge <noreply@algoedge.com>"

# App URLs
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_FRONTEND_URL="https://your-domain.vercel.app"

# External Links
NEXT_PUBLIC_WHATSAPP_URL="https://wa.me/your_number"
NEXT_PUBLIC_INSTAGRAM_URL="https://instagram.com/your_account"

# MetaAPI
METAAPI_TOKEN="your-metaapi-token"
METAAPI_ACCOUNT_ID="your-metaapi-account-id"

# Admin
ADMIN_EMAIL="kbonface03@gmail.com"
ADMIN_PASSWORD="BRBros@1234"

# Payment
PAYMENT_WHATSAPP_NUMBER="your_payment_number"
```

---

## Database Setup

### Option 1: Render PostgreSQL (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Fill in:
   - **Name**: algoedge-db
   - **Database**: algoedge
   - **User**: algoedge
   - **Region**: Choose closest to you
   - **Plan**: Free (for testing) or Starter ($7/mo for production)
4. Click "Create Database"
5. Copy the **Internal Database URL** (starts with `postgresql://`)
6. Add to `.env` as `DATABASE_URL`

### Option 2: Neon PostgreSQL (Free Tier)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create new project
3. Copy connection string
4. Add to `.env` as `DATABASE_URL`

### Initialize Database

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Seed admin user
npm run seed:admin

# Seed trading robots
npm run seed:robots
```

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
5. Add Environment Variables:
   - Click "Environment Variables"
   - Add all variables from `.env.example`
   - Make sure to use production URLs
6. Click "Deploy"

### 3. Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Backend Deployment (if using separate backend)

### Option 1: Deploy Backend on Render

If you have a separate Express backend in the `backend/` folder:

1. Create `render.yaml` in root:

```yaml
services:
  - type: web
    name: algoedge-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: NODE_ENV
        value: production
```

2. Push to GitHub
3. Go to Render Dashboard
4. Click "New +" → "Blueprint"
5. Connect repository
6. Render will auto-deploy

### Option 2: Deploy as Monorepo

If using Next.js API routes (recommended for this project):
- No separate backend deployment needed
- All API routes are in `src/app/api/`
- They deploy automatically with Vercel

---

## Post-Deployment

### 1. Verify Database

```bash
# Check if database is accessible
npx prisma studio
```

### 2. Test Admin Login

1. Go to `https://your-domain.vercel.app/admin/login`
2. Login with:
   - Email: `kbonface03@gmail.com`
   - Password: `BRBros@1234`
3. Verify admin dashboard loads

### 3. Test User Registration

1. Register a new test account
2. Check if verification email is sent
3. Submit payment proof
4. Approve as admin
5. Verify user can access dashboard

### 4. Configure Email Service

#### Gmail Setup

1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate App Password:
   - Go to Security → 2-Step Verification → App Passwords
   - Select "Mail" and "Other"
   - Copy the 16-character password
4. Add to environment variables:
   ```
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-16-char-app-password"
   ```

#### SendGrid Setup (Alternative)

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create API key
3. Update environment variables:
   ```
   SMTP_HOST="smtp.sendgrid.net"
   SMTP_PORT="587"
   SMTP_USER="apikey"
   SMTP_PASS="your-sendgrid-api-key"
   ```

### 5. Configure MetaAPI

1. Sign up at [MetaAPI](https://metaapi.cloud/)
2. Create account
3. Get API token
4. Add MT5 account
5. Update environment variables:
   ```
   METAAPI_TOKEN="your-token"
   METAAPI_ACCOUNT_ID="your-account-id"
   ```

### 6. Security Checklist

- [ ] Change admin password after first login
- [ ] Generate secure JWT_SECRET (use: `openssl rand -base64 32`)
- [ ] Enable HTTPS (Vercel does this automatically)
- [ ] Set up CORS properly
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Configure database backups

### 7. Monitoring

#### Vercel Analytics

1. Go to Project Settings → Analytics
2. Enable Analytics
3. Monitor:
   - Page views
   - API response times
   - Error rates

#### Database Monitoring

1. Go to Render Dashboard → Database
2. Monitor:
   - Connection count
   - Query performance
   - Storage usage

---

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues

1. Check DATABASE_URL format
2. Verify database is running
3. Check firewall rules
4. Test connection:
   ```bash
   npx prisma db push
   ```

### Email Not Sending

1. Verify SMTP credentials
2. Check if less secure apps enabled (Gmail)
3. Test with a simple script
4. Check spam folder

### API Routes 404

1. Ensure API routes are in `src/app/api/`
2. Check route naming
3. Verify build completed successfully
4. Check Vercel function logs

---

## Scaling

### Database

- Start with Free tier
- Upgrade to Starter ($7/mo) for production
- Consider connection pooling for high traffic

### Hosting

- Vercel automatically scales
- Consider upgrading to Pro for better limits
- Enable caching where possible

### Monitoring

- Set up error tracking (Sentry)
- Configure uptime monitoring
- Set up alerts for critical errors

---

## Support

For deployment issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Check [Render Documentation](https://render.com/docs)
- Contact support@algoedge.com

---

## License

MIT License - see LICENSE file for details
