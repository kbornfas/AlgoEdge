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

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Setup environment files
echo ""
echo "📝 Setting up environment files..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created frontend .env file"
    echo "⚠️  Please edit .env and add your configuration"
else
    echo "✓ Frontend .env already exists"
fi

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✓ Created backend .env file"
    echo "⚠️  Please edit backend/.env and add your configuration"
    echo ""
    echo "Required configuration:"
    echo "  - DATABASE_URL (PostgreSQL connection)"
    echo "  - JWT_SECRET (run: openssl rand -base64 32)"
    echo "  - SMTP credentials (email service)"
    echo "  - Stripe keys (payment processing)"
else
    echo "✓ Backend .env already exists"
fi

echo ""
echo "================================"
echo "   Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure environment variables:"
echo "   - Edit backend/.env with your database and API keys"
echo "   - Edit .env with your backend URL"
echo ""
echo "2. Initialize the database:"
echo "   cd backend"
echo "   npm run init-db"
echo ""
echo "3. Start the development servers:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: npm run dev"
echo ""
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "For production deployment, see DEPLOYMENT.md"
echo ""
