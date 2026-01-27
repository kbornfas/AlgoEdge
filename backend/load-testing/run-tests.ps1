# AlgoEdge Load Testing Scripts
# Run these commands from the backend/load-testing directory

# -----------------------------------------
# Local Development Testing
# -----------------------------------------

# Quick health check (5 VUs, 30 seconds)
k6 run --vus 5 --duration 30s load-test-health.js

# Full local test
k6 run --env BASE_URL=http://localhost:5000 load-test-full.js

# -----------------------------------------
# Production Testing (Railway)
# -----------------------------------------

# Replace with your actual Railway URL
$PROD_URL = "https://algoedge-production.up.railway.app"

# Health check on production
k6 run --env BASE_URL=$PROD_URL load-test-health.js

# Auth flow test on production
k6 run --env BASE_URL=$PROD_URL load-test-auth.js

# Full production test (with auth token)
# Get a valid token from logging in, then:
k6 run --env BASE_URL=$PROD_URL --env AUTH_TOKEN="your-jwt-token-here" load-test-full.js

# -----------------------------------------
# Quick Smoke Test
# -----------------------------------------

# Minimal test to verify everything works
k6 run --vus 1 --duration 10s load-test-health.js
