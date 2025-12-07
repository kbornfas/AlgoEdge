# AlgoEdge Frontend-Backend Integration Guide

## 🔌 Connecting Frontend to Backend

The frontend currently uses **simulated data**. Follow these steps to connect it to the real backend API.

---

## Step 1: Update Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

For production:
```env
VITE_API_URL=https://your-backend-url.railway.app
VITE_WS_URL=https://your-backend-url.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
```

### Backend (backend/.env)
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/algoedge

# JWT
JWT_SECRET=your_32_character_secret_here
JWT_EXPIRES_IN=7d

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Stripe
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_PRO=price_your_pro_price_id
STRIPE_PRICE_ID_ENTERPRISE=price_your_enterprise_price_id

# Frontend
FRONTEND_URL=http://localhost:5173

# Optional
PORT=3000
NODE_ENV=development
```

---

## Step 2: Set Up PostgreSQL Database

### Install PostgreSQL

**Windows:**
```powershell
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey
choco install postgresql
```

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Create Database

```bash
# Access PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE algoedge;
CREATE USER algoedge_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE algoedge TO algoedge_user;
\q
```

### Initialize Database Schema

```bash
cd backend
npm run init-db
```

This will:
- Create all 8 tables
- Add indexes for performance
- Insert 7 trading robots
- Set up default data

---

## Step 3: Configure SMTP Email Service

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Step Verification** in your Google Account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Update backend/.env**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Option 2: SendGrid (Production)

1. Sign up at https://sendgrid.com
2. Create API key
3. Update backend/.env:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### Option 3: AWS SES (Production)

1. Configure AWS SES
2. Get SMTP credentials
3. Update backend/.env accordingly

---

## Step 4: Set Up Stripe Payments

### Test Mode Setup

1. **Create Stripe Account**: https://dashboard.stripe.com/register

2. **Get API Keys**:
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy "Publishable key" → Frontend .env
   - Copy "Secret key" → Backend .env

3. **Create Products**:
   ```javascript
   // In Stripe Dashboard → Products → Add Product
   
   // Pro Plan
   Name: AlgoEdge Pro
   Price: $49/month
   Billing: Recurring
   
   // Enterprise Plan
   Name: AlgoEdge Enterprise
   Price: $199/month
   Billing: Recurring
   ```

4. **Copy Price IDs**:
   - Each product has a price ID (starts with `price_`)
   - Add to backend/.env:
   ```env
   STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxx
   STRIPE_PRICE_ID_ENTERPRISE=price_xxxxxxxxxxxxx
   ```

5. **Set Up Webhook**:
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe  # Mac
   scoop install stripe  # Windows
   
   # Login
   stripe login
   
   # Forward webhooks to local server
   stripe listen --forward-to localhost:3000/api/payments/webhook
   
   # Copy webhook signing secret to backend/.env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

For production, add webhook endpoint in Stripe Dashboard:
- URL: `https://your-domain.com/api/payments/webhook`
- Events: Select all `checkout`, `invoice`, and `customer.subscription` events

---

## Step 5: Update Frontend to Use Real API

### Option A: Use React Context (Recommended)

1. **Wrap App with AuthProvider**:

```jsx
// src/main.jsx
import React from 'react';
import ReactDOM from 'reactDOM/client';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

2. **Use Auth Context in Components**:

```jsx
// In your App.jsx or any component
import { useAuth } from './contexts/AuthContext';

