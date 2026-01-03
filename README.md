# AlgoEdge - Production SaaS Trading Platform

[🎯Join telegram channel for free AI signals🚀](https://t.me/+newQkIa06W1kNmMx)

<div align="center">

![AlgoEdge](https://img.shields.io/badge/AlgoEdge-Trading%20Platform-blue?style=for-the-badge)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-316192?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5+-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)

**Automated Forex Trading with MetaTrader 5 Integration**

[Features](#-features) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Documentation](#-documentation) • [Support](#-support)

</div>

---

## 📊 Overview

AlgoEdge is a comprehensive production-ready SaaS trading platform that connects to MetaTrader 5 accounts and provides automated trading robots with real-time monitoring, advanced analytics, and payment-gated access control.

## 🏗️ Architecture

**⚠️ CRITICAL: Split Deployment Model**

AlgoEdge uses a **strict separation** between backend and frontend:

| Component | Platform | Responsibilities |
|-----------|----------|------------------|
| **Backend** | 🟢 **Render** | Express API, **Database Migrations**, Schema Management, WebSocket |
| **Frontend** | 🔵 **Vercel** | Next.js App, Prisma Client (types only), **NO Migrations** |
| **Database** | 🟢 **Render** | PostgreSQL (managed by backend) |

**Key Principle:** Backend controls the database, Frontend consumes the schema.

📖 See [BACKEND_RENDER_FRONTEND_VERCEL.md](./BACKEND_RENDER_FRONTEND_VERCEL.md) for complete separation details.

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

## 🗄️ Database & Migrations

**IMPORTANT:** Database migrations are managed by the backend (Render), not the frontend (Vercel).

### Quick Setup

```bash
# 1. Generate Prisma Client (for development)
npm run prisma:generate

# 2. Create migration (development only)
npx prisma migrate dev --name your_migration_name

# 3. Check migration status
npm run prisma:migrate:status
```

### Production Deployments

- **Vercel (Frontend)**: Only generates Prisma Client - NO migrations
- **Render (Backend)**: Runs `prisma migrate deploy` during build

See [DEPLOYMENT_QUICK_REF.md](./DEPLOYMENT_QUICK_REF.md) for quick commands.

---

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

## 🚀 Deployment

### Production Deployment

AlgoEdge uses a **split deployment architecture**:

1. **Backend (Render)** - Deploy first
   - Runs database migrations
   - Manages database schema
   - Provides REST API and WebSocket server

2. **Frontend (Vercel)** - Deploy second
   - Builds Next.js application
   - Generates Prisma Client (read-only)
   - Serves static assets and API routes

### Quick Deploy

**Option 1: Using Render Blueprint (Recommended)**
1. Push code to GitHub
2. Go to [Render Dashboard](https://render.com)
3. Create new Blueprint from `render.yaml`
4. Backend + Database created automatically

**Option 2: Manual Setup**
- Follow [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)

### Documentation
- 📚 [Deployment Architecture](./DEPLOYMENT_ARCHITECTURE.md) - Complete architecture guide
- 🎯 [Quick Reference](./DEPLOYMENT_QUICK_REF.md) - Common commands and troubleshooting
- 🔧 [Render Setup](./RENDER_DEPLOYMENT.md) - Backend deployment guide
- 🌐 [Vercel Setup](./PRODUCTION_DEPLOYMENT.md#3-vercel-deployment-frontend) - Frontend deployment guide

---
