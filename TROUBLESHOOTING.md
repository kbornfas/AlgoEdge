# 🔧 AlgoEdge Troubleshooting & FAQ

## Complete Problem-Solving Guide

📘 **For comprehensive Prisma migration troubleshooting, see [PRISMA_MIGRATION_GUIDE.md](./PRISMA_MIGRATION_GUIDE.md)**

📘 **For payment_proofs table issues, see [PAYMENT_PROOFS_TABLE.md](./PAYMENT_PROOFS_TABLE.md)**

📘 **For detailed troubleshooting, see [TROUBLESHOOTING_DETAILED.md](./TROUBLESHOOTING_DETAILED.md)**

---

## 🚨 CRITICAL ERRORS

### Error: "Missing required tables: payment_proofs"

**Cause:** Database schema is out of sync with application code. The `payment_proofs` table is missing from the database.

**This is a CRITICAL deployment blocker!**

**Quick Fix:**
```bash
# Step 1: Check migration status
npx prisma migrate status

# Step 2: Apply all pending migrations
npx prisma migrate deploy

# Step 3: Verify table exists
npx prisma db execute --stdin <<EOF
SELECT 1 FROM payment_proofs LIMIT 1;
EOF
```

**If migrations fail with "already applied" error:**
```bash
# Mark existing migrations as applied
npx prisma migrate resolve --applied "20260102090000_init"
npx prisma migrate resolve --applied "20260102090350_add_approval_status_and_rejection_reason"
npx prisma migrate resolve --applied "20260103113015_add_created_at_to_payment_proofs"

# Then deploy any remaining
npx prisma migrate deploy
```

**For complete guide, see:** [PAYMENT_PROOFS_TABLE.md](./PAYMENT_PROOFS_TABLE.md)

---

### Error: "Cannot find module 'express'"

**Cause:** Dependencies not installed

**Solution:**
```bash
cd backend
npm install
```

**Prevention:** Always run `npm install` after cloning or before first run

---

### Error: "connect ECONNREFUSED" (Database)

**Cause:** Cannot connect to PostgreSQL database

**Solutions:**

1. **Check DATABASE_URL format:**
   ```bash
   # Correct format:
   postgresql://username:password@host:port/database
   
   # Example:
   postgresql://postgres:mypassword@localhost:5432/algoedge
   ```

2. **Verify database is running:**
   ```bash
   # For local PostgreSQL
   sudo systemctl status postgresql
   
   # Start if stopped
   sudo systemctl start postgresql
   ```

3. **Check database exists:**
   ```bash
   psql -U postgres -l
   
   # Create if needed
   createdb algoedge
   ```

4. **Test connection:**
   ```bash
   psql $DATABASE_URL
   ```

5. **Railway/Cloud database:**
   - Check dashboard for database status
   - Verify connection string hasn't changed
   - Confirm IP whitelist if applicable

---

### Error: "JWT must be provided"

**Cause:** Missing or invalid authentication token

**Solutions:**

1. **Login first to get token:**
   ```javascript
   // Login request
   POST /api/auth/login
   {
     "username": "youruser",
     "password": "yourpass"
   }
   
   // Response contains token
   {
     "token": "eyJhbGc..."
   }
   ```

2. **Include token in requests:**
   ```bash
   # cURL
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/user/profile
   
   # Fetch
   fetch('/api/user/profile', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   ```

3. **Check token expiry:**
   - Tokens expire after 7 days
   - Re-login to get new token
   - Implement refresh token logic

---

### Error: "Too many requests"

**Cause:** Rate limit exceeded

**Solutions:**

1. **Wait 15 minutes** - rate limits reset every 15 minutes

2. **For development, increase limits:**
   ```javascript
   // In server.js
   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100 // Increase from 5
   });
   ```

3. **For production:**
   - Implement exponential backoff
   - Cache responses where possible
   - Don't make unnecessary requests

---

## 📧 EMAIL ISSUES

### Emails Not Sending

**Issue:** Welcome/reset emails not arriving

**Solutions:**

1. **Gmail App Password:**
   ```bash
   # Don't use regular Gmail password!
   # Steps:
   1. Go to myaccount.google.com/security
   2. Enable 2-Step Verification
   3. Go to myaccount.google.com/apppasswords
   4. Generate password for "Mail"
   5. Use the 16-character password
   ```

2. **Check SMTP settings:**
   ```bash
   SMTP_HOST=smtp.gmail.com  # Not mail.google.com
   SMTP_PORT=465             # Not 587 for SSL
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # App password
   ```

