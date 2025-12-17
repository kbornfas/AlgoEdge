# AlgoEdge Setup Guide

Complete step-by-step guide to set up and run AlgoEdge locally and in production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Running the Application](#running-the-application)
6. [Admin Setup](#admin-setup)
7. [Testing the Platform](#testing-the-platform)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0.0 or higher (comes with Node.js)
- **PostgreSQL** 15.0 or higher ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

### Required Accounts

- **GitHub Account** (for repository access)
- **MetaAPI Account** ([Sign up](https://metaapi.cloud/)) - For MT5 trading
- **Email Provider** (Gmail, SendGrid, etc.) - For notifications
- **Vercel Account** (optional - for deployment)

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/kbornfas/AlgoEdge.git
cd AlgoEdge
```

### 2. Install Dependencies

```bash
npm install
```

This will:
- Install all required npm packages
- Automatically generate Prisma client (via postinstall script)
- Set up TypeScript configurations

---

## Database Configuration

### Option 1: Local PostgreSQL

1. **Install PostgreSQL** (if not installed)
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Mac: `brew install postgresql@15`
   - Linux: `sudo apt-get install postgresql-15`

2. **Start PostgreSQL Service**
   ```bash
   # Windows (as Administrator)
   net start postgresql-x64-15
   
   # Mac
   brew services start postgresql@15
   
   # Linux
   sudo service postgresql start
   ```

3. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE algoedge;
   
   # Create user (optional)
   CREATE USER algoedge_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE algoedge TO algoedge_user;
   
   # Exit
   \q
   ```

4. **Get Connection String**
   ```
   postgresql://postgres:password@localhost:5432/algoedge
   # OR with custom user
   postgresql://algoedge_user:your_password@localhost:5432/algoedge
   ```

### Option 2: Cloud PostgreSQL (Recommended for Production)

#### Render PostgreSQL (Free Tier)
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Fill in database details
4. Copy the **Internal Database URL**

#### Neon PostgreSQL (Free Tier)
1. Go to [Neon Console](https://console.neon.tech/)
2. Create new project
3. Copy connection string

---

## Environment Variables

### 1. Create .env File

```bash
cp .env.example .env
```

### 2. Configure Required Variables

Edit `.env` with your values:

```env
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@localhost:5432/algoedge?schema=public"

# JWT Secret (REQUIRED) - Generate with: openssl rand -base64 32
JWT_SECRET="your-generated-secret-key-here"
JWT_EXPIRES_IN="7d"

# Email Service (REQUIRED for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="AlgoEdge <noreply@algoedge.com>"

# App URLs (Update for production)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_FRONTEND_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"

# External Links (REQUIRED)
NEXT_PUBLIC_WHATSAPP_URL="https://wa.me/your_number"
NEXT_PUBLIC_INSTAGRAM_URL="https://instagram.com/your_account"

# MetaAPI (REQUIRED for real trading)
METAAPI_TOKEN="your-metaapi-token"
METAAPI_ACCOUNT_ID="your-metaapi-account-id"

# Admin Configuration (Change in production!)
ADMIN_EMAIL="kbonface03@gmail.com"
ADMIN_PASSWORD="BRBros@1234"

# Payment
PAYMENT_WHATSAPP_NUMBER="your_payment_whatsapp_number"
```

### 3. Generate JWT Secret

```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy the output to `JWT_SECRET` in `.env`

### 4. Configure Gmail for Email

1. Enable 2-Factor Authentication on your Google Account
2. Go to Security → 2-Step Verification → App Passwords
3. Select "Mail" and "Other"
4. Copy the 16-character password
5. Add to `.env`:
   ```env
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-16-char-app-password"
   ```

---

## Running the Application

### 1. Initialize Database

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

You should see:
```
✅ Admin user created successfully
📧 Email: kbonface03@gmail.com
🔑 Password: BRBros@1234

✅ Scalper Pro M1 (M1) - Win Rate: 68.5%
✅ Scalper Elite M5 (M5) - Win Rate: 72.3%
... (10 robots total)
```

### 2. Start Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`

---

## Admin Setup

### 1. Access Admin Panel

Navigate to: `http://localhost:3000/admin/login`

Login with:
- **Email:** kbonface03@gmail.com
- **Password:** BRBros@1234

⚠️ **IMPORTANT:** Change the admin password immediately after first login!

### 2. Admin Dashboard Features

- **Users Tab:** View and manage all users
- **Payment Proofs Tab:** Review and approve payment submissions
- **User Activation:** Enable/disable user access
- **Payment Review:** Approve or reject payment proofs

---

## Testing the Platform

### Test User Registration Flow

1. **Register New User**
   - Go to `http://localhost:3000/auth/register`
   - Fill in registration form
   - Submit

2. **Verify Email** (Development Mode)
   - Check terminal/console for verification link
   - Click link or copy to browser

3. **Login**
   - Go to `http://localhost:3000/auth/login`
   - Enter credentials
   - Should see payment activation alert

4. **Submit Payment Proof**
   - Click "Submit Payment" button in dashboard
   - Or go to `http://localhost:3000/payment-proof`
   - Upload screenshot URL
   - Submit

5. **Admin Approval**
   - Login to admin panel
   - Go to "Payment Proofs" tab
   - Click "Review" on submission
   - Approve payment

6. **Access Trading Features**
   - Logout and login as user again
   - Dashboard should show activated status
   - Access robots at `http://localhost:3000/dashboard/robots`
   - Enable/disable trading robots

### Test Trading Robots

1. Navigate to `/dashboard/robots`
2. Toggle switch to enable a robot
3. Robot card should show "🟢 Robot is active and trading"
4. Check dashboard for stats

---

## Production Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed production deployment instructions.

### Quick Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Add environment variables
   - Deploy

3. **Configure Database**
   - Use Render or Neon PostgreSQL
   - Update `DATABASE_URL` in Vercel
   - Run migrations from local:
     ```bash
     DATABASE_URL="your-production-url" npm run prisma:push
     ```

4. **Seed Production Database**
   ```bash
   DATABASE_URL="your-production-url" npm run seed:all
   ```

---

## Troubleshooting

### Build Errors

**Problem:** `prisma generate` fails

**Solution:**
```bash
rm -rf node_modules .next
npm install
npm run prisma:generate
```

### Database Connection Issues

**Problem:** Can't connect to database

**Solution:**
1. Verify PostgreSQL is running
2. Check DATABASE_URL format
3. Test connection:
   ```bash
   npx prisma db push
   ```

### Email Not Sending

**Problem:** Emails not being delivered

**Solution:**
1. Verify SMTP credentials
2. Check if 2FA is enabled (Gmail)
3. Check spam folder
4. Test with simple script

### Port Already in Use

**Problem:** Port 3000 is already in use

**Solution:**
```bash
# Find and kill process using port 3000
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Admin Can't Login

**Problem:** Admin credentials don't work

**Solution:**
```bash
# Re-seed admin
npm run seed:admin
```

---

## Next Steps

After successful setup:

1. ✅ Change admin password
2. ✅ Test all user flows
3. ✅ Configure MetaAPI for real trading
4. ✅ Set up production deployment
5. ✅ Configure monitoring
6. ✅ Set up backups
7. ✅ Review security settings

---

## Support

- **Documentation:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Issues:** [GitHub Issues](https://github.com/kbornfas/AlgoEdge/issues)
- **Email:** kbonface03@gmail.com

---

## License

MIT License - see [LICENSE](LICENSE) file for details
