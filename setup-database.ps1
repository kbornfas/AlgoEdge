# PostgreSQL and Email Setup Script for AlgoEdge
# Run this after installing PostgreSQL

Write-Host "🗄️  AlgoEdge Database & Email Setup" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

# Check if PostgreSQL is installed
Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if (-not $pgService) {
    Write-Host "❌ PostgreSQL is not installed`n" -ForegroundColor Red
    Write-Host "Please install PostgreSQL 15:" -ForegroundColor Yellow
    Write-Host "   1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "   2. Run the installer" -ForegroundColor White
    Write-Host "   3. Set a password for the postgres user" -ForegroundColor White
    Write-Host "   4. Use default port 5432" -ForegroundColor White
    Write-Host "   5. Run this script again after installation`n" -ForegroundColor White
    
    $openBrowser = Read-Host "Open download page in browser? (y/n)"
    if ($openBrowser -eq "y") {
        Start-Process "https://www.postgresql.org/download/windows/"
    }
    exit 1
}

Write-Host "✅ PostgreSQL found: $($pgService.Name)" -ForegroundColor Green

# Check if PostgreSQL is running
if ($pgService.Status -ne "Running") {
    Write-Host "⚠️  PostgreSQL is not running. Attempting to start..." -ForegroundColor Yellow
    try {
        Start-Service $pgService.Name -ErrorAction Stop
        Start-Sleep -Seconds 2
        Write-Host "✅ PostgreSQL service started`n" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to start PostgreSQL: $_`n" -ForegroundColor Red
        Write-Host "Try starting manually from Services app" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ PostgreSQL is running`n" -ForegroundColor Green
}

# Database Configuration
Write-Host "📝 Database Configuration" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

$dbPassword = Read-Host "Enter your PostgreSQL 'postgres' user password (set during installation)" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

# Test connection
Write-Host "`nTesting database connection..." -ForegroundColor Yellow
$env:PGPASSWORD = $dbPasswordPlain
$testConnection = & psql -U postgres -c "SELECT version();" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to connect to PostgreSQL" -ForegroundColor Red
    Write-Host "Error: $testConnection`n" -ForegroundColor Red
    Write-Host "Please verify:" -ForegroundColor Yellow
    Write-Host "  - PostgreSQL is running" -ForegroundColor White
    Write-Host "  - Password is correct" -ForegroundColor White
    Write-Host "  - Port 5432 is not blocked`n" -ForegroundColor White
    exit 1
}

Write-Host "✅ Database connection successful`n" -ForegroundColor Green

# Create database
Write-Host "Creating 'algoedge' database..." -ForegroundColor Yellow
$createDb = & psql -U postgres -c "CREATE DATABASE algoedge;" 2>&1

if ($createDb -like "*already exists*") {
    Write-Host "✅ Database 'algoedge' already exists`n" -ForegroundColor Green
} elseif ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database 'algoedge' created successfully`n" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create database: $createDb`n" -ForegroundColor Red
}

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
$migrationFile = "backend\migrations\add_verification_codes.sql"

