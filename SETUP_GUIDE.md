# AlgoEdge Setup Guide

## 1. Install PostgreSQL

### Option A: Download from Official Website (Recommended)
1. Download PostgreSQL 15 from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - Set a password for the postgres user (remember this!)
   - Use default port: 5432
   - Default locale is fine
4. Complete the installation

### Option B: Using Chocolatey
```powershell
choco install postgresql15 -y
```

### After Installation:
1. Verify PostgreSQL is running:
   ```powershell
   Get-Service -Name postgresql*
   ```

2. Create the database:
   ```powershell
   # Open psql (PostgreSQL command line)
   psql -U postgres
   
   # In psql, run:
   CREATE DATABASE algoedge;
   \q
   ```

3. Update `backend/.env` with your PostgreSQL password:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/algoedge
   ```

4. Run the database migrations:
   ```powershell
   cd backend
   psql -U postgres -d algoedge -f migrations/add_verification_codes.sql
   ```

## 2. Configure Gmail for Email Service

### Step 1: Enable 2-Step Verification
1. Go to https://myaccount.google.com/security
2. Find "2-Step Verification" and enable it
3. Follow the setup process

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Windows Computer" as the device
4. Click "Generate"
5. Copy the 16-character password (it will have spaces, remove them)

### Step 3: Update .env File
Edit `backend/.env`:
```env
SMTP_USER=your-actual-email@gmail.com
SMTP_PASSWORD=your16charpassword
```

**Important**: 
- Don't use your regular Gmail password
- Remove all spaces from the app password
- Don't share this password

### Alternative Email Providers:

#### Using Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

#### Using SendGrid (Recommended for Production):
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

## 3. Start the Application

### Start Backend:
```powershell
cd backend
npm start
```

### Start Frontend:
```powershell
cd ..
npm run dev
```

## 4. Verify Everything Works

1. **Backend Running**: Check http://localhost:5000/api/health
2. **Frontend Running**: Open http://localhost:3000
3. **Database Connected**: No database errors in backend console
4. **Email Service**: Try registration/password reset features

## Troubleshooting

### PostgreSQL Won't Start
```powershell
# Check service status
Get-Service -Name postgresql*

# Start service
Start-Service postgresql-x64-15
```

### Database Connection Refused
- Verify PostgreSQL is running
- Check the password in DATABASE_URL
- Ensure database 'algoedge' exists

### Email Service Errors
- Verify 2-Step Verification is enabled
- Make sure you're using an App Password, not your regular password
- Remove all spaces from the app password
- Check that SMTP_USER matches the email that generated the app password

### Port Already in Use
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

## 5. MetaAPI Configuration (Optional)

The system is already configured with a MetaAPI token in `backend/.env`. To use real MT5 trading:

1. Go to https://metaapi.cloud/
2. Create an account
3. Get your API token
4. Add your MT5 broker account to MetaAPI
5. Update `METAAPI_TOKEN` in `backend/.env`

Note: Currently, MetaAPI SDK has Node.js compatibility issues, so a mock implementation is used. The mock provides the same interface for testing.

## Next Steps

- Set up real broker credentials in MetaAPI dashboard
- Configure payment processing with Stripe
- Set up production environment variables
- Deploy to a hosting service (AWS, Heroku, DigitalOcean, etc.)
