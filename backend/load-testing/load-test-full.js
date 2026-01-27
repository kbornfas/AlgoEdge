import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const requestCounter = new Counter('total_requests');

// Test configuration with multiple scenarios
export const options = {
  scenarios: {
    // Smoke test - verify basic functionality
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '0s',
      tags: { test_type: 'smoke' },
    },
    // Load test - normal expected load
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 0 },
      ],
      startTime: '35s',
      tags: { test_type: 'load' },
    },
    // Stress test - beyond normal capacity
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 150 },
        { duration: '1m', target: 150 },
        { duration: '30s', target: 0 },
      ],
      startTime: '2m40s',
      tags: { test_type: 'stress' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    errors: ['rate<0.05'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Simulated auth token (replace with actual test token for authenticated endpoints)
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN && { 'Authorization': `Bearer ${AUTH_TOKEN}` }),
};

export function setup() {
  console.log(`\n🚀 Starting comprehensive load test against ${BASE_URL}`);
  console.log(`   Auth Token: ${AUTH_TOKEN ? 'Provided' : 'Not provided (some tests will skip)'}\n`);
  
  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`API health check failed: ${healthCheck.status}`);
  }
  
  return { 
    startTime: new Date().toISOString(),
    baseUrl: BASE_URL,
  };
}

export default function () {
  // Randomly select test group to simulate varied user behavior
  const testGroups = [
    testHealthEndpoints,
    testPublicEndpoints,
    testMarketplaceEndpoints,
  ];
  
  // Add authenticated tests if token is available
  if (AUTH_TOKEN) {
    testGroups.push(testAuthenticatedEndpoints);
  }
  
  const selectedTest = testGroups[Math.floor(Math.random() * testGroups.length)];
  selectedTest();
  
  sleep(Math.random() * 2 + 0.5);
}

function testHealthEndpoints() {
  group('Health & Status Endpoints', function () {
    const endpoints = [
      { name: 'health', path: '/api/health' },
      { name: 'status', path: '/api/status' },
    ];
    
    endpoints.forEach(({ name, path }) => {
      const res = http.get(`${BASE_URL}${path}`, { tags: { endpoint: name } });
      requestCounter.add(1);
      apiDuration.add(res.timings.duration);
      
      const success = check(res, {
        [`${name} status is 200`]: (r) => r.status === 200,
        [`${name} response time < 500ms`]: (r) => r.timings.duration < 500,
      });
      
      errorRate.add(!success);
      sleep(0.5);
    });
  });
}

function testPublicEndpoints() {
  group('Public API Endpoints', function () {
    // Test robots listing (public)
    const robotsRes = http.get(`${BASE_URL}/api/robots`, { 
      tags: { endpoint: 'robots_list' } 
    });
    requestCounter.add(1);
    apiDuration.add(robotsRes.timings.duration);
    
    check(robotsRes, {
      'robots list returns 200': (r) => r.status === 200,
      'robots list response time < 800ms': (r) => r.timings.duration < 800,
    });
    
    sleep(0.5);
    
    // Test signals listing (public)
    const signalsRes = http.get(`${BASE_URL}/api/signals`, { 
      tags: { endpoint: 'signals_list' } 
    });
    requestCounter.add(1);
    apiDuration.add(signalsRes.timings.duration);
    
    check(signalsRes, {
      'signals list returns 200': (r) => r.status === 200,
      'signals list response time < 800ms': (r) => r.timings.duration < 800,
    });
  });
}