3. **Test email manually:**
   ```javascript
   // Create test.js
   const nodemailer = require('nodemailer');
   
   const transporter = nodemailer.createTransporter({
     host: 'smtp.gmail.com',
     port: 465,
     secure: true,
     auth: {
       user: 'your-email@gmail.com',
       pass: 'your-app-password'
     }
   });
   
   transporter.sendMail({
     from: 'your-email@gmail.com',
     to: 'test@example.com',
     subject: 'Test',
     text: 'Testing'
   }, (err, info) => {
     console.log(err || info);
   });
   ```

4. **Check spam folder**

5. **Verify sender reputation:**
   - New Gmail accounts may have sending limits
   - Start with low volume
   - Warm up the account gradually

---

### Welcome Email But No Verification Link

**Issue:** Email received but link doesn't work

**Solutions:**

1. **Check FRONTEND_URL:**
   ```bash
   # Must match your actual frontend URL
   FRONTEND_URL=http://localhost:3000  # Dev
   FRONTEND_URL=https://yourapp.com    # Prod
   ```

2. **Verify email template:**
   ```javascript
   // In server.js - sendWelcomeEmail function
   const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
   ```

3. **Check token expiry:**
   - Verification tokens expire in 24 hours
   - Request new verification email if expired

---

## 💳 STRIPE PAYMENT ISSUES

### Stripe Checkout Not Loading

**Issue:** Checkout session creation fails

**Solutions:**

1. **Verify API keys:**
   ```bash
   # Use TEST keys for development
   STRIPE_SECRET_KEY=sk_test_...  # Starts with sk_test
   
   # Use LIVE keys only in production
   STRIPE_SECRET_KEY=sk_live_...  # Starts with sk_live
   ```

2. **Check price IDs exist:**
   ```bash
   # Create products in Stripe Dashboard first:
   # https://dashboard.stripe.com/products
   
   # Then get price IDs:
   STRIPE_PRICE_ID_PRO=price_xxxxx
   STRIPE_PRICE_ID_ENTERPRISE=price_xxxxx
   ```

3. **Test with Stripe CLI:**
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```

---

### Payment Succeeded But Subscription Not Updated

**Issue:** Webhook not processing correctly

**Solutions:**

1. **Check webhook endpoint:**
   ```bash
   # In Stripe Dashboard > Webhooks
   # URL should be: https://yourbackend.com/api/webhooks/stripe
   # Not localhost in production!
   ```

2. **Select correct events:**
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`

