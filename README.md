# AlgoEdge - AI-Powered Trading Platform

<div align="center">

![AlgoEdge Logo](https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=AlgoEdge)

**Automated Forex Trading with MetaTrader 5 Integration**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Deployment](#deployment) • [Support](#support)

</div>

---

## 📊 Overview

AlgoEdge is a comprehensive trading platform that connects to MetaTrader 5 accounts and provides automated trading robots with real-time monitoring, advanced analytics, and subscription management.

### Key Features

- 🤖 **7 Pre-Built Trading Robots** - Trend, scalping, breakout, grid, martingale, hedging strategies
- 📈 **Real-Time Trade Monitoring** - Live P&L tracking with WebSocket updates
- 🔐 **Enterprise Security** - JWT authentication, 2FA, bcrypt password hashing
- 💳 **Stripe Integration** - Free, Pro, and Enterprise subscription tiers
- 📧 **Email Notifications** - Trade alerts, welcome emails, password resets
- 🌐 **MT5 Integration** - Connect multiple broker accounts
- 📊 **Advanced Analytics** - Win rate, profit factors, trade statistics
- 🎨 **Modern UI** - Tailwind CSS with responsive design

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** 15 or higher
- **npm** or **yarn**
- **Stripe Account** (for payments)
- **SMTP Email Service** (Gmail, SendGrid, etc.)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/AlgoEdge.git
   cd AlgoEdge
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

4. **Configure environment variables:**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your configuration

   # Frontend
   cd ..
   cp .env.example .env
   # Edit .env with your API URLs
   ```

5. **Initialize the database:**
   ```bash
   cd backend
   npm run init-db
   ```

6. **Start development servers:**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   npm run dev
   ```

7. **Open your browser:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`
   - Health Check: `http://localhost:3000/health`

---

## 🏗️ Architecture

```
AlgoEdge/
├── src/                      # Frontend React application
│   ├── components/           # Reusable UI components
│   ├── pages/                # Page components
│   ├── services/             # API integration
│   └── App.jsx               # Main app component
│
├── backend/                  # Node.js Express backend
│   ├── config/               # Database & configuration
│   ├── controllers/          # Request handlers
│   ├── middleware/           # Auth, rate limiting, audit
│   ├── routes/               # API route definitions
│   ├── services/             # Business logic (email, WebSocket, MT5)
│   └── server.js             # Express server entry point
│
├── public/                   # Static assets
├── docker-compose.yml        # Docker deployment
├── Dockerfile                # Backend container
└── railway.json              # Railway deployment config
```

### Technology Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- Socket.io client for WebSocket
- Lucide React for icons

**Backend:**
- Node.js 18+ with Express
- PostgreSQL with pg driver
- JWT authentication
- Socket.io for real-time updates
- Stripe for payments
- Nodemailer for emails

**Infrastructure:**
- Docker & Docker Compose
- Railway / VPS deployment
- PostgreSQL database
- WebSocket server

---

## 📚 Documentation

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA code
- `POST /api/auth/2fa/disable` - Disable 2FA

#### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/settings` - Get user settings
- `PUT /api/users/settings` - Update settings
- `GET /api/users/mt5-accounts` - List MT5 accounts
- `POST /api/users/mt5-accounts` - Add MT5 account
- `GET /api/users/robot-configs` - Get robot configurations
- `PUT /api/users/robot-configs/:robotId` - Update robot config

#### Trades
- `GET /api/trades` - List trades with filters
- `GET /api/trades/stats` - Get trade statistics
- `POST /api/trades` - Create new trade
- `PUT /api/trades/:tradeId/close` - Close trade
- `GET /api/trades/robots` - List available robots

#### Payments
- `POST /api/payments/create-checkout-session` - Create Stripe checkout
- `POST /api/payments/create-portal-session` - Billing portal
- `POST /api/payments/webhook` - Stripe webhook handler

### WebSocket Events

**Client → Server:**
- `ping` - Connection test

**Server → Client:**
- `connected` - Connection established
- `pong` - Ping response
- `trade:new` - New trade opened
- `trade:update` - Trade updated
- `trade:closed` - Trade closed
- `price:update` - Price feed update
- `mt5:status` - MT5 connection status
- `balance:update` - Account balance update
- `robot:status` - Robot status change
- `notification` - General notification

### Database Schema

**Tables:**
- `users` - User accounts
- `subscriptions` - Subscription plans
- `mt5_accounts` - MT5 broker connections
- `trading_robots` - Available trading bots
- `user_robot_configs` - User robot settings
- `trades` - Trade history
- `user_settings` - User preferences
- `audit_logs` - Security audit trail

---

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment guides:

- **Railway** - One-click deployment
- **Docker** - Containerized deployment
- **VPS** - Manual server setup
- **Stripe Configuration**
- **SSL Setup**
- **Monitoring & Logs**

### Quick Deploy to Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway add --database postgresql
railway up
```

---

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Check for Errors
```bash
# Backend
cd backend
npm run lint

# Frontend
npm run lint
```

### Manual Testing
1. Register a new account
2. Verify email (check console for verification link in dev mode)
3. Add MT5 account
4. Enable a trading robot
5. Monitor live trades
6. Check WebSocket connection in browser console

---

## 🔒 Security Features

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - bcrypt with 12 salt rounds
- ✅ **2FA Support** - TOTP authentication
- ✅ **Rate Limiting** - Prevent brute force attacks
- ✅ **SQL Injection Protection** - Parameterized queries
- ✅ **XSS Protection** - Helmet security headers
- ✅ **CORS Configuration** - Restricted origins
- ✅ **Audit Logging** - Track all user actions
- ✅ **Email Verification** - Confirm user identity

---

## 📊 Subscription Plans

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **Price** | $0/mo | $49/mo | $199/mo |
| **MT5 Accounts** | 1 | 3 | Unlimited |
| **Trading Robots** | All 7 | All 7 | All 7 |
| **Email Alerts** | ✅ | ✅ | ✅ |
| **WebSocket Updates** | ✅ | ✅ | ✅ |
| **Priority Support** | ❌ | ✅ | ✅ |
| **Advanced Analytics** | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation as needed

---

## 🐛 Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and solutions.

**Common Issues:**
- Database connection failed → Check DATABASE_URL format
- Email not sending → Verify SMTP credentials
- WebSocket not connecting → Check CORS and FRONTEND_URL
- Stripe webhook failing → Verify webhook secret

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- MetaTrader 5 for trading platform
- Stripe for payment processing
- Socket.io for real-time communication
- Tailwind CSS for UI framework

---

## 📧 Support

- **Email:** support@algoedge.com
- **GitHub Issues:** [Report a bug](https://github.com/yourusername/AlgoEdge/issues)
- **Documentation:** [Full docs](https://docs.algoedge.com)

---

<div align="center">

**Built with ❤️ by the AlgoEdge Team**

[Website](https://algoedge.com) • [Documentation](https://docs.algoedge.com) • [Discord](https://discord.gg/algoedge)

</div> - Automated Trading Platform

A professional automated trading platform for MetaTrader 5 (MT5) with a beautiful, modern React frontend.

## 🚀 Features

- **MT5 Integration** - Connect to your MetaTrader 5 account
- **Automated Trading Bot** - Execute trades automatically based on your strategy
- **Real-time Dashboard** - Monitor your trades and account balance live
- **Multiple Strategies** - EMA Crossover, RSI, MACD, Bollinger Bands
- **Trade History** - View all past and current trades
- **Risk Management** - Set stop loss and take profit levels
- **Dark/Light Mode** - Choose your preferred theme
- **2FA Security** - Two-factor authentication for added security
- **Responsive Design** - Works on desktop, tablet, and mobile

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- MT5 broker account (demo or live)

## 🛠️ Installation

1. **Clone the repository**
   ```powershell
   git clone https://github.com/kbornfas/AlgoEdge.git
   cd AlgoEdge
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Start the development server**
   ```powershell
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📦 Build for Production

```powershell
npm run build
```

The built files will be in the `dist` folder, ready to deploy.

## 🎯 Usage

### First Time Setup

1. **Register an Account**
   - Click "Register" on the login screen
   - Enter username, email, and password
   - Accept terms and privacy policy

2. **Connect to MT5**
   - Click "Connect to MT5" on the dashboard
   - Enter your MT5 credentials:
     - API Key
     - API Secret
     - Account ID
     - Server name

3. **Start Trading**
   - Once connected, click "Start Trading"
   - The bot will execute trades based on your strategy
   - Monitor trades in real-time on the dashboard

### Strategy Configuration

1. Go to **Strategy** page
2. Select strategy type (EMA Crossover, RSI, MACD, etc.)
3. Adjust indicator parameters
4. Save your configuration

### Security Settings

- **Enable 2FA**: Go to Settings → Security → Enable 2FA
- **Password Reset**: Click "Forgot password?" on login screen
- **Profile Management**: Update your profile in the Profile page

## 🎨 Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Hooks

## 📱 Pages

- **Dashboard** - Overview of account, trades, and bot status
- **Trade History** - Table of all past and current trades
- **Strategy** - Configure trading strategies and indicators
- **Settings** - Notifications, risk management, and security
- **Profile** - User profile management
- **Help** - FAQ and legal documents

## ⚠️ Risk Disclosure

**IMPORTANT**: Trading forex, CFDs, and leveraged products carries HIGH RISK. You could lose ALL invested capital. 

- Only trade with money you can afford to lose
- Past performance does not guarantee future results
- Automated trading systems require constant monitoring
- AlgoEdge is a demo application - use at your own risk

## 🔒 Security

- Passwords are hashed and secured
- 2FA authentication available
- MT5 credentials are stored locally
- HTTPS encryption for all communications

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For support, email support@algoedge.com or join our Discord community.

## 🙏 Acknowledgments

- MetaTrader 5 for trading platform
- React community for excellent documentation
- Tailwind CSS for beautiful styling utilities

---

**Disclaimer**: This is a demo application. Always test with a demo account first. Trading involves risk of loss.
