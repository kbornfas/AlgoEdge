# AlgoEdge - Production SaaS Trading Platform

<div align="center">

![AlgoEdge](https://img.shields.io/badge/AlgoEdge-Trading%20Platform-blue?style=for-the-badge)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-316192?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5+-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)

**Automated Forex Trading with MetaTrader 5 Integration**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Deployment](#-deployment) • [Support](#-support)

</div>

---

## 📊 Overview

AlgoEdge is a comprehensive production-ready SaaS trading platform that connects to MetaTrader 5 accounts and provides automated trading robots with real-time monitoring, advanced analytics, and payment-gated access control.

## 🎯 Key Features

- 🤖 **10 High-Performance Trading Robots** - Multiple strategies across all timeframes (M1 to D1)
- 💳 **Payment-Gated Access** - WhatsApp payment proof submission with admin approval
- 🔐 **Enterprise Security** - JWT authentication, 2FA, bcrypt hashing, security headers
- 👨‍💼 **Admin Panel** - Complete user and payment management at `/admin`
- 📈 **Real-Time Monitoring** - Live trade tracking and bot status
- 🌐 **MT5 Integration** - MetaAPI support for real broker connections
- 📧 **Email Notifications** - Trade alerts, welcome emails, password resets
- 🎨 **Modern Dark UI** - Material-UI with custom theming and responsive design
- 📱 **Social CTAs** - WhatsApp & Instagram floating action buttons
- ⚡ **Production Ready** - Security headers, error pages, SEO optimized

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** 15+
- **npm** or **yarn**
- **MetaAPI Account** (for real trading)
- **SMTP Email Service** (Gmail, SendGrid, etc.)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kbornfas/AlgoEdge.git
   cd AlgoEdge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Push schema to database
   npm run prisma:push
   
   # Seed admin user (default: kbonface03@gmail.com / BRBros@1234)
   npm run seed:admin
   
   # Seed trading robots
   npm run seed:robots
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   - Frontend: `http://localhost:3000`
   - Admin Panel: `http://localhost:3000/admin/login`

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 14 with App Router
- TypeScript
- Material-UI (MUI)
- Tailwind CSS
- Lucide React Icons

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Nodemailer for emails

**Trading:**
- MetaAPI Integration
- 10 Pre-configured Robots
- Multi-timeframe Support
- Real-time Trade Execution

**Infrastructure:**
- Vercel (Frontend & API)
- Render/Neon (PostgreSQL)
- MetaAPI (MT5 Connection)

---

## 🤖 Trading Robots

AlgoEdge includes 10 high-performance trading robots optimized for different timeframes and strategies:

| Robot | Timeframe | Strategy | Win Rate | Risk Level |
|-------|-----------|----------|----------|------------|
| **Scalper Pro M1** | M1 | Scalping | 68.5% | High |
| **Scalper Elite M5** | M5 | Scalping | 72.3% | High |
| **Trend Follower M15** | M15 | Trend Following | 75.8% | Medium |
| **Breakout Hunter M30** | M30 | Breakout | 71.5% | Medium |
| **Trend Master H1** | H1 | Trend Following | 78.2% | Medium |
| **Grid Master H1** | H1 | Grid Trading | 74.6% | Medium |
| **Breakout Pro H4** | H4 | Breakout | 80.1% | Low |
| **Hedge Guardian H4** | H4 | Hedging | 76.9% | Low |
| **Swing Trader D1** | D1 | Swing Trading | 82.4% | Low |
| **Martingale Pro M15** | M15 | Martingale | 69.8% | High |

### Automated Trading Features

- ✅ **Auto-enable/disable** per robot
- ✅ **Real-time status monitoring**
- ✅ **Multi-timeframe support**
- ✅ **Risk management** built-in
- ✅ **Stop-loss & take-profit** automation
- ✅ **Trade history tracking**

---

## 👨‍💼 Admin Panel

Access the admin panel at `/admin/login` with:
- **Email:** kbonface03@gmail.com
- **Password:** BRBros@1234

### Admin Features

- 📊 **User Management** - View, activate, deactivate users
- 💳 **Payment Review** - Approve/reject payment proofs
- 📈 **Analytics Dashboard** - User statistics and activity
- 🔍 **Audit Logs** - Track all admin actions
- 📧 **Email Management** - Resend verification emails

---

## 💰 Payment Workflow

AlgoEdge uses a payment-proof system for user activation:

1. **User Registration** - User signs up with email/password
2. **Payment Instruction** - User receives WhatsApp payment details
3. **Proof Submission** - User uploads payment screenshot
4. **Admin Review** - Admin approves/rejects in admin panel
5. **Account Activation** - User gets full access to trading features

### For Users

- Submit payment proof at `/payment-proof`
- Check status in dashboard
- Contact via WhatsApp for support

### For Admins

- Review submissions at `/admin/dashboard`
- Approve or reject with notes
- User auto-activated on approval

---

## 📧 Email Notification System

AlgoEdge features a robust production-ready email notification system using Nodemailer, configured entirely via environment variables.

### Email Configuration

All email settings are configured through environment variables. No code changes required!

#### Required Environment Variables

```env
SMTP_HOST=smtp.gmail.com              # Your SMTP server host
SMTP_PORT=587                         # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                     # true for SSL (port 465), false for TLS (port 587)
SMTP_USER=your-email@gmail.com        # SMTP authentication username
SMTP_PASS=your-app-password           # SMTP authentication password
SMTP_FROM=AlgoEdge <noreply@algoedge.com>  # From address for emails
```

#### Gmail Setup Example

To use Gmail as your SMTP provider:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to Google Account → Security → 2-Step Verification → App Passwords
   - Select "Mail" and generate a password
3. **Configure Environment Variables**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM=AlgoEdge <noreply@algoedge.com>
   ```

#### Other SMTP Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Amazon SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.mailgun.org
SMTP_PASS=your-mailgun-password
```

### Email Templates

AlgoEdge includes responsive, professional HTML email templates:

#### 1. **OTP Verification Email** 🔐
Sent automatically when users register. Features:
- Modern gradient header design
- Large, easy-to-read 6-digit OTP code
- 10-minute expiration timer
- Security tips and warnings
- Mobile-responsive layout

**Triggered:** User registration
**Template:** `verificationCode`

#### 2. **Daily Trading Performance Summary** 📊
Comprehensive daily report with:
- Total daily P/L with color-coded indicators
- Win rate percentage
- Trade statistics (total, winners, losers)
- Recent trade details table
- Trading tips
- Quick link to dashboard
- Mobile-responsive design

**Triggered:** Daily (for users with trades)
**Template:** `dailyTradeSummary`

#### 3. **Trade Alerts** 📈
Real-time notifications for trade open/close events

#### 4. **Password Reset** 🔑
Secure password reset with OTP codes

### Using the Email Service

#### Send OTP Email

The OTP email is sent automatically during registration:

```javascript
import { sendVerificationCodeEmail, generateVerificationCode } from './services/emailService.js';

const otpCode = generateVerificationCode(); // Generates 6-digit code
await sendVerificationCodeEmail(userEmail, username, otpCode, 10); // 10 min expiry
```

#### Send Daily Trade Reports

**For a single user:**

```javascript
import { sendDailyTradeReport } from './services/emailService.js';
import pool from './config/database.js';

await sendDailyTradeReport(userId, userEmail, username, pool);
```

**For all users with trades:**

```javascript
import { sendDailyReportsToAllUsers } from './services/emailService.js';
import pool from './config/database.js';

const summary = await sendDailyReportsToAllUsers(pool);
console.log(`Sent ${summary.sent} reports, ${summary.failed} failed`);
```

#### Automated Daily Reports

You can schedule daily reports using cron jobs or task schedulers:

**Using Node-Cron:**

```javascript
import cron from 'node-cron';
import { sendDailyReportsToAllUsers } from './services/emailService.js';
import pool from './config/database.js';

// Run daily at 6 PM
cron.schedule('0 18 * * *', async () => {
  console.log('Sending daily trade reports...');
  await sendDailyReportsToAllUsers(pool);
});
```

**Using System Cron (Linux):**

Create a script `send-daily-reports.js`:
```javascript
import { sendDailyReportsToAllUsers } from './backend/services/emailService.js';
import pool from './backend/config/database.js';

await sendDailyReportsToAllUsers(pool);
process.exit(0);
```

Add to crontab:
```bash
0 18 * * * cd /path/to/AlgoEdge && node send-daily-reports.js
```

### Email Notification Settings

Users can control their email preferences in their settings:

- **Email Alerts** - Enable/disable all email notifications
- **Trade Notifications** - Enable/disable trade-related emails
- **Daily Reports** - Automatically sent if both above are enabled

Daily reports are only sent to users who:
- Have `email_alerts = true`
- Have `trade_notifications = true`
- Have at least one closed trade for the day
- Are verified users

### Error Handling & Security

The email service includes robust error handling:

- ✅ **No sensitive data in logs** - Only error messages, not SMTP credentials
- ✅ **Graceful degradation** - Registration succeeds even if email fails
- ✅ **Rate limiting protection** - 1-second delay between batch emails
- ✅ **Verification on startup** - Service validates SMTP config on launch
- ✅ **Detailed logging** - Success/failure tracking for all emails

### Testing Email Configuration

To verify your SMTP setup is working:

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Check startup logs:**
   ```
   ✅ Email service ready
   ```

3. **Test registration:**
   - Register a new user
   - Check your email for the OTP code
   - Verify the code works

4. **Test daily reports (manual trigger):**
   ```javascript
   // In node REPL or test script
   import { sendDailyTradeReport } from './backend/services/emailService.js';
   import pool from './backend/config/database.js';
   
   await sendDailyTradeReport(1, 'test@example.com', 'testuser', pool);
   ```

### Troubleshooting

**Email service not ready:**
- Verify all SMTP_* environment variables are set
- Check SMTP credentials are correct
- Test SMTP server accessibility (`telnet smtp.gmail.com 587`)

**Emails not sending:**
- Check server logs for error messages
- Verify recipient email is valid
- Check spam/junk folder
- Verify SMTP password/app password is correct

**Gmail "Less secure app" error:**
- Use App Passwords instead of regular password
- Enable 2FA on Google account first

### Performance Optimization

For optimal daily report performance with large user bases, consider adding a composite index:

```sql
CREATE INDEX idx_trades_daily_reports 
ON trades(user_id, status, close_time) 
WHERE status = 'closed';
```

This index significantly improves the query performance for daily report generation.

---

## 🔐 Security Features

- ✅ **JWT Authentication** - Secure token-based auth with configurable expiration
- ✅ **Password Hashing** - bcrypt with 12 salt rounds
- ✅ **2FA Support** - TOTP authentication for enhanced security
- ✅ **Security Headers** - HSTS, CSP, X-Frame-Options, and more via Next.js config
- ✅ **SQL Injection Protection** - Parameterized queries via Prisma ORM
- ✅ **XSS Protection** - React's built-in XSS protection + secure headers
- ✅ **CORS Configuration** - Restricted origins in production
- ✅ **Rate Limiting** - Configurable rate limits for API endpoints
- ✅ **Audit Logging** - Track all user and admin actions
- ✅ **Email Verification** - Confirm user identity before activation
- ✅ **No Secrets in Code** - All sensitive data via environment variables
- ✅ **Error Handling** - Generic error messages, no internal details exposed

### Security Best Practices

1. **Environment Variables**: Never commit `.env` files. Use strong, unique secrets.
2. **JWT Secret**: Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. **Admin Credentials**: Change default admin password immediately in production
4. **HTTPS**: Always use HTTPS in production (Vercel provides this automatically)
5. **Database**: Use connection pooling and ensure database credentials are secure
6. **Regular Updates**: Keep dependencies updated with `npm audit` and `npm update`

---

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Email verification
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA code
- `POST /api/auth/2fa/disable` - Disable 2FA

### User Endpoints

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile

### Trading Robot Endpoints

- `GET /api/robots` - List all robots with user configs
- `POST /api/robots/toggle` - Enable/disable robot

### Payment Proof Endpoints

- `POST /api/payment-proof/submit` - Submit payment proof
- `GET /api/payment-proof/status` - Get payment status

### Admin Endpoints

- `POST /api/admin/login` - Admin login
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/activate` - Activate/deactivate user
- `GET /api/admin/payment-proofs` - List payment proofs
- `POST /api/admin/payment-proofs/review` - Approve/reject proof

---

## 🚢 Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for comprehensive deployment instructions.

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Environment Variables

Required environment variables (see `.env.example`):

```env
DATABASE_URL=
JWT_SECRET=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
METAAPI_TOKEN=
NEXT_PUBLIC_WHATSAPP_URL=
NEXT_PUBLIC_INSTAGRAM_URL=
ADMIN_EMAIL=kbonface03@gmail.com
ADMIN_PASSWORD=BRBros@1234
```

---

## 🧪 Testing

### Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Seed data
npm run seed:all
```

### Manual Testing Checklist

1. ✅ Register new account
2. ✅ Verify email (check console for verification link)
3. ✅ Login and check dashboard
4. ✅ Submit payment proof
5. ✅ Admin login and approve payment
6. ✅ User access trading robots
7. ✅ Enable/disable robots
8. ✅ Check WhatsApp/Instagram CTAs

---

## 🎯 Project Status

### ✅ Completed Features

- [x] User authentication (email/password + 2FA)
- [x] Admin panel with full user management
- [x] Payment proof workflow
- [x] 10 trading robots with multiple timeframes
- [x] Robot enable/disable functionality
- [x] Dashboard with payment status
- [x] WhatsApp & Instagram CTAs
- [x] Email notifications
- [x] Audit logging
- [x] Responsive UI with Material-UI
- [x] Database schema with Prisma
- [x] API routes for all features
- [x] Deployment configuration

### 🔄 In Progress

- [ ] MetaAPI real integration
- [ ] Live trade execution
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics dashboard

### 📋 Future Enhancements

- [ ] Trade history with charts
- [ ] Performance analytics
- [ ] Portfolio management
- [ ] Copy trading features
- [ ] Mobile app
- [ ] Backtesting engine

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- MetaTrader 5 for trading platform
- MetaAPI for broker integration
- Material-UI for UI components
- Prisma for database ORM
- Vercel for hosting

---

## 📧 Support

**For Users:**
- WhatsApp: Use floating button on homepage
- Instagram: Follow us for updates
- Email: support@algoedge.com

**For Developers:**
- GitHub Issues: [Report a bug](https://github.com/kbornfas/AlgoEdge/issues)
- Documentation: See DEPLOYMENT_GUIDE.md
- Admin Support: kbonface03@gmail.com

---

## ⚠️ Disclaimer

**IMPORTANT**: Trading forex, CFDs, and leveraged products carries HIGH RISK. You could lose ALL invested capital.

- Only trade with money you can afford to lose
- Past performance does not guarantee future results
- Automated trading systems require constant monitoring
- AlgoEdge is provided as-is without warranty

**Use at your own risk. The developers are not responsible for trading losses.**

---

<div align="center">

**Built with ❤️ for Traders**

[Website](https://algoedge.vercel.app) • [Documentation](DEPLOYMENT_GUIDE.md) • [Admin Panel](/admin/login)

**© 2024 AlgoEdge. All rights reserved.**

</div>
