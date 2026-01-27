import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const registerDuration = new Trend('register_duration');
const successfulLogins = new Counter('successful_logins');
const failedLogins = new Counter('failed_logins');

// Test configuration
export const options = {
  scenarios: {
    login_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 50 },
        { duration: '40s', target: 50 },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    errors: ['rate<0.05'],
    http_req_failed: ['rate<0.05'],
    login_duration: ['p(95)<800'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Test user pool - these should be test accounts
const TEST_USERS = [
  { email: 'loadtest1@example.com', password: 'LoadTest123!' },
  { email: 'loadtest2@example.com', password: 'LoadTest123!' },
  { email: 'loadtest3@example.com', password: 'LoadTest123!' },
  { email: 'loadtest4@example.com', password: 'LoadTest123!' },
  { email: 'loadtest5@example.com', password: 'LoadTest123!' },
];

export function setup() {
  console.log(`Starting auth load test against ${BASE_URL}`);
  
  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`API health check failed: ${healthCheck.status}`);
  }
  
  return { startTime: new Date().toISOString() };
}

export default function () {
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  
  group('Authentication Flow', function () {
    // Test Login
    group('Login', function () {
      const loginPayload = JSON.stringify({
        email: user.email,
        password: user.password,
      });

      const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'login' },
      });

      loginDuration.add(loginRes.timings.duration);

      const loginSuccess = check(loginRes, {
        'login returns 200 or 401': (r) => r.status === 200 || r.status === 401,
        'login response time < 1s': (r) => r.timings.duration < 1000,
        'login has valid response': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.token !== undefined || body.error !== undefined;
          } catch {
            return false;
          }
        },
      });

      if (loginRes.status === 200) {
        successfulLogins.add(1);
      } else {
        failedLogins.add(1);
      }

      errorRate.add(!loginSuccess);
    });

    sleep(Math.random() * 2 + 1);

    // Test Invalid Login (should fail gracefully)
    group('Invalid Login', function () {
      const invalidPayload = JSON.stringify({
        email: `invalid_${Date.now()}@test.com`,
        password: 'wrongpassword',
      });

      const invalidRes = http.post(`${BASE_URL}/api/auth/login`, invalidPayload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'invalid_login' },
      });

      check(invalidRes, {
        'invalid login returns 401': (r) => r.status === 401,
        'invalid login has error message': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.error !== undefined;
          } catch {
            return false;
          }
        },
      });
    });

    sleep(Math.random() * 2 + 1);
  });
}

export function teardown(data) {
  console.log(`Auth load test completed. Started at: ${data.startTime}`);
}

export function handleSummary(data) {
  const { metrics } = data;
  
  let summary = '\n';
  summary += '╔══════════════════════════════════════════════════════════════╗\n';
  summary += '║         AlgoEdge Authentication Load Test Results           ║\n';
  summary += '╠══════════════════════════════════════════════════════════════╣\n';
  
  if (metrics.login_duration) {
    summary += `║ Login Response (p95):  ${metrics.login_duration.values['p(95)']?.toFixed(2) || 'N/A'}ms\n`;
    summary += `║ Login Response (avg):  ${metrics.login_duration.values.avg?.toFixed(2) || 'N/A'}ms\n`;
  }
  
  if (metrics.successful_logins) {
    summary += `║ Successful Logins:     ${metrics.successful_logins.values.count || 0}\n`;
  }
  
  if (metrics.failed_logins) {
    summary += `║ Failed Logins:         ${metrics.failed_logins.values.count || 0}\n`;
  }
  
  if (metrics.http_req_duration) {
    summary += `║ Overall p95:           ${metrics.http_req_duration.values['p(95)']?.toFixed(2) || 'N/A'}ms\n`;
  }
  
  if (metrics.http_req_failed) {
    summary += `║ Request Failures:      ${((metrics.http_req_failed.values.rate || 0) * 100).toFixed(2)}%\n`;
  }
  
  summary += '╚══════════════════════════════════════════════════════════════╝\n';
  
  return {
    'stdout': summary,
    'auth-test-results.json': JSON.stringify(data, null, 2),
  };
}
