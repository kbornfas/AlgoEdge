# AlgoEdge Setup Script for Windows
# This script helps you set up the AlgoEdge trading platform

Write-Host "================================" -ForegroundColor Cyan
Write-Host "   AlgoEdge Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Node.js is not installed. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}
$versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($versionNumber -lt 18) {
    Write-Host "Error: Node.js 18 or higher is required. You have $nodeVersion" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Install frontend dependencies
Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing frontend dependencies" -ForegroundColor Red
    exit 1
}

# Install backend dependencies
Write-Host ""
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing backend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Setup environment files
Write-Host ""
Write-Host "Setting up environment files..." -ForegroundColor Yellow

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "Created frontend .env file" -ForegroundColor Green
    Write-Host "Please edit .env and add your configuration" -ForegroundColor Yellow
} else {
    Write-Host "Frontend .env already exists" -ForegroundColor Green
}

if (-not (Test-Path backend\.env)) {
    Copy-Item backend\.env.example backend\.env
    Write-Host "Created backend .env file" -ForegroundColor Green
    Write-Host "Please edit backend\.env and add your configuration" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Required configuration:" -ForegroundColor Cyan
    Write-Host "  - DATABASE_URL (PostgreSQL connection)"
    Write-Host "  - JWT_SECRET (generate with: openssl rand -base64 32)"
    Write-Host "  - SMTP credentials (email service)"
    Write-Host "  - Stripe keys (payment processing)"
} else {
    Write-Host "Backend .env already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configure environment variables:"
Write-Host "   - Edit backend\.env with your database and API keys"
Write-Host "   - Edit .env with your backend URL"
Write-Host ""
Write-Host "2. Initialize the database:"
Write-Host "   cd backend"
Write-Host "   npm run init-db"
Write-Host ""
Write-Host "3. Start the development servers:"
Write-Host "   Terminal 1: cd backend; npm run dev"
Write-Host "   Terminal 2: npm run dev"
Write-Host ""
Write-Host "4. Open http://localhost:5173 in your browser"
Write-Host ""
Write-Host "For production deployment, see DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""
