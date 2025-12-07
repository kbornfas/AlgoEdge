# MetaAPI Integration Setup Guide

## ✅ What's Been Configured

Your AlgoEdge backend is now fully integrated with **MetaAPI.cloud** for real MetaTrader 5 trading!

### Token Installed
- **MetaAPI Token**: Added to `backend/.env`
- **SDK Installed**: `metaapi.cloud-sdk` package added
- **MT5 Service Updated**: Real API calls replace all simulated data

---

## 🚀 Features Now Available

### 1. Real MT5 Account Connection
- Connect to any MT5 broker account
- Auto-deploy and synchronize
- Real-time account balance updates

### 2. Live Trading
- Open market orders (BUY/SELL)
- Set stop loss and take profit
- Close positions programmatically
- Real price execution

### 3. Account Management
- Get real account information (balance, equity, margin)
- Monitor open positions
- Track trade history
- Real-time synchronization

### 4. Broker Support
MetaAPI supports **1000+ MT5 brokers** including:
- IC Markets
- FBS
- Pepperstone
- FTMO
- XM
- Admiral Markets
- And many more...

---

## 📋 How to Connect an MT5 Account

### Step 1: Get Your MT5 Credentials
From your broker, you need:
- **Login**: Your MT5 account number
- **Password**: Your MT5 password
- **Server**: Server name (e.g., "ICMarkets-Demo", "FBS-Real")

### Step 2: Add Account via API
Use the frontend or make a POST request:

```bash
POST http://localhost:5000/api/users/mt5-accounts
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "login": "12345678",
  "password": "YourMT5Password",
  "server": "ICMarkets-Demo",
  "platform": "MT5",
  "broker": "IC Markets"
}
```

### Step 3: Backend Automatically
1. Creates MetaAPI account
2. Deploys account to cloud
3. Connects to terminal
4. Syncs balance and positions
5. Emits real-time updates via WebSocket

---

## 🔧 Testing the Integration

### 1. Start Backend
```bash
cd backend
npm start
```

### 2. Connect MT5 Account
Use the frontend UI or API endpoint to add your MT5 account.

### 3. Monitor Logs
Watch for these messages:
```
Connecting to MT5 account 12345678 on ICMarkets-Demo...
Creating new MetaAPI account...
MetaAPI account created: abc123...
Waiting for deployment...
Connecting to terminal...
Successfully connected to MT5!
MT5 account 1 connected with balance: $10000
```

### 4. Open Test Trade
```bash
POST http://localhost:5000/api/trades
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "mt5_account_id": 1,
  "robot_id": 1,
  "symbol": "EURUSD",
  "order_type": "buy",
  "volume": 0.01,
  "stop_loss": 1.0800,
  "take_profit": 1.0900
}
```

---

## 📊 Real-Time Updates

### WebSocket Events
Your frontend receives these events automatically:

1. **mt5:status** - Connection status changes
2. **balance:update** - Balance/equity changes
3. **trade:new** - New trade opened
4. **trade:closed** - Trade closed with P/L

---

## 🔐 Security Notes

### Token Security
- ✅ Token stored in `.env` (not committed to Git)
- ✅ Never expose token in frontend
- ✅ Backend-only access to MetaAPI

### Best Practices
1. Use demo accounts for testing
2. Test with small volumes first
3. Monitor API usage (check MetaAPI dashboard)
4. Set proper stop losses on all trades

---

## 📈 API Usage & Pricing

### MetaAPI Free Tier
- **10 accounts** free
- **Limited history** (90 days)
- **Community support**

### Paid Plans
- More accounts
- Unlimited history
- Priority support
- Lower latency

Check pricing: https://metaapi.cloud/pricing

---

## 🛠️ Troubleshooting

### "MT5 account not connected"
- Check broker credentials are correct
- Verify server name matches exactly
- Ensure account has active balance

### "Failed to deploy account"
- Check MetaAPI dashboard for account status
- Verify broker is supported
- Try undeploying and redeploying

### "Connection timeout"
- Increase timeout in code
- Check internet connection
- Verify broker server is online

### Check MetaAPI Status
- Dashboard: https://app.metaapi.cloud
- Your accounts: https://app.metaapi.cloud/accounts
- API logs: https://app.metaapi.cloud/logs

---

## 📚 Additional Resources

### MetaAPI Documentation
- Main docs: https://metaapi.cloud/docs/
- SDK docs: https://github.com/agiliumtrade-ai/metaapi-node.js-sdk
- Examples: https://github.com/agiliumtrade-ai/metaapi-examples

### AlgoEdge Integration
- MT5 Service: `backend/services/mt5Service.js`
- API Routes: `backend/routes/userRoutes.js`
- Frontend API: `src/services/api.js`

---

## ✨ Next Steps

1. **Test Connection**: Connect a demo account first
2. **Verify Trades**: Open/close test trades with small volumes
3. **Monitor Performance**: Check WebSocket updates in real-time
4. **Add Robots**: Configure trading robots with your strategies
5. **Go Live**: Switch to real account when ready

---

## 🎯 Your Setup Status

- ✅ MetaAPI Token configured
- ✅ SDK installed (metaapi.cloud-sdk)
- ✅ MT5 Service updated with real API calls
- ✅ Database schema ready
- ✅ WebSocket events configured
- ✅ Frontend API integration complete

**You're ready to trade! 🚀**

Connect your first MT5 account through the frontend dashboard.