function LoginPage() {
  const { login, isLoading } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login({ username, password });
    
    if (result.success) {
      // Redirect to dashboard
    } else {
      // Show error
      alert(result.error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      <button disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Option B: Direct API Integration

Replace simulated code in App.jsx:

```jsx
// OLD (Simulated)
const handleAuth = async (e) => {
  e.preventDefault();
  setCurrentUser({ username, email: `${username}@example.com` });
  setIsAuthenticated(true);
  // ...
};

// NEW (Real API)
import { authAPI, setAuthToken } from './services/api';

const handleAuth = async (e) => {
  e.preventDefault();
  
  try {
    if (isLogin) {
      const response = await authAPI.login({ username, password });
      setAuthToken(response.token);
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      showToast('Login successful!', 'success');
    } else {
      const response = await authAPI.register({ username, email, password });
      setAuthToken(response.token);
      setCurrentUser(response.user);
      setIsAuthenticated(true);
      showToast(response.message, 'success');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
};
```

---

## Step 6: Connect WebSocket for Real-Time Updates

```jsx
import { useEffect } from 'react';
import { websocket, getAuthToken } from './services/api';

function Dashboard() {
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      // Connect WebSocket
      websocket.connect(token);
      
      // Listen for trade updates
      websocket.on('trade:new', (trade) => {
        console.log('New trade:', trade);
        setTrades(prev => [trade, ...prev]);
      });
      
      websocket.on('trade:closed', (trade) => {
        console.log('Trade closed:', trade);
        setTrades(prev => prev.map(t => t.id === trade.id ? trade : t));
      });
      
      websocket.on('balance:update', (balance) => {
        setBalance(balance.balance);
        setEquity(balance.equity);
      });
      
      // Cleanup
      return () => {
        websocket.off('trade:new');
        websocket.off('trade:closed');
        websocket.off('balance:update');
      };
    }
  }, []);
  
  return <div>Your dashboard...</div>;
}
```

---

## Step 7: Test the Integration

### Start Backend
```bash
cd backend
npm run dev
```

Server should start on `http://localhost:3000`

### Start Frontend
```bash
# In project root
npm run dev
```

Frontend should start on `http://localhost:5173`

### Test Flow

1. **Register Account**:
   - Fill registration form
   - Check console for verification email (in dev mode)
   - Copy verification link from console

2. **Verify Email**:
   - Visit verification link
   - Should see success message

3. **Login**:
   - Use registered credentials
   - Should redirect to dashboard

4. **Add MT5 Account**:
   - Go to Settings → MT5 Accounts
   - Add broker credentials
   - Check subscription limits (free = 1, pro = 3)

5. **Enable Trading Robot**:
   - Go to Trading Robots page
   - Enable a robot
   - Check database for user_robot_configs entry

6. **Monitor Trades** (with simulated MT5):
   - Trades will appear in Live Trades page
   - WebSocket updates in real-time
   - Check database trades table

---

## Step 8: Replace Placeholder URL

In `src/App.jsx`, line 125:
```jsx
// OLD
const BACKEND_URL = 'REPLACE_WITH_YOUR_RAILWAY_URL_AFTER_DEPLOYMENT';

// NEW (Development)
// Remove this line - API URL now comes from .env (VITE_API_URL)

// NEW (Production)
// Set VITE_API_URL in production environment
```

---

## Common Issues & Solutions

### ❌ "Failed to fetch" Error
**Problem**: Cannot connect to backend
**Solution**: 
- Check backend is running on correct port
- Verify VITE_API_URL in frontend .env
- Check CORS configuration in backend/server.js

### ❌ "Authentication required" Error
**Problem**: Token not being sent
**Solution**:
- Check token is stored: `localStorage.getItem('authToken')`
- Verify Authorization header is being sent
- Check token hasn't expired (7 days default)

### ❌ Email Not Sending
**Problem**: SMTP configuration incorrect
**Solution**:
- Verify SMTP credentials
- Check firewall isn't blocking port 587
- Enable "Less secure app access" for Gmail (if using Gmail)

### ❌ Database Connection Failed
**Problem**: Cannot connect to PostgreSQL
**Solution**:
- Check PostgreSQL is running
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
- Check database exists: `psql -U postgres -l`

### ❌ Stripe Webhook Not Working
**Problem**: Webhook events not being processed
**Solution**:
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/payments/webhook`
- Verify webhook secret matches
- Check webhook endpoint is publicly accessible in production

---

## Production Deployment Checklist

- [ ] Set NODE_ENV=production
- [ ] Use production database (not localhost)
- [ ] Switch to Stripe live mode keys
- [ ] Use production SMTP service
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Configure error monitoring (Sentry, etc.)
- [ ] Test all API endpoints
- [ ] Test WebSocket connection
- [ ] Verify Stripe webhooks work
- [ ] Test email delivery

---

## Need Help?

- **Backend Logs**: Check `backend/` terminal for errors
- **Frontend Logs**: Open browser DevTools → Console
- **Database Logs**: `psql -U postgres` then `\l` to list databases
- **API Testing**: Use Postman or curl to test endpoints directly

Example curl test:
```bash
# Test health check
curl http://localhost:3000/health

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

---

For more details, see:
- **README.md** - Project overview
- **DEPLOYMENT.md** - Production deployment
- **TROUBLESHOOTING.md** - Common issues
- **PROJECT_STATUS.md** - Implementation status