3. **Verify webhook secret:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   # Get from Stripe Dashboard > Webhooks > [Your Webhook] > Signing secret
   ```

4. **Check webhook logs:**
   - Go to Stripe Dashboard > Webhooks
   - Click on your webhook
   - View recent attempts
   - Check for errors

5. **Test locally:**
   ```bash
   # Install Stripe CLI
   stripe login
   
   # Forward webhooks to localhost
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   
   # Trigger test event
   stripe trigger checkout.session.completed
   ```

---

## 🔐 AUTHENTICATION ISSUES

### "Invalid credentials" on Correct Password

**Cause:** Password hash mismatch

**Solutions:**

1. **Reset password using reset flow:**
   ```bash
   POST /api/auth/request-password-reset
   { "email": "user@example.com" }
   ```

2. **Check database:**
   ```sql
   SELECT username, email FROM users WHERE username = 'youruser';
   -- Verify user exists
   ```

3. **Recreate account if needed:**
   ```sql
   DELETE FROM users WHERE username = 'testuser';
   -- Then register again
   ```

---

### 2FA Code Always Invalid

**Issue:** Time synchronization or wrong secret

**Solutions:**

1. **Check system time:**
   ```bash
   # System time must be accurate
   date
   
   # Sync if wrong (Linux)
   sudo ntpdate -s time.nist.gov
   ```

2. **Scan QR code again:**
   - Disable 2FA in database
   - Set up fresh 2FA
   - Scan new QR code

3. **Manual secret entry:**
   - Use the base32 secret instead of QR
   - Most authenticator apps support manual entry

---

## 🤖 TRADING & MT5 ISSUES

### Cannot Connect to MT5

**Issue:** MT5 connection fails

**Solutions:**

1. **Verify MT5 API provider:**
   - If using MetaApi: check API key validity
   - If direct connection: verify broker allows API access

2. **Check credentials:**
   ```javascript
   {
     "account_id": "12345678",      // MT5 account number
     "server": "MetaQuotes-Demo",    // Exact server name
     "api_key": "your-api-key",
     "api_secret": "your-api-secret"
   }
   ```

3. **Test with demo account first:**
   - Most brokers provide demo accounts
   - Use for testing before risking real money

4. **Firewall/network:**
   - Check if your network blocks trading APIs
   - Try from different network
   - Check VPN if applicable

---

### Prices Not Updating

**Issue:** Real-time prices not showing

**Solutions:**

1. **Check WebSocket connection:**
   ```javascript
   // Browser console
   console.log(wsConnected); // Should be true
   ```

2. **Verify price subscription:**
   ```javascript
   // Should see in WebSocket messages
   socket.emit('subscribe_prices', ['EURUSD', 'GBPUSD']);
   ```

3. **Check MT5 data feed:**
   - Verify MT5 is connected to market
   - Check if market is open (forex closed weekends)
   - Verify subscription to currency pairs

---

### Robot Started But No Trades

**Issue:** Bot active but not trading

**Solutions:**

1. **Check market conditions:**
   - Strategy may have no signals
   - Market volatility too low
   - Timeframe awaiting next candle close

2. **Verify robot configuration:**
   ```javascript
   // Check is_enabled status
   GET /api/user/robot-configs
   ```

3. **Check logs:**
   ```bash
   # Backend logs
   railway logs  # Or check your hosting logs
   ```

4. **Verify minimum balance:**
   - Account may not have enough capital
   - Check volume calculation

5. **Test in simulation:**
   - Use paper trading first
   - Verify strategy logic works

---

## 🌐 WEBSOCKET ISSUES

### WebSocket Won't Connect

**Issue:** Real-time updates not working

**Solutions:**

1. **Check browser console:**
   ```javascript
   // Look for errors like:
   // WebSocket connection to 'ws://...' failed
   ```

2. **Verify backend WebSocket server:**
   ```javascript
   // In server.js, check Socket.io is initialized:
   const io = new Server(server, {
     cors: {
       origin: process.env.FRONTEND_URL
     }
   });
   ```

3. **Check CORS settings:**
   ```javascript
   // Socket.io CORS must allow frontend origin
   cors: {
     origin: 'http://localhost:3000'  // Or your frontend URL
   }
   ```

4. **Firewall/proxy:**
   - Some corporate firewalls block WebSockets
   - Try on different network
   - Check if proxy allows WebSocket upgrade

5. **Use polling as fallback:**
   ```javascript
   // Client side
   const socket = io(BACKEND_URL, {
     transports: ['websocket', 'polling']  // Fallback to polling
   });
   ```

---

## 🎨 FRONTEND ISSUES

### Blank Page / White Screen

**Issue:** React app not rendering

**Solutions:**

1. **Check console for errors:**
   - Press F12
   - Look for red errors
   - Common: import errors, syntax errors

2. **Verify backend URL:**
   ```bash
   # In frontend/.env
   REACT_APP_BACKEND_URL=http://localhost:5000
   ```

3. **Clear cache:**
   ```bash
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Clear browser cache
   # Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   ```

4. **Check React version compatibility:**
   ```bash
   npm list react
   # Should be 18.x
   ```

---

### "Failed to fetch" on API Calls

**Issue:** Frontend can't reach backend

**Solutions:**

1. **Verify backend is running:**
   ```bash
   curl http://localhost:5000/health
   # Should return: {"status":"ok"}
   ```

2. **Check CORS configuration:**
   ```javascript
   // In server.js
   app.use(cors({
     origin: 'http://localhost:3000',  // Your frontend URL
     credentials: true
   }));
   ```

3. **Check network tab:**
   - F12 > Network
   - Click failed request
   - Check error details

4. **Use full URL:**
   ```javascript
   // Make sure using full URL
   const BACKEND_URL = 'http://localhost:5000';
   // Not just '/api/...'
   ```

---

## 📊 DATABASE ISSUES

### "relation 'payment_proofs' does not exist" or Similar Table Missing Errors

**Issue:** Database table missing during deployment or runtime

**Root Cause:** Prisma migrations were not applied to the database

**✅ PERMANENT FIX (January 2026):**

The project now includes an enhanced build script (`scripts/vercel-build.js`) that:
- Validates DATABASE_URL environment variable
- Tests database connectivity before building
- Applies all migrations with proper error handling
- Verifies all required tables exist (including payment_proofs)
- Provides detailed error messages for troubleshooting

This script runs automatically on Vercel via `vercel.json` build command.

**Solutions:**

1. **For Vercel Deployments (Automated):**
   - The new `vercel-build.js` script handles everything automatically
   - Verify `DATABASE_URL` is set in Vercel Project Settings > Environment Variables
   - Check Vercel build logs - the script provides detailed output
   - Build command: `node scripts/vercel-build.js && npm run build`
   
   **If deployment still fails:**
   - Check build logs for specific error from vercel-build.js
   - Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
   - Ensure database server is accessible from Vercel
   - Check that migrations directory is committed to git

