# Load Testing Guide for AlgoEdge

This guide provides instructions for load testing the AlgoEdge backend API using k6, a modern load testing tool.

## Prerequisites

### Install k6

**Windows (with Chocolatey):**
```powershell
choco install k6
```

**Windows (with winget):**
```powershell
winget install k6 --source winget
```

**macOS:**
```bash
brew install k6
```

**Linux (Debian/Ubuntu):**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Test Scripts

### 1. Basic API Health Check (load-test-health.js)
Tests the health endpoint with ramping virtual users.

### 2. Authentication Flow (load-test-auth.js)
Tests login/register endpoints under load.

### 3. Full API Test (load-test-full.js)
Comprehensive test covering multiple API endpoints.

## Running Tests

### Against Local Backend
```bash
k6 run --env BASE_URL=http://localhost:5000 load-test-health.js
```

### Against Production (Railway)
```bash
k6 run --env BASE_URL=https://algoedge-production.up.railway.app load-test-full.js
```

### With Custom VU Count
```bash
k6 run --vus 50 --duration 60s load-test-health.js
```

## Performance Targets

| Metric | Target | Acceptable |
|--------|--------|------------|
| Response Time (p95) | < 500ms | < 1000ms |
| Response Time (p99) | < 1000ms | < 2000ms |
| Error Rate | < 1% | < 5% |
| Throughput | > 100 req/s | > 50 req/s |

## Interpreting Results

k6 outputs metrics including:
- **http_req_duration**: Response time statistics
- **http_reqs**: Total requests made
- **http_req_failed**: Failed request percentage
- **iterations**: Number of complete script iterations

## Tips for Production Testing

1. **Start small**: Begin with 10-20 VUs and gradually increase
2. **Monitor backend**: Watch Railway metrics during tests
3. **Database impact**: Monitor PostgreSQL connections
4. **Rate limiting**: Be aware of rate limits (current: 100 req/IP/15min)
5. **Schedule tests**: Run during low-traffic periods
6. **Alert stakeholders**: Notify team before production load tests

## Scaling Recommendations

Based on test results, consider:
- Increasing Railway dyno count
- Adding database connection pooling
- Implementing Redis caching
- CDN for static assets (already via Vercel)
