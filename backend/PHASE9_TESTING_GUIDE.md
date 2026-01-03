# Phase 9: Authentication Error Handling - Manual Testing Guide

This document provides comprehensive manual testing procedures for QA/ops teams to verify authentication error handling and validation.

## Overview

Phase 9 focuses on robust error handling for:
- Registration API with validation and error scenarios
- Login API with validation and error scenarios
- Server startup validation with missing environment variables
- Clear, actionable, and traceable error messages

## Test Environment Setup

### Prerequisites
1. PostgreSQL database running
2. Node.js 18+ installed
3. Backend server configured

### Environment Configuration
```bash
cd backend
cp .env.example .env
# Edit .env and set required variables
npm install
```

## Automated Test Suite

### Running All Tests
```bash
cd backend
npm test
```

### Running Specific Test Suites
```bash
# Registration tests
npm test -- registration.test.js

# Login tests
npm test -- login.test.js

# Startup tests
npm test -- startup.test.js
```

### Test Coverage
```bash
npm run test:coverage
```

## Manual Testing Procedures

### 1. Registration API Tests

#### 1.1 Missing Fields Validation

**Test Case: Missing Username**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```
**Expected Result:**
- Status: 400
- Error: "All fields are required"
- Message is clear and actionable

**Test Case: Missing Email**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```
**Expected Result:**
- Status: 400
- Error: "All fields are required"

**Test Case: Missing Password**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com"
  }'
```
**Expected Result:**
- Status: 400
- Error: "All fields are required"

#### 1.2 Password Validation

**Test Case: Password Too Short**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "short"
  }'
```
**Expected Result:**
- Status: 400
- Error: "Password must be at least 8 characters"
- Message specifies exact requirement (8 characters)

#### 1.3 Duplicate Constraint Tests

**Test Case: Duplicate Email**
```bash
# First registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user1",
    "email": "duplicate@example.com",
    "password": "password123"
  }'

# Second registration with same email
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user2",
    "email": "duplicate@example.com",
    "password": "password123"
  }'
```
**Expected Result:**
- Status: 400
- Error: "User already exists"
- Clear indication that duplicate is not allowed

**Test Case: Duplicate Username**
```bash
# First registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "duplicateuser",
    "email": "user1@example.com",
    "password": "password123"
  }'

# Second registration with same username
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "duplicateuser",
    "email": "user2@example.com",
    "password": "password123"
  }'
```
**Expected Result:**
- Status: 400
- Error: "User already exists"

#### 1.4 Database Connection Failure

**Test Case: Simulate Database Failure**
```bash
# Stop the database temporarily
sudo systemctl stop postgresql

# Attempt registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Restart database
sudo systemctl start postgresql
```
**Expected Result:**
- Status: 500
- Error: "Registration failed"
- Error message is user-friendly
- No database internals exposed

#### 1.5 Successful Registration

**Test Case: Valid Registration**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "password123"
  }'
```
**Expected Result:**
- Status: 201
- Message: "Registration successful! Please check your email for the verification code."
- Returns user object with id, username, email
- isVerified: false
- requiresVerification: true

### 2. Login API Tests

#### 2.1 Missing Credentials

**Test Case: Missing Username**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "password123"
  }'
```
**Expected Result:**
- Status: 400
- Error: "Username and password required"

**Test Case: Missing Password**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser"
  }'
```
**Expected Result:**
- Status: 400
- Error: "Username and password required"

#### 2.2 Invalid Credentials

**Test Case: Non-existent User**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nonexistentuser",
    "password": "password123"
  }'
```
**Expected Result:**
- Status: 401
- Error: "Invalid credentials"
- Does NOT reveal if user exists

**Test Case: Wrong Password**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "existinguser",
    "password": "wrongpassword"
  }'
```
**Expected Result:**
- Status: 401
- Error: "Invalid credentials"
- Does NOT reveal which credential is wrong

#### 2.3 Successful Login

**Test Case: Valid Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "existinguser",
    "password": "password123"
  }'
```
**Expected Result:**
- Status: 200
- Returns JWT token
- Returns user object (id, username, email, isVerified)
- Token is valid JWT format

#### 2.4 Login with Email

**Test Case: Login Using Email**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "password123"
  }'
```
**Expected Result:**
- Status: 200
- Successfully logs in using email instead of username
- Returns token and user object

### 3. Server Startup Tests

#### 3.1 Missing JWT_SECRET

**Test Case: Start Without JWT_SECRET**
```bash
cd backend
# Temporarily rename .env
mv .env .env.backup

# Create .env without JWT_SECRET
cat > .env << EOF
DATABASE_URL=postgresql://user:pass@localhost:5432/algoedge
PORT=3000
EOF