2. **Manual Migration Deployment (if needed):**
   ```bash
   # Pull production environment variables (if using Vercel)
   vercel env pull .env.local
   
   # Apply all pending migrations
   npm run prisma:migrate:deploy
   
   # OR use Prisma CLI directly
   npx prisma migrate deploy
   
   # Verify migrations were applied
   npm run prisma:migrate:status
   ```

3. **Verify migrations exist:**
   ```bash
   # Check migration files
   ls -la prisma/migrations/
   
   # Should see:
   # - 20260102090000_init (creates all base tables including payment_proofs)
   # - 20260102090350_add_approval_status_and_rejection_reason
   # - migration_lock.toml
   
   # Verify payment_proofs table is in init migration
   grep -A 15 "CREATE TABLE \"payment_proofs\"" prisma/migrations/20260102090000_init/migration.sql
   ```

4. **Test migrations locally before deploying:**
   ```bash
   # Use the enhanced build script locally
   npm run vercel:build
   
   # This will:
   # 1. Check your DATABASE_URL
   # 2. Connect to database
   # 3. Apply migrations
   # 4. Verify all tables exist
   # 5. Build the app
   ```

5. **Reset database (DEVELOPMENT ONLY - causes data loss):**
   ```bash
   npx prisma migrate reset
   npx prisma migrate deploy
   ```

**Prevention:**
- ✅ Enhanced build script now prevents this issue automatically
- Always commit migration files in `prisma/migrations/` to git
- Never use `prisma db push` in production
- Test migrations in staging before production deployment
- Monitor Vercel build logs for migration errors
- Use `npm run vercel:build` locally to test before deploying

**Troubleshooting Build Failures:**

If `vercel-build.js` fails, check the error message:

- **"DATABASE_URL environment variable is not set"**
  → Set DATABASE_URL in Vercel Project Settings

- **"Cannot connect to database"**
  → Verify database is running and accessible
  → Check DATABASE_URL format and credentials
  → Ensure database allows connections from Vercel IPs

- **"Migration deployment failed"**
  → Check database permissions
  → Verify migration files are not corrupted
  → Review Prisma migration logs

- **"Required tables are missing"** (after migrations)
  → Indicates migration SQL may be incomplete
  → Check migration files for all CREATE TABLE statements
  → May need to reset migrations (DEVELOPMENT ONLY)

**For More Details:**
- See [PRISMA_MIGRATION_GUIDE.md](./PRISMA_MIGRATION_GUIDE.md) for comprehensive migration management
- See `scripts/vercel-build.js` for the automated build script
- Check Vercel build logs for detailed output from the build script

---

### "relation does not exist"

**Issue:** Database tables not created

**Solutions:**

1. **Run database initialization:**
   ```bash
   # Backend should auto-initialize on first run
   # Check logs for:
   # ✅ Database initialized successfully
   ```

2. **Manual initialization:**
   ```bash
   psql $DATABASE_URL
   
   # Check if tables exist
   \dt
   
   # If empty, restart backend - it will create tables
   ```

3. **Check permissions:**
   ```sql
   -- Verify user has permissions
   SELECT * FROM information_schema.table_privileges 
   WHERE grantee = 'your_db_user';
   ```

---

### Slow Query Performance

**Issue:** Database queries taking too long

**Solutions:**

1. **Add indexes:**
   ```sql
   -- Already included in schema, but verify:
   CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
   CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
   ```

2. **Use connection pooling:**
   ```javascript
   // Already configured in pg Pool
   // Adjust pool size if needed:
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     max: 20  // Increase pool size
   });
   ```

3. **Optimize queries:**
   ```sql
   -- Use EXPLAIN to analyze
   EXPLAIN ANALYZE SELECT * FROM trades WHERE user_id = 1;
   ```

4. **Implement caching:**
   ```bash
   npm install ioredis
   # Cache frequently accessed data
   ```

---

## 🔒 SECURITY CONCERNS

### Exposed API Keys in Frontend

**Issue:** Sensitive keys visible in browser

**Solution:**

**NEVER put these in frontend:**
- ❌ Database credentials
- ❌ JWT_SECRET
- ❌ Stripe SECRET key
- ❌ SMTP password
- ❌ API secrets

**Safe for frontend:**
- ✅ Stripe PUBLISHABLE key
- ✅ Backend API URL
- ✅ WebSocket URL

---

### Suspected Unauthorized Access

**Actions:**

