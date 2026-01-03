#!/bin/bash

# AlgoEdge Setup Script
# This script helps you set up the AlgoEdge trading platform

set -e

echo "================================"
echo "   AlgoEdge Setup Script"
echo "================================"
echo ""

# Check Node.js version
echo "✓ Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18 or higher is required. You have $(node -v)"
    exit 1
fi
echo "✓ Node.js version: $(node -v)"

# Check PostgreSQL
echo ""
echo "✓ Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  Warning: PostgreSQL not found. Please install PostgreSQL 15+ manually."
    read -p "Continue anyway? (y/N): " continue_setup
    if [ "$continue_setup" != "y" ] && [ "$continue_setup" != "Y" ]; then
        exit 1
    fi
else
    echo "✓ PostgreSQL found"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Setup environment file
echo ""
echo "📝 Setting up environment file..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env file from template"
    echo ""
    echo "⚠️  IMPORTANT: You must configure your .env file before running the application!"
    echo ""
    echo "Required configuration:"
    echo "  1. DATABASE_URL      - PostgreSQL connection string"
    echo "  2. JWT_SECRET        - Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    echo "  3. SMTP_HOST         - Email server (e.g., smtp.gmail.com)"
    echo "  4. SMTP_PORT         - Email port (usually 587)"
    echo "  5. SMTP_USER         - Your email address"
    echo "  6. SMTP_PASS         - Your email password or app-specific password"
    echo "  7. SMTP_FROM         - From address (e.g., 'AlgoEdge <noreply@algoedge.com>')"
    echo "  8. NEXT_PUBLIC_APP_URL - Your application URL"
    echo ""
    echo "Please edit .env now and configure these required variables."
    echo ""
    read -p "Press Enter after you've configured .env to continue..."
else
    echo "✓ .env file already exists"
fi

# Validate environment variables
echo ""
echo "🔍 Validating environment configuration..."

validate_env() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        echo "  ❌ $var_name is not set"
        return 1
    fi
    
    # Check if it's still the example value
    if [[ "$var_value" == *"your-"* ]] || [[ "$var_value" == *"change-this"* ]]; then
        echo "  ⚠️  $var_name appears to be using example value"
        return 1
    fi
    
    return 0
}

# Load environment variables
set -a
source .env 2>/dev/null || true
set +a

validation_failed=0

# Check required variables
required_vars=("DATABASE_URL" "JWT_SECRET" "SMTP_HOST" "SMTP_PORT" "SMTP_USER" "SMTP_PASS" "SMTP_FROM" "NEXT_PUBLIC_APP_URL")

for var in "${required_vars[@]}"; do
    if ! validate_env "$var"; then
        validation_failed=1
    else
        echo "  ✓ $var is configured"
    fi
done

if [ $validation_failed -eq 1 ]; then
    echo ""
    echo "❌ Environment validation failed!"
    echo "   Please check and update your .env file with valid values."
    echo "   See .env.example for reference."
    echo ""
    exit 1
fi

echo "✓ Environment configuration looks good"

# Initialize database
echo ""
echo "🔧 Initializing database..."
npm run db:init

if [ $? -eq 0 ]; then
    echo "✓ Database initialized successfully"
else
    echo "❌ Database initialization failed"
    echo "   Please check your DATABASE_URL and ensure PostgreSQL is running"
    exit 1
fi

echo ""
echo "================================"
echo "   Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Seed the database (optional but recommended):"
echo "   npm run seed:admin    # Create default admin user"
echo "   npm run seed:robots   # Add trading robots"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For production deployment, see DEPLOYMENT.md"
echo ""
