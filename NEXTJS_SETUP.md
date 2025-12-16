# AlgoEdge - Next.js Setup Guide

## Overview

AlgoEdge has been migrated to Next.js 14 with the App Router, Material-UI, and Prisma ORM. This guide provides complete setup instructions for local development and production deployment.

## Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **Material-UI (MUI) v5** - Component library with custom dark theme
- **TypeScript** - Type safety
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless backend functions
- **PostgreSQL** - Primary database
- **Prisma ORM** - Type-safe database access
- **JWT** - Authentication tokens
- **Nodemailer** - Email notifications
- **Speakeasy + QRCode** - 2FA implementation
- **Stripe** - Payment processing

## Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **npm** or **yarn**
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/kbornfas/AlgoEdge.git
cd AlgoEdge
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/algoedge?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Email Service (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"
SMTP_FROM="AlgoEdge <noreply@algoedge.com>"

# Stripe Payment
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# External Links
NEXT_PUBLIC_WHATSAPP_URL="https://wa.me/your_number"
NEXT_PUBLIC_INSTAGRAM_URL="https://instagram.com/your_account"

# MetaAPI (Optional)
METAAPI_TOKEN="your-metaapi-token-here"
```

### 4. Database Setup

#### Option A: Local PostgreSQL

1. **Install PostgreSQL:**
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql`
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/)

2. **Create Database:**
```bash
createdb algoedge
```

3. **Push Prisma Schema:**
```bash
npx prisma db push
```

4. **Generate Prisma Client:**
```bash
npx prisma generate
```

#### Option B: Use Docker

```bash
docker run -d \
  --name algoedge-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=algoedge \
  -p 5432:5432 \
  postgres:15
```

Then run Prisma commands:
```bash
npx prisma db push
npx prisma generate
```

### 5. Seed Database (Optional)

The trading robots are automatically seeded when you push the schema. To view your database:

```bash
npx prisma studio
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Project Structure

```
AlgoEdge/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── api/                  # API routes
│   │   │   ├── auth/             # Authentication endpoints
│   │   │   └── user/             # User management endpoints
│   │   ├── auth/                 # Auth pages (login, register)
│   │   ├── dashboard/            # Dashboard pages
│   │   ├── layout.tsx            # Root layout with MUI theme
│   │   └── page.tsx              # Landing page
│   ├── lib/                      # Utility libraries
│   │   ├── auth.ts               # JWT and password utilities
│   │   ├── email.ts              # Email service
│   │   ├── middleware.ts         # API middleware
│   │   ├── prisma.ts             # Prisma client
│   │   └── twoFactor.ts          # 2FA utilities
│   ├── theme/                    # MUI theme configuration
│   │   └── theme.ts              # Dark theme with blue accents
├── prisma/
│   └── schema.prisma             # Database schema
├── old-vite-app/                 # Backup of original Vite app
├── backend/                      # Old Express backend (reference)
├── .env                          # Environment variables
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript configuration
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm start                # Start production server

# Database
npx prisma studio        # Open database GUI
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma migrate dev   # Create migration

# Code Quality
npm run lint             # Run ESLint
```

## API Endpoints

### Authentication

- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login (with optional 2FA)
- **POST** `/api/auth/verify` - Verify email
- **POST** `/api/auth/reset-password` - Request password reset or reset with token
- **POST** `/api/auth/2fa/setup` - Generate 2FA secret and QR code
- **POST** `/api/auth/2fa/verify` - Verify and enable 2FA
- **POST** `/api/auth/2fa/disable` - Disable 2FA

### User Management

- **GET** `/api/user/profile` - Get user profile
- **PUT** `/api/user/profile` - Update user profile

### Example API Call

```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  }),
});

const data = await response.json();
// Save token: localStorage.setItem('token', data.token);
```

## Email Configuration

### Gmail Setup

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password:
   - Go to Google Account Settings → Security
   - Under "How you sign in to Google," select 2-Step Verification
   - At the bottom, select App passwords
   - Create a new app password for "Mail"
3. Use the generated password in `SMTP_PASS`

### SendGrid Setup

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

## Two-Factor Authentication

### Setup Flow

1. User enables 2FA in settings
2. Backend generates secret and QR code
3. User scans QR with Google Authenticator / Authy
4. User enters 6-digit code to verify
5. 2FA is enabled for the account

### Login with 2FA

1. User enters email and password
2. If 2FA enabled, backend returns `requires2FA: true`
3. Frontend shows 2FA code input
4. User enters 6-digit code
5. Backend verifies code and returns JWT

## Deployment

### Vercel (Frontend)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel
```

3. **Environment Variables:**
   - Add all env vars in Vercel dashboard
   - Ensure `DATABASE_URL` points to production database

### Render (Backend Alternative)

While Next.js API routes run on Vercel, you can optionally deploy a separate backend:

1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: `npm install && npx prisma generate`
4. Set start command: `npm start`
5. Add environment variables

### Database (Railway/Supabase/Heroku)

#### Railway
```bash
railway login
railway init
railway add --database postgresql
```

#### Supabase
1. Create new project at [supabase.com](https://supabase.com)
2. Copy connection string to `DATABASE_URL`

## Security Best Practices

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Use production database (not localhost)
- [ ] Enable HTTPS (handled by Vercel/Render)
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS properly
- [ ] Set up rate limiting (if using separate backend)
- [ ] Enable Stripe webhook signature verification
- [ ] Review and limit API permissions
- [ ] Set up monitoring and logging
- [ ] Configure database backups

### Environment Variables

**Never commit:**
- `.env` file
- Any file with real credentials
- JWT secrets
- API keys

## Testing

### Test Registration Flow

1. Go to `/auth/register`
2. Fill in user details
3. Check email for verification link
4. Click link to verify
5. Login at `/auth/login`

### Test 2FA

1. Login to dashboard
2. Go to Settings → Security
3. Click "Enable 2FA"
4. Scan QR code with authenticator app
5. Enter 6-digit code
6. 2FA is now enabled
7. Logout and login again to test

## Common Issues

### Database Connection Failed

**Error:** `Can't reach database server`

**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify `DATABASE_URL` format
3. Check database exists: `psql -l`

### Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

**Solution:**
```bash
npx prisma generate
npm run build
```

### Email Not Sending

**Error:** Email verification not received

**Solution:**
1. Check SMTP credentials
2. Verify Gmail app password (not regular password)
3. Check spam folder
4. Test with `curl` or Postman

### Build Fails

**Error:** TypeScript errors

**Solution:**
```bash
rm -rf .next
npm install
npx prisma generate
npm run build
```

## Additional Features to Implement

### Phase 1 (Core - In Progress)
- ✅ Authentication (register, login, email verify, password reset)
- ✅ Two-factor authentication (2FA)
- ✅ User profile management
- ⏳ Settings page with 2FA toggle
- ⏳ MT5 account connection
- ⏳ Trading robots management
- ⏳ Trade history

### Phase 2 (Coming Soon)
- [ ] Real-time WebSocket updates
- [ ] Stripe subscription integration
- [ ] MT5 connection with MetaAPI
- [ ] Trading robot start/stop controls
- [ ] Trade execution and monitoring
- [ ] Performance analytics

### Phase 3 (Future)
- [ ] Advanced charting
- [ ] Backtesting engine
- [ ] Strategy builder
- [ ] Mobile app
- [ ] Multi-language support

## Support

For issues and questions:
- GitHub Issues: [kbornfas/AlgoEdge/issues](https://github.com/kbornfas/AlgoEdge/issues)
- Email: support@algoedge.com
- WhatsApp: Configure in `.env`

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ using Next.js, Material-UI, and Prisma**