1. **Immediately rotate all secrets:**
   ```bash
   # Generate new JWT secret
   openssl rand -base64 32
   
   # Update .env
   JWT_SECRET=new-secret-here
   
   # Restart server (invalidates all tokens)
   ```

2. **Check audit logs:**
   ```sql
   SELECT * FROM audit_logs 
   WHERE created_at >= NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

3. **Review user activity:**
   ```sql
   SELECT * FROM users 
   WHERE last_login > NOW() - INTERVAL '1 hour';
   ```

4. **Enable 2FA for all users:**
   ```sql
   -- Require 2FA setup on next login
   UPDATE users SET two_fa_enabled = false;
   ```

---

## 📈 PERFORMANCE ISSUES

### Server Running Slow

**Solutions:**

1. **Check server resources:**
   ```bash
   # Memory usage
   free -h
   
   # CPU usage
   top
   
   # Process stats
   ps aux | grep node
   ```

2. **Enable compression:**
   ```javascript
   // Already included, verify:
   const compression = require('compression');
   app.use(compression());
   ```

3. **Add caching:**
   ```javascript
   // Install Redis
   npm install ioredis
   
   // Cache expensive queries
   const redis = new Redis(process.env.REDIS_URL);
   ```

4. **Optimize database:**
   ```sql
   -- Analyze and vacuum
   ANALYZE;
   VACUUM;
   ```

5. **Use CDN for static assets**

---

## 🚀 DEPLOYMENT ISSUES

### Railway Deployment Fails

**Issue:** Build or deploy errors

**Solutions:**

1. **Check build logs:**
   ```bash
   railway logs
   ```

2. **Verify package.json:**
   ```json
   {
     "scripts": {
       "start": "node server.js"  // Must have start script
     },
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```

3. **Environment variables:**
   - Set all required .env variables in Railway dashboard
   - Don't commit .env to git

4. **Port configuration:**
   ```javascript
   // Use Railway's PORT
   const PORT = process.env.PORT || 5000;
   ```

---

## ❓ FREQUENTLY ASKED QUESTIONS

### Q: How do I reset my password in the database?

```sql
-- Option 1: Use password reset flow (recommended)
-- Option 2: Manual reset
UPDATE users 
SET password_hash = '$2b$12$...'  -- Generate with bcrypt
WHERE email = 'user@example.com';
```

### Q: How do I add a new trading robot?

```sql
INSERT INTO trading_robots 
(id, name, description, strategy, timeframe, risk_level, win_rate)
VALUES 
('my_robot', 'My Robot', 'My Strategy', 'Custom', 'M15', 'Medium', 65.0);
```

### Q: How do I manually close all positions?

```sql
UPDATE trades 
SET status = 'closed', close_time = NOW()
WHERE user_id = YOUR_USER_ID AND status = 'open';
```

### Q: How do I view audit logs for a user?

```sql
SELECT * FROM audit_logs 
WHERE user_id = YOUR_USER_ID 
ORDER BY created_at DESC 
LIMIT 100;
```

### Q: How do I check subscription status?

```sql
SELECT u.username, s.plan, s.status, s.current_period_end
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.id = YOUR_USER_ID;
```

### Q: How do I enable test mode for payments?

Just use Stripe TEST API keys (sk_test_...). No real charges will be made.

### Q: Can I use this with a broker other than MT5?

Yes, but you'll need to implement a different API integration. The structure supports any trading platform.

### Q: How do I backup the database?

```bash
# Automatic (Railway provides this)
# Manual:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore:
psql $DATABASE_URL < backup_20240107.sql
```

---

## 🆘 Still Stuck?

1. **Check the logs** - Most issues show up in logs
2. **Search error message** - Copy exact error to Google
3. **Test in isolation** - Test each component separately
4. **Use curl/Postman** - Verify API works outside frontend
5. **Check environment** - Verify all .env variables are set

---

## 📞 Getting Additional Help

**Before asking for help, provide:**

1. **Error message** (full text)
2. **What you tried** (steps taken)
3. **Environment** (dev/prod, OS, Node version)
4. **Logs** (relevant portions)
5. **Code** (if you modified anything)

**DO NOT share:**
- Database passwords
- API keys
- JWT secrets
- User data

---

## ✅ Prevention Checklist

Use this before deploying:

- [ ] All .env variables set
- [ ] Database connection tested
- [ ] Email system tested
- [ ] Stripe in test mode
- [ ] All endpoints tested
- [ ] Error handling in place
- [ ] Rate limiting configured
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Logs monitoring set up
- [ ] Backups automated
- [ ] Security audit done

---

**Most issues are configuration-related. Double-check your .env file! 🔍**
