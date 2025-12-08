# PostgreSQL Setup for AlgoEdge
Write-Host "AlgoEdge Database Setup" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

# Check PostgreSQL
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if (-not $pgService) {
    Write-Host "PostgreSQL not found. Please complete the installation first." -ForegroundColor Red
    exit 1
}

Write-Host "PostgreSQL service: $($pgService.Name)" -ForegroundColor Green

# Start PostgreSQL if not running
if ($pgService.Status -ne "Running") {
    Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
    Start-Service $pgService.Name
    Start-Sleep -Seconds 3
}

Write-Host "PostgreSQL is running" -ForegroundColor Green
Write-Host ""

# Get password
Write-Host "Database Configuration" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
$dbPassword = Read-Host "Enter your PostgreSQL 'postgres' user password"

# Test connection
Write-Host "Testing connection..." -ForegroundColor Yellow
$env:PGPASSWORD = $dbPassword
$test = & psql -U postgres -c "SELECT 1;" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to connect. Please check your password." -ForegroundColor Red
    exit 1
}

Write-Host "Connection successful!" -ForegroundColor Green
Write-Host ""

# Create database
Write-Host "Creating database..." -ForegroundColor Yellow
$createDb = & psql -U postgres -c "CREATE DATABASE algoedge;" 2>&1

if ($createDb -like "*already exists*") {
    Write-Host "Database 'algoedge' already exists" -ForegroundColor Green
} elseif ($LASTEXITCODE -eq 0) {
    Write-Host "Database 'algoedge' created" -ForegroundColor Green
}

# Run migrations
Write-Host "Running migrations..." -ForegroundColor Yellow
& psql -U postgres -d algoedge -f "backend\migrations\add_verification_codes.sql" 2>&1 | Out-Null
Write-Host "Migrations complete" -ForegroundColor Green
Write-Host ""

# Update .env
Write-Host "Updating configuration..." -ForegroundColor Yellow
$envPath = "backend\.env"
$envContent = Get-Content $envPath -Raw
$newDbUrl = "DATABASE_URL=postgresql://postgres:$dbPassword@localhost:5432/algoedge"
$envContent = $envContent -replace 'DATABASE_URL=postgresql://postgres:.*@localhost:5432/algoedge', $newDbUrl
Set-Content $envPath $envContent -NoNewline
Write-Host "Configuration updated" -ForegroundColor Green
Write-Host ""

Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "===============" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start backend:  cd backend && npm start" -ForegroundColor White
Write-Host "  2. Start frontend: npm run dev" -ForegroundColor White
Write-Host ""
