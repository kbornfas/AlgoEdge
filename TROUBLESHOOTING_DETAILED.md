# AlgoEdge Troubleshooting Guide

This guide helps you diagnose and fix common issues with AlgoEdge deployment and registration.

## Table of Contents

1. [Environment Variable Issues](#environment-variable-issues)
2. [Database Connection Problems](#database-connection-problems)
3. [Registration Errors](#registration-errors)
4. [Login Issues](#login-issues)
5. [Email Sending Failures](#email-sending-failures)
6. [Migration Problems](#migration-problems)

---

## Environment Variable Issues

### Error: "Environment validation failed"

**Symptoms:**
- Application fails to start
- Error message lists missing environment variables

**Solution:**
1. Check your `.env` file exists in the project root
2. Ensure all required variables are set:
   ```bash
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   JWT_SECRET=your-32-character-or-longer-secret
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=AlgoEdge <noreply@algoedge.com>
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
3. Generate a secure JWT_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Error: "JWT_SECRET must be at least 32 characters"

**Solution:**
Generate a new strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Add it to your `.env` file as `JWT_SECRET=<generated-value>`

---

## Database Connection Problems

### Error: "Cannot reach database server (P1001)"

**Symptoms:**
- Database health check fails
- "Cannot reach database server" error

**Possible Causes & Solutions:**

1. **PostgreSQL not running**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql  # Linux
   brew services list                # macOS
   
   # Start PostgreSQL
   sudo systemctl start postgresql   # Linux
   brew services start postgresql    # macOS
   ```

2. **Incorrect DATABASE_URL**
   - Format: `postgresql://username:password@host:port/database`
   - Check username, password, host, port, and database name
   - Test connection: `psql $DATABASE_URL`

3. **Firewall blocking connection**
   - Ensure PostgreSQL port (default 5432) is open
   - Check firewall rules

4. **Database doesn't exist**
   ```bash
   # Create database
   createdb algoedge
   # Or using psql
   psql -U postgres -c "CREATE DATABASE algoedge;"
   ```

### Error: "Database authentication failed"

**Solution:**
1. Verify PostgreSQL username and password
2. Check `pg_hba.conf` for authentication settings
3. Update DATABASE_URL with correct credentials

### Error: "Database timeout (P1002, P2024)"

**Symptoms:**
- Slow database responses
- Connection pool timeout errors

**Solutions:**
1. Check database server load
2. Optimize slow queries
3. Increase connection pool timeout in `prisma.ts`
4. Scale database resources

---

## Registration Errors

### Error: "Email already registered"

**Symptoms:**
- User tries to register with existing email
- 400 Bad Request with specific error

**Solution:**
- Use a different email address
- Or login with existing account
- Admin can check/modify user in database if needed

### Error: "Invalid input data"

**Symptoms:**
- Validation error on form submission
- Error details show specific field issues

**Common Issues:**
1. **Password too short**: Must be at least 8 characters
2. **Invalid email format**: Must be valid email address
3. **Missing required fields**: First name, last name, email, password all required

**Solution:**
- Check error details for specific field issues
- Ensure all required fields are filled correctly
- Password must meet minimum length requirement

### Error: "Registration failed. Please try again."

**Symptoms:**
- Generic 500 error during registration
- No specific error message

**Debug Steps:**
1. Check server logs for detailed error
2. Verify database connection: `npm run db:check`
3. Ensure all tables exist: `npm run db:init`
4. Check Prisma client is generated: `npx prisma generate`

**Common Causes:**
- Database connection lost
- Prisma client not generated
- Missing database tables
- Transaction timeout

---

## Login Issues

### Error: "Invalid email or password"

**Symptoms:**
- Cannot login with credentials

**Solutions:**
1. Verify email and password are correct
2. Check if account exists in database
3. Try password reset if forgotten

### Error: "Account not activated"

**Symptoms:**
- Login rejected with activation error
- Shows payment status and approval status

**Requirements for activation:**
1. Email must be verified (check email for OTP)
2. Payment proof must be submitted
3. Admin must approve the account

**Steps:**
1. Verify email with OTP code
2. Submit payment proof on payment instructions page
3. Wait for admin approval

### Error: "Account has been rejected"

**Symptoms:**
- Login shows rejection message
- May include rejection reason

**Solution:**
- Contact support for assistance
- Admin may provide reason for rejection
- May need to create new account or resolve issues

### Error: "Two-factor authentication required"

**Symptoms:**
- Prompted for 2FA code after entering password

**Solution:**
- Enter the 6-digit code from your authenticator app
- If code doesn't work, ensure device time is synchronized

---

## Email Sending Failures

### Error: "Failed to send email"

**Symptoms:**
- Email verification not received
- Console shows email sending errors

**Solutions:**

1. **Gmail SMTP Issues**
   - Use App Password (not regular password)
   - Enable "Less secure app access" (if needed)
   - Generate App Password: https://myaccount.google.com/apppasswords

2. **SMTP Configuration**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-specific-password
   SMTP_FROM=AlgoEdge <noreply@algoedge.com>
   ```

3. **Check SMTP Credentials**
   ```bash
   # Test SMTP connection
   telnet smtp.gmail.com 587
   ```

4. **Rate Limiting**
   - Gmail has sending limits
   - Use professional SMTP service for production (SendGrid, Mailgun, etc.)

---

## Migration Problems

### Error: "P3005: The database schema is not empty"

**Symptoms:**
- Deployment fails with P3005 error
- Prisma migrate deploy fails because database already has schema
- Error message: "The database schema for `<database>` is not empty. Read more about how to baseline an existing production database"

**Common Scenario:**
This typically happens when:
1. Database was initialized with `prisma db push` instead of migrations
2. Migrations were applied manually and migration history is out of sync
3. Deploying to a database that was set up outside of Prisma Migrate

**Solutions:**

**Option 1: Sync Schema from Database (Recommended for existing databases)**
```bash
# 1. Pull current schema from database to update your Prisma schema
npx prisma db pull

# 2. Review the changes to ensure they match your expectations
git diff prisma/schema.prisma

# 3. If schema looks correct, generate Prisma client
npx prisma generate

# 4. Continue with your deployment
```

**Option 2: Mark Existing Migrations as Applied**
```bash
# If you know migrations are already applied but not tracked:
# List migrations in prisma/migrations/ directory
ls prisma/migrations/

# Mark specific migration as applied (replace with your migration name)
npx prisma migrate resolve --applied "20260102090350_add_approval_status_and_rejection_reason"

# Or use the helper script
npm run migrate:resolve

# Verify migration status
npx prisma migrate status
```

**Option 3: Baseline Production Database (For first-time migration setup)**
```bash
# 1. Create a baseline migration without applying it
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql

# 2. Mark the baseline as applied
npx prisma migrate resolve --applied 0_init

# 3. Continue with normal migrations
npx prisma migrate deploy
```

**Prevention:**
- Always use `prisma migrate deploy` in production environments
- Keep migration history consistent across environments
- Document your migration strategy in deployment guides
- Use helper scripts to handle migration conflicts

### Error: "Pending migrations detected"

**Symptoms:**
- Database check fails with pending migrations
- Schema out of sync

**Solution:**
```bash
# For production
npx prisma migrate deploy

# For development
npm run prisma:migrate
# or
npm run prisma:push
```

### Error: "Missing required tables"

**Symptoms:**
- Database health check lists missing tables
- Application fails to query tables

**Solution:**
```bash
# Initialize database
npm run db:init

# Or manually
npx prisma generate
npx prisma db push  # Development
npx prisma migrate deploy  # Production
```

### Error: "Prisma client not generated"

**Symptoms:**
- Import errors for Prisma client
- Type errors in code

**Solution:**
```bash
npx prisma generate
# or
npm run prisma:generate
```

---

## Quick Diagnostic Commands

Run these commands to diagnose issues:

```bash
# Check environment variables
npm run db:check

# Initialize/reset database
npm run db:init

# Generate Prisma client
npm run prisma:generate

# Check migration status
npx prisma migrate status

# View database schema
npx prisma studio

# Check application logs
npm run dev  # Watch for errors in console
```

---

## Getting Help

If you're still experiencing issues:

1. **Check Logs**: Look for detailed error messages in console output
2. **Enable Verbose Logging**: Set `NODE_ENV=development` in `.env`
3. **Verify Setup**: Ensure you completed all setup steps in `SETUP_GUIDE.md`
4. **Database State**: Use `npx prisma studio` to inspect database
5. **Contact Support**: Provide error logs and steps to reproduce

---

## Common Setup Checklist

Before reporting issues, verify:

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 15+ installed and running
- [ ] `.env` file exists with all required variables
- [ ] `DATABASE_URL` is correct and database exists
- [ ] `JWT_SECRET` is at least 32 characters
- [ ] SMTP credentials are valid
- [ ] Dependencies installed: `npm install`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Database initialized: `npm run db:init`
- [ ] Database health check passes: `npm run db:check`

---

*Last updated: January 2026*
