import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // Health Check Endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  
  healthCheckDuration.add(healthRes.timings.duration);
  
  const healthSuccess = check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 200ms': (r) => r.timings.duration < 200,
    'health check has status field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!healthSuccess);

  // Small pause between requests
  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'health-test-results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const { metrics } = data;
  
  let summary = '\n╔══════════════════════════════════════════════════════════════╗\n';
  summary += '║           AlgoEdge Health Check Load Test Results           ║\n';
  summary += '╠══════════════════════════════════════════════════════════════╣\n';
  
  if (metrics.http_req_duration) {
    summary += `║ Response Time (p95):  ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `║ Response Time (p99):  ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
    summary += `║ Average Response:     ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  }
  
  if (metrics.http_reqs) {
    summary += `║ Total Requests:       ${metrics.http_reqs.values.count}\n`;
    summary += `║ Requests/sec:         ${metrics.http_reqs.values.rate.toFixed(2)}\n`;
  }
  
  if (metrics.http_req_failed) {
    summary += `║ Failed Requests:      ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  }
  
  summary += '╚══════════════════════════════════════════════════════════════╝\n';
  
  return summary;
}