function testMarketplaceEndpoints() {
  group('Marketplace Endpoints', function () {
    // Test marketplace products
    const productsRes = http.get(`${BASE_URL}/api/marketplace/products`, { 
      tags: { endpoint: 'marketplace_products' } 
    });
    requestCounter.add(1);
    apiDuration.add(productsRes.timings.duration);
    
    check(productsRes, {
      'marketplace products returns 200 or 404': (r) => r.status === 200 || r.status === 404,
      'marketplace response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    
    sleep(0.5);
    
    // Test signal providers
    const providersRes = http.get(`${BASE_URL}/api/signal-providers`, { 
      tags: { endpoint: 'signal_providers' } 
    });
    requestCounter.add(1);
    apiDuration.add(providersRes.timings.duration);
    
    check(providersRes, {
      'signal providers returns 200 or 404': (r) => r.status === 200 || r.status === 404,
      'providers response time < 1000ms': (r) => r.timings.duration < 1000,
    });
  });
}

function testAuthenticatedEndpoints() {
  group('Authenticated Endpoints', function () {
    // Test user profile
    const profileRes = http.get(`${BASE_URL}/api/user/profile`, { 
      headers,
      tags: { endpoint: 'user_profile' } 
    });
    requestCounter.add(1);
    apiDuration.add(profileRes.timings.duration);
    
    check(profileRes, {
      'profile returns 200 or 401': (r) => r.status === 200 || r.status === 401,
      'profile response time < 800ms': (r) => r.timings.duration < 800,
    });
    
    sleep(0.5);
    
    // Test wallet balance
    const walletRes = http.get(`${BASE_URL}/api/wallet/balance`, { 
      headers,
      tags: { endpoint: 'wallet_balance' } 
    });
    requestCounter.add(1);
    apiDuration.add(walletRes.timings.duration);
    
    check(walletRes, {
      'wallet returns 200 or 401': (r) => r.status === 200 || r.status === 401,
      'wallet response time < 800ms': (r) => r.timings.duration < 800,
    });
    
    sleep(0.5);
    
    // Test trades history
    const tradesRes = http.get(`${BASE_URL}/api/user/trades`, { 
      headers,
      tags: { endpoint: 'user_trades' } 
    });
    requestCounter.add(1);
    apiDuration.add(tradesRes.timings.duration);
    
    check(tradesRes, {
      'trades returns 200 or 401': (r) => r.status === 200 || r.status === 401,
      'trades response time < 1000ms': (r) => r.timings.duration < 1000,
    });
  });
}

export function teardown(data) {
  console.log(`\n✅ Load test completed.`);
  console.log(`   Started at: ${data.startTime}`);
  console.log(`   Base URL: ${data.baseUrl}\n`);
}

export function handleSummary(data) {
  const { metrics, root_group } = data;
  
  let summary = '\n';
  summary += '╔════════════════════════════════════════════════════════════════════════╗\n';
  summary += '║              AlgoEdge Comprehensive Load Test Results                  ║\n';
  summary += '╠════════════════════════════════════════════════════════════════════════╣\n';
  
  // Overall stats
  summary += '║ OVERALL PERFORMANCE                                                    ║\n';
  summary += '╠────────────────────────────────────────────────────────────────────────╣\n';
  
  if (metrics.http_req_duration) {
    summary += `║   Response Time (p50):  ${metrics.http_req_duration.values.med?.toFixed(2) || 'N/A'}ms\n`;
    summary += `║   Response Time (p95):  ${metrics.http_req_duration.values['p(95)']?.toFixed(2) || 'N/A'}ms\n`;
    summary += `║   Response Time (p99):  ${metrics.http_req_duration.values['p(99)']?.toFixed(2) || 'N/A'}ms\n`;
    summary += `║   Response Time (avg):  ${metrics.http_req_duration.values.avg?.toFixed(2) || 'N/A'}ms\n`;
    summary += `║   Response Time (max):  ${metrics.http_req_duration.values.max?.toFixed(2) || 'N/A'}ms\n`;
  }
  
  summary += '╠────────────────────────────────────────────────────────────────────────╣\n';
  summary += '║ REQUEST STATISTICS                                                     ║\n';
  summary += '╠────────────────────────────────────────────────────────────────────────╣\n';
  
  if (metrics.http_reqs) {
    summary += `║   Total Requests:       ${metrics.http_reqs.values.count || 0}\n`;
    summary += `║   Requests/sec:         ${metrics.http_reqs.values.rate?.toFixed(2) || 'N/A'}\n`;
  }
  
  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate || 0) * 100;
    summary += `║   Failed Requests:      ${failRate.toFixed(2)}%\n`;
    summary += `║   Success Rate:         ${(100 - failRate).toFixed(2)}%\n`;
  }
  
  if (metrics.total_requests) {
    summary += `║   API Calls Made:       ${metrics.total_requests.values.count || 0}\n`;
  }
  
  summary += '╠────────────────────────────────────────────────────────────────────────╣\n';
  summary += '║ THRESHOLDS                                                             ║\n';
  summary += '╠────────────────────────────────────────────────────────────────────────╣\n';
  
  // Check thresholds
  const p95 = metrics.http_req_duration?.values['p(95)'] || 0;
  const p99 = metrics.http_req_duration?.values['p(99)'] || 0;
  const errorRateVal = (metrics.http_req_failed?.values.rate || 0) * 100;
  
  summary += `║   p95 < 1000ms:         ${p95 < 1000 ? '✅ PASS' : '❌ FAIL'} (${p95.toFixed(2)}ms)\n`;
  summary += `║   p99 < 2000ms:         ${p99 < 2000 ? '✅ PASS' : '❌ FAIL'} (${p99.toFixed(2)}ms)\n`;
  summary += `║   Error Rate < 5%:      ${errorRateVal < 5 ? '✅ PASS' : '❌ FAIL'} (${errorRateVal.toFixed(2)}%)\n`;
  
  summary += '╚════════════════════════════════════════════════════════════════════════╝\n';
  
  return {
    'stdout': summary,
    'full-test-results.json': JSON.stringify(data, null, 2),
  };
}