# Try to start server
npm start
```
**Expected Result:**
- Server fails to start immediately
- Error message: "STARTUP FAILED: Missing required environment variables"
- Lists missing variables (JWT_SECRET)
- Provides actionable steps to fix
- Exit code: 1

**Cleanup:**
```bash
mv .env.backup .env
```

#### 3.2 Missing DATABASE_URL

**Test Case: Start Without DATABASE_URL**
```bash
cd backend
# Create .env without DATABASE_URL
cat > .env << EOF
JWT_SECRET=test-secret-key
PORT=3000
EOF

# Try to start server
npm start
```
**Expected Result:**
- Server starts in limited mode
- Warning message: "DATABASE_URL not set. Database features will be unavailable."
- Server continues running
- API endpoints return appropriate errors for database operations

#### 3.3 Successful Startup

**Test Case: Start With All Required Variables**
```bash
cd backend
# Ensure .env has all required variables
cat > .env << EOF
DATABASE_URL=postgresql://user:pass@localhost:5432/algoedge
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
EOF

# Start server
npm start
```
**Expected Result:**
- Server starts successfully
- Log: "✓ Database initialized"
- Log: "✓ WebSocket initialized"
- Log: "🚀 AlgoEdge Backend Server"
- Log: "Server running on port: 3000"

## Error Message Quality Checklist

For all error messages, verify they meet these criteria:

### 1. Clarity
- [ ] Error message is easy to understand
- [ ] Uses plain language, not technical jargon
- [ ] Length is reasonable (< 100 characters)

### 2. Actionability
- [ ] Tells user what went wrong
- [ ] Suggests how to fix the issue
- [ ] Uses keywords: "required", "must", "invalid", "already"

### 3. Traceability
- [ ] Consistent format across all endpoints
- [ ] Returns error in { "error": "message" } format
- [ ] Appropriate HTTP status codes used
- [ ] Can be easily logged and searched

### 4. Security
- [ ] Does not expose sensitive information
- [ ] Does not reveal system internals
- [ ] Does not help attackers enumerate users
- [ ] Generic messages for authentication failures

## HTTP Status Code Reference

| Status Code | Usage | Example |
|-------------|-------|---------|
| 200 | Successful request | Login success |
| 201 | Resource created | Registration success |
| 400 | Bad request / validation error | Missing fields, invalid format |
| 401 | Authentication failed | Invalid credentials |
| 429 | Too many requests | Rate limit exceeded |
| 500 | Server error | Database connection failed |

## Logging and Monitoring

### Checking Server Logs
```bash
# View real-time logs
cd backend
npm start | tee server.log

# Search for specific errors
grep "error" server.log
grep "failed" server.log
grep "⚠️" server.log
grep "❌" server.log
```

### Key Log Patterns

**Successful Operations:**
- ✅ Database connected
- ✓ Database initialized
- ✓ WebSocket initialized
- 🚀 AlgoEdge Backend Server

**Warnings:**
- ⚠️ Database connection failed
- ⚠️ MT5 initialization failed
- ⚠️ OTP email failed

**Errors:**
- ❌ STARTUP FAILED
- ❌ Unexpected database error
- ❌ Error initializing database

## Troubleshooting Guide

### Registration Fails with "Registration failed"
1. Check database connection
2. Verify DATABASE_URL in .env
3. Check PostgreSQL is running: `sudo systemctl status postgresql`
4. Review server logs for detailed error

### Login Fails with "Login failed"
1. Check database connection
2. Verify user exists in database
3. Check password is correct
4. Review server logs

### Server Won't Start
1. Verify all required environment variables are set
2. Check JWT_SECRET is present
3. Verify port is not in use: `lsof -i :3000`
4. Check file permissions
5. Review error messages for specific issues

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check DATABASE_URL format
3. Test connection: `psql $DATABASE_URL`
4. Check network connectivity
5. Verify credentials

## Test Result Documentation

For QA reporting, document results in this format:

```
Test Case: [Name]
Date: [YYYY-MM-DD]
Tester: [Name]
Environment: [Dev/Staging/Production]

Input:
  [Request details]

Expected Result:
  Status: [Code]
  Response: [Expected]

Actual Result:
  Status: [Code]
  Response: [Actual]

Pass/Fail: [Result]
Notes: [Any observations]
```

## Automated Test Results

After running the test suite, verify:
- [ ] All registration tests pass
- [ ] All login tests pass
- [ ] All startup tests pass
- [ ] Error messages meet quality criteria
- [ ] Test coverage > 80%

## Sign-off Checklist

- [ ] All automated tests pass
- [ ] All manual tests completed
- [ ] Error messages are clear and actionable
- [ ] Server startup validates environment
- [ ] Documentation is complete
- [ ] QA team has verified all scenarios
- [ ] Security considerations addressed
- [ ] Ready for production deployment