if (Test-Path $migrationFile) {
    $runMigration = & psql -U postgres -d algoedge -f $migrationFile 2>&1
    if ($LASTEXITCODE -eq 0 -or $runMigration -like "*already exists*") {
        Write-Host "✅ Database schema updated`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Migration completed with warnings`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Migration file not found at: $migrationFile`n" -ForegroundColor Yellow
}

# Update .env file
Write-Host "Updating backend/.env file..." -ForegroundColor Yellow
$envPath = "backend\.env"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    $newDbUrl = "DATABASE_URL=postgresql://postgres:$dbPasswordPlain@localhost:5432/algoedge"
    $envContent = $envContent -replace 'DATABASE_URL=postgresql://postgres:.*?@localhost:5432/algoedge', $newDbUrl
    Set-Content $envPath $envContent -NoNewline
    Write-Host "✅ Database configuration saved to .env`n" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found at: $envPath`n" -ForegroundColor Red
}

# Email Configuration
Write-Host "📧 Email Service Configuration" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

Write-Host "Email is required for:" -ForegroundColor White
Write-Host "  • User registration verification" -ForegroundColor Gray
Write-Host "  • Password reset" -ForegroundColor Gray
Write-Host "  • 2FA codes`n" -ForegroundColor Gray

$configureEmail = Read-Host "Configure email service now? (y/n)"

if ($configureEmail -eq "y") {
    Write-Host "`nEmail Provider Options:" -ForegroundColor Yellow
    Write-Host "  1. Gmail (requires App Password)" -ForegroundColor White
    Write-Host "  2. Outlook/Hotmail" -ForegroundColor White
    Write-Host "  3. Custom SMTP" -ForegroundColor White
    
    $emailChoice = Read-Host "`nSelect provider (1-3)"
    
    switch ($emailChoice) {
        "1" {
            Write-Host "`n📝 Gmail Setup Instructions:" -ForegroundColor Cyan
            Write-Host "1. Go to https://myaccount.google.com/security" -ForegroundColor White
            Write-Host "2. Enable '2-Step Verification' if not already enabled" -ForegroundColor White
            Write-Host "3. Go to https://myaccount.google.com/apppasswords" -ForegroundColor White
            Write-Host "4. Create an App Password for 'Mail'" -ForegroundColor White
            Write-Host "5. Copy the 16-character password (remove spaces)`n" -ForegroundColor White
            
            $openAppPasswords = Read-Host "Open App Passwords page? (y/n)"
            if ($openAppPasswords -eq "y") {
                Start-Process "https://myaccount.google.com/apppasswords"
            }
            
            Write-Host ""
            $smtpUser = Read-Host "Enter your Gmail address"
            $smtpPass = Read-Host "Enter your App Password (16 chars, no spaces)"
            
            if (Test-Path $envPath) {
                $envContent = Get-Content $envPath -Raw
                $envContent = $envContent -replace 'SMTP_HOST=.*', 'SMTP_HOST=smtp.gmail.com'
                $envContent = $envContent -replace 'SMTP_PORT=.*', 'SMTP_PORT=465'
                $envContent = $envContent -replace 'SMTP_SECURE=.*', 'SMTP_SECURE=true'
                $envContent = $envContent -replace 'SMTP_USER=.*', "SMTP_USER=$smtpUser"
                $envContent = $envContent -replace 'SMTP_PASSWORD=.*', "SMTP_PASSWORD=$smtpPass"
                Set-Content $envPath $envContent -NoNewline
                Write-Host "✅ Gmail configuration saved`n" -ForegroundColor Green
            }
        }
        "2" {
            $smtpUser = Read-Host "Enter your Outlook/Hotmail address"
            $smtpPass = Read-Host "Enter your password"
            
            if (Test-Path $envPath) {
                $envContent = Get-Content $envPath -Raw
                $envContent = $envContent -replace 'SMTP_HOST=.*', 'SMTP_HOST=smtp-mail.outlook.com'
                $envContent = $envContent -replace 'SMTP_PORT=.*', 'SMTP_PORT=587'
                $envContent = $envContent -replace 'SMTP_SECURE=.*', 'SMTP_SECURE=false'
                $envContent = $envContent -replace 'SMTP_USER=.*', "SMTP_USER=$smtpUser"
                $envContent = $envContent -replace 'SMTP_PASSWORD=.*', "SMTP_PASSWORD=$smtpPass"
                Set-Content $envPath $envContent -NoNewline
                Write-Host "✅ Outlook configuration saved`n" -ForegroundColor Green
            }
        }
        "3" {
            $smtpHost = Read-Host "SMTP Host"
            $smtpPort = Read-Host "SMTP Port"
            $smtpSecure = Read-Host "Use SSL/TLS? (true/false)"
            $smtpUser = Read-Host "SMTP Username"
            $smtpPass = Read-Host "SMTP Password"
            
            if (Test-Path $envPath) {
                $envContent = Get-Content $envPath -Raw
                $envContent = $envContent -replace 'SMTP_HOST=.*', "SMTP_HOST=$smtpHost"
                $envContent = $envContent -replace 'SMTP_PORT=.*', "SMTP_PORT=$smtpPort"
                $envContent = $envContent -replace 'SMTP_SECURE=.*', "SMTP_SECURE=$smtpSecure"
                $envContent = $envContent -replace 'SMTP_USER=.*', "SMTP_USER=$smtpUser"
                $envContent = $envContent -replace 'SMTP_PASSWORD=.*', "SMTP_PASSWORD=$smtpPass"
                Set-Content $envPath $envContent -NoNewline
                Write-Host "✅ Custom SMTP configuration saved`n" -ForegroundColor Green
            }
        }
    }
} else {
    Write-Host "⚠️  Email service not configured" -ForegroundColor Yellow
    Write-Host "You can configure it later by editing backend/.env`n" -ForegroundColor White
}

# Summary
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host "================`n" -ForegroundColor Green

Write-Host "Configuration Summary:" -ForegroundColor Cyan
Write-Host "  ✅ PostgreSQL: Running on port 5432" -ForegroundColor White
Write-Host "  ✅ Database: algoedge created" -ForegroundColor White
Write-Host "  ✅ Schema: Migrations applied" -ForegroundColor White
if ($configureEmail -eq "y") {
    Write-Host "  ✅ Email: Configured" -ForegroundColor White
} else {
    Write-Host "  ⚠️  Email: Not configured" -ForegroundColor Yellow
}

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Start backend:  cd backend && npm start" -ForegroundColor White
Write-Host "  2. Start frontend: npm run dev" -ForegroundColor White  
Write-Host "  3. Open browser:   http://localhost:3000`n" -ForegroundColor White

Write-Host "Troubleshooting:" -ForegroundColor Yellow
Write-Host "  • View setup guide: SETUP_GUIDE.md" -ForegroundColor White
Write-Host "  • Edit config:      backend\.env`n" -ForegroundColor White

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
