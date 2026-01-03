# 🚀 AlgoEdge - Next.js Migration Complete

> **Automated Forex Trading Platform** built with Next.js 14, Material-UI, and Prisma

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Material-UI](https://img.shields.io/badge/Material--UI-5-007FFF?logo=mui)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?logo=postgresql)

---

## ✨ What's New

The AlgoEdge platform has been completely migrated from React + Vite to **Next.js 14** with modern best practices:

### 🎯 Technology Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **UI Library** | Material-UI v5 (Dark Theme) |
| **Language** | TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Authentication** | JWT + 2FA (TOTP) |
| **Email** | Nodemailer |
| **Icons** | Lucide React |
| **Payment** | Stripe (ready) |

### 🚀 Key Features Implemented

✅ **Authentication System**
- User registration with email verification
- Login with JWT tokens
- Password reset flow
- Two-factor authentication (Google Authenticator)
- Profile management

✅ **Modern UI/UX**
- Responsive dark theme
- Material-UI components
- Landing page with pricing
- Dashboard with sidebar navigation
- Login/Register pages

✅ **Backend API**
- 9 serverless API endpoints
- Type-safe database access
- JWT middleware
- Email service with HTML templates
- 2FA QR code generation

✅ **Database**
- Complete Prisma schema (8 tables)
- User management
- Subscriptions
- MT5 accounts
- Trades
- Settings
- Audit logs

---

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/kbornfas/AlgoEdge.git
cd AlgoEdge

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
npx prisma db push
npx prisma generate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📚 Documentation

For detailed setup instructions, deployment guides, and API documentation, see:

👉 **[NEXTJS_SETUP.md](./NEXTJS_SETUP.md)** - Complete setup and deployment guide

### Quick Links

- [Project Structure](./NEXTJS_SETUP.md#project-structure)
- [Environment Configuration](./NEXTJS_SETUP.md#environment-configuration)
- [Database Setup](./NEXTJS_SETUP.md#database-setup)
- [Prisma Migration Guide](./PRISMA_MIGRATION_GUIDE.md) - **NEW!** Comprehensive migration guide
- [API Endpoints](./NEXTJS_SETUP.md#api-endpoints)
- [Deployment Guide](./NEXTJS_SETUP.md#deployment)
- [Troubleshooting](./NEXTJS_SETUP.md#common-issues)

---

## 🎨 Screenshots

### Landing Page
Beautiful, responsive landing page with features showcase and pricing plans.

### Dashboard
Modern dashboard with stats cards, active robots, recent trades, and quick actions.

### Authentication
Secure login/register pages with 2FA support, email verification, and password reset.

---

## 🔐 Security Features

- ✅ JWT authentication with secure tokens
- ✅ bcrypt password hashing (12 rounds)
- ✅ Email verification required
- ✅ Two-factor authentication (TOTP)
- ✅ SQL injection protection (Prisma)
- ✅ Environment variable security
- ✅ HTTPS enforced in production

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register           - Register new user
POST   /api/auth/login              - Login (with optional 2FA)
POST   /api/auth/verify             - Verify email
POST   /api/auth/reset-password     - Password reset
POST   /api/auth/2fa/setup          - Generate 2FA secret
POST   /api/auth/2fa/verify         - Enable 2FA
POST   /api/auth/2fa/disable        - Disable 2FA
```

### User Management
```
GET    /api/user/profile            - Get user profile
PUT    /api/user/profile            - Update profile
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Configure environment variables in Vercel dashboard.

### Railway (Database)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway add --database postgresql
```

See [NEXTJS_SETUP.md](./NEXTJS_SETUP.md#deployment) for detailed deployment guides.

---

## 📊 Project Status

### ✅ Completed (Phase 1 & 2)

- [x] Next.js 14 setup with App Router
- [x] Material-UI dark theme
- [x] Prisma schema and database
- [x] Authentication system (register, login, verify, reset)
- [x] Two-factor authentication
- [x] User profile management
- [x] Landing page
- [x] Dashboard layout
- [x] Email service
- [x] JWT middleware

### 🔄 In Progress (Phase 3)

- [ ] Settings page with 2FA UI toggle
- [ ] MT5 connection wizard
- [ ] Trading robots management
- [ ] Trade history table
- [ ] Video tutorial integration

### 📅 Planned (Phase 4+)

- [ ] Real-time WebSocket updates
- [ ] MetaAPI integration
- [ ] Stripe subscription flow
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Multi-language support

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open database GUI
```

### Tech Stack Details

**Frontend:**
- Next.js 14 (App Router, Server Components)
- Material-UI 5 (Custom dark theme)
- TypeScript (Type safety)
- Lucide React (Icons)

**Backend:**
- Next.js API Routes (Serverless)
- Prisma ORM (Type-safe DB access)
- JWT (Authentication)
- Nodemailer (Email)
- Speakeasy + QRCode (2FA)

**Database:**
- PostgreSQL 14+
- 8 tables with relationships
- Indexes for performance

---

## 📝 Migration Notes

### What Changed

- ✅ **Framework:** Vite → Next.js 14 (App Router)
- ✅ **UI:** Tailwind CSS → Material-UI
- ✅ **Backend:** Express → Next.js API Routes
- ✅ **Database:** pg driver → Prisma ORM
- ✅ **Routing:** React Router → Next.js routing
- ✅ **State:** Local state → Server Components + Client Components

### Preserved Files

- `old-vite-app/` - Original Vite application (backup)
- `backend/` - Original Express backend (reference)

---

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 💬 Support

- 📧 Email: support@algoedge.com
- 📱 WhatsApp: [Configure in .env]
- 📸 Instagram: [Configure in .env]
- 🐛 Issues: [GitHub Issues](https://github.com/kbornfas/AlgoEdge/issues)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Material-UI](https://mui.com/) - Component library
- [Prisma](https://www.prisma.io/) - Database ORM
- [Vercel](https://vercel.com/) - Deployment platform

---

<div align="center">

**Built with ❤️ for automated forex trading**

[Get Started](./NEXTJS_SETUP.md) • [Documentation](./NEXTJS_SETUP.md) • [Report Bug](https://github.com/kbornfas/AlgoEdge/issues)

</div>
