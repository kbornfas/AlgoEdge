# AlgoEdge Email Service Configuration Guide

## Quick Setup

This guide helps you configure the email notification system for AlgoEdge.

## Environment Variables

Add these to your `.env` file:

```env
# Required Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=AlgoEdge <noreply@algoedge.com>
```

## Provider-Specific Setup

### Gmail

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Configure**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # 16-char app password
   SMTP_FROM=AlgoEdge <noreply@algoedge.com>
   ```

### SendGrid

1. **Create API Key**
   - Go to https://app.sendgrid.com/settings/api_keys
   - Create a new API key with "Mail Send" permissions

2. **Configure**:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxx  # Your API key
   SMTP_FROM=AlgoEdge <noreply@yourdomain.com>
   ```

### AWS SES

1. **Create SMTP Credentials**
   - Go to AWS SES Console
   - Navigate to SMTP Settings
   - Create SMTP Credentials

2. **Configure**:
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # Your region
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=AKIAXXXXXXXXXXXXXXXX  # SMTP username
   SMTP_PASS=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # SMTP password
   SMTP_FROM=AlgoEdge <verified@yourdomain.com>
   ```

### Mailgun

1. **Get SMTP Credentials**
   - Go to https://app.mailgun.com/app/sending/domains
   - Select your domain
   - View SMTP credentials

2. **Configure**:
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=postmaster@yourdomain.mailgun.org
   SMTP_PASS=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SMTP_FROM=AlgoEdge <noreply@yourdomain.com>
   ```

## Testing Your Configuration

### 1. Start the Backend

```bash
cd backend
npm start
```

Look for this message:
```
✅ Email service ready
```

If you see an error, check your SMTP configuration.

### 2. Test OTP Email

Register a new user via the frontend or API:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

Check the email inbox for the OTP code.

### 3. Test Daily Report

Create some test trades, then run:

```bash
cd /path/to/AlgoEdge
node scripts/send-daily-reports.js
```

## Email Templates

### OTP Verification
- **When**: User registration
- **Contains**: 6-digit verification code
- **Expires**: 10 minutes

### Daily Trade Summary
- **When**: Daily (if user has trades)
- **Contains**: 
  - Daily P/L
  - Win rate
  - Trade statistics
  - Recent trades list
- **Frequency**: Once per day

### Trade Alerts
- **When**: Trade opened/closed
- **Contains**: Trade details and P/L

## Automation

### Using Cron (Linux/Mac)

Edit crontab:
```bash
crontab -e
```

Add daily report at 6 PM:
```
0 18 * * * cd /path/to/AlgoEdge && node scripts/send-daily-reports.js >> logs/email.log 2>&1
```

### Using PM2

```bash
pm2 start scripts/send-daily-reports.js --cron "0 18 * * *" --no-autorestart
```

### Using Node Cron

Add to your backend/server.js:

```javascript
import cron from 'node-cron';
import { sendDailyReportsToAllUsers } from './services/emailService.js';
import pool from './config/database.js';

// Send reports daily at 6 PM
cron.schedule('0 18 * * *', async () => {
  console.log('Sending daily reports...');
  await sendDailyReportsToAllUsers(pool);
});
```

## Troubleshooting

### "Email service not configured properly"
- Verify all SMTP_* variables are set
- Check for typos in variable names
- Restart the server after changes

### "Authentication failed"
- Verify SMTP username and password
- For Gmail: Use App Password, not regular password
- Check if 2FA is enabled (required for Gmail)

### Emails not received
- Check spam/junk folder
- Verify recipient email is valid
- Check server logs for errors
- Test with a different email provider

### "Connection timeout"
- Check firewall settings
- Verify SMTP port is not blocked
- Try port 465 with SMTP_SECURE=true

## Security Best Practices

1. **Never commit credentials**
   - Keep `.env` in `.gitignore`
   - Use environment variables in production

2. **Use App Passwords**
   - Don't use your main email password
   - Generate service-specific passwords

3. **Rotate credentials regularly**
   - Update SMTP passwords periodically
   - Revoke unused app passwords

4. **Monitor email logs**
   - Check for failed sends
   - Watch for suspicious activity

5. **Rate limiting**
   - The system includes 1-second delays
   - Consider additional rate limiting for production

## Support

For issues or questions:
- Check logs in backend console
- Review this guide
- Contact: kbonface03@gmail.com

---

**Last Updated**: January 2026
