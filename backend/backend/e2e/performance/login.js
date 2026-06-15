// k6 load test: POST /auth/login
//
// Run:
//   k6 run e2e/performance/login.js
//
// Override defaults via env:
//   k6 run -e BASE_URL=http://localhost:3000 \
//          -e USERNAME=httptest \
//          -e PASSWORD=hunter2hunter2 \
//          e2e/performance/login.js
//
// Prereq: the target user must already exist. Either run the `signup` block in
// e2e/http/requests.http once, or point USERNAME/PASSWORD at a seeded account
// (e.g. the `admin` user from scripts/db/sqlite/data.sql).
//
// Note: each iteration triggers a bcrypt verify (cost 10) on the server, so
// CPU — not network — is the bottleneck. Tune stages accordingly.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const USERNAME = __ENV.USERNAME || 'httptest';
const PASSWORD = __ENV.PASSWORD || 'hunter2hunter2';

const loginDuration = new Trend('login_duration', true);
const loginSuccess = new Rate('login_success');

export const options = {
  stages: [
    { duration: '15s', target: 35 },   // ramp up
    { duration: '30s', target: 35 },   // steady
    { duration: '10s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{endpoint:login}': ['p(95)<800'],
    login_success: ['rate>0.99'],
  },
};

export default function () {
  const payload = JSON.stringify({ username: USERNAME, password: PASSWORD });
  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'login' },
  };

  const res = http.post(`${BASE_URL}/auth/login`, payload, params);
  loginDuration.add(res.timings.duration);

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'has access_token': (r) => {
      try {
        return typeof r.json('access_token') === 'string';
      } catch {
        return false;
      }
    },
    'has refresh_token': (r) => {
      try {
        return typeof r.json('refresh_token') === 'string';
      } catch {
        return false;
      }
    },
  });
  loginSuccess.add(ok);

  sleep(1);
}
