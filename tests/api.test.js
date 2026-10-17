// LORD'S GYM API Test Suite
// Run: node --test tests/api.test.js
const os = require('os');
const fs = require('fs');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'lordsgym-test-'));
process.env.PORT = '0'; // ephemeral port

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

let server, baseUrl, adminCookie = '', memberCookie = '', newMemberCookie = '', newUserId = null;

const api = (method, endpoint, body, cookie = '') =>
  fetch(baseUrl + endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

before(() => new Promise(resolve => {
  server = app.listen(0, () => {
    baseUrl = `http://localhost:${server.address().port}`;
    resolve();
  });
}));

after(() => server.close());

test('1. Public health check, plans, and amenities work', async () => {
  const healthRes = await api('GET', '/api/health');
  assert.equal(healthRes.status, 200);
  const health = await healthRes.json();
  assert.equal(health.ok, true);

  const plansRes = await api('GET', '/api/plans');
  assert.equal(plansRes.status, 200);
  const plansData = await plansRes.json();
  assert.equal(plansData.plans.length, 3);

  const amenitiesRes = await api('GET', '/api/amenities');
  assert.equal(amenitiesRes.status, 200);
  const amenitiesData = await amenitiesRes.json();
  assert.equal(amenitiesData.amenities.length, 6);
});

test('2. Anonymous access to admin pipeline is blocked', async () => {
  const res = await api('GET', '/api/admin/pipeline');
  assert.equal(res.status, 401);
});

test('3. Login rejects incorrect credentials', async () => {
  const res = await api('POST', '/api/login', {
    user: 'thelordsgymsachin@gmail.com',
    pass: 'WrongPassword123'
  });
  assert.equal(res.status, 401);
});

test('4. Admin login succeeds with seeded credentials', async () => {
  const res = await api('POST', '/api/login', {
    user: 'thelordsgymsachin@gmail.com',
    pass: 'LordsGym@2025'
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.role, 'admin');
  assert.equal(body.user.full_name, 'Imran Pathan');
  adminCookie = res.headers.get('set-cookie')?.split(';')[0];
  assert.ok(adminCookie);
});

test('5. Member login succeeds and provides member role', async () => {
  const res = await api('POST', '/api/login', {
    user: 'yash@example.com',
    pass: 'Member@123'
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.role, 'member');
  assert.equal(body.user.full_name, 'Yash Jayprakash');
  memberCookie = res.headers.get('set-cookie')?.split(';')[0];
  assert.ok(memberCookie);
});

test('6. Inbound enquiry rejects invalid Indian mobile number', async () => {
  const res = await api('POST', '/api/enquiry', {
    name: 'Rahul Sharma',
    mobile: '1234567890', // invalid start digit
    plan: 'Normal Gym'
  });
  assert.equal(res.status, 400);
});

test('7. Inbound enquiry accepts valid submission and generates ticket', async () => {
  const res = await api('POST', '/api/enquiry', {
    name: 'Rahul Sharma',
    mobile: '9876543210',
    plan: 'Gym with Trainer',
    message: 'Interested in evening slot',
    slot: 'Evening 4PM-7PM'
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.match(body.ticket, /^LG-\d{4}$/);
});

test('8. Member dashboard returns dynamic daysLeft calculation', async () => {
  const res = await api('GET', '/api/dashboard', null, memberCookie);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.member.name, 'Yash Jayprakash');
  assert.ok(typeof body.member.daysLeft === 'number');
  assert.equal(body.member.plan_name, 'Gym with Trainer');
  assert.equal(body.member.hasPlan, true);
});

test('9. Admin pipeline lists enquiries and displays statistics', async () => {
  const res = await api('GET', '/api/admin/pipeline', null, adminCookie);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.ok(body.enquiries.length >= 1);
  assert.equal(body.stats.total >= 1, true);
});

test('10. User registration succeeds and creates account without plan', async () => {
  const res = await api('POST', '/api/register', {
    full_name: 'Pooja Patel',
    email: 'pooja.patel@example.com',
    mobile: '9825144012',
    password: 'Password@2025'
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.user.full_name, 'Pooja Patel');
  assert.equal(body.user.active_plan_id, null);
  newUserId = body.user.id;
  newMemberCookie = res.headers.get('set-cookie')?.split(';')[0];
  assert.ok(newMemberCookie);

  // New user's dashboard must have hasPlan: false
  const dashRes = await api('GET', '/api/dashboard', null, newMemberCookie);
  assert.equal(dashRes.status, 200);
  const dash = await dashRes.json();
  assert.equal(dash.member.hasPlan, false);
  assert.equal(dash.member.plan_name, null);
});

test('11. User registration rejects duplicate email and invalid mobile', async () => {
  // Duplicate email
  const dupRes = await api('POST', '/api/register', {
    full_name: 'Pooja Duplicate',
    email: 'pooja.patel@example.com',
    mobile: '9825144013',
    password: 'Password@2025'
  });
  assert.equal(dupRes.status, 409);

  // Invalid mobile
  const badMobileRes = await api('POST', '/api/register', {
    full_name: 'Test Mobile',
    email: 'testmobile@example.com',
    mobile: '5555555555',
    password: 'Password@2025'
  });
  assert.equal(badMobileRes.status, 400);
});

test('12. Normal member cannot access admin user management', async () => {
  const res = await api('GET', '/api/admin/users', null, memberCookie);
  assert.equal(res.status, 403);
});

test('13. Admin can list users and activate membership plan on new user', async () => {
  // Admin lists registered users
  const listRes = await api('GET', '/api/admin/users', null, adminCookie);
  assert.equal(listRes.status, 200);
  const listBody = await listRes.json();
  assert.ok(listBody.users.some(u => u.email === 'pooja.patel@example.com'));

  // Admin activates Plan 1 (Normal Gym) for 30 days
  const activateRes = await api('PATCH', `/api/admin/users/${newUserId}/plan`, {
    plan_id: 1,
    duration_days: 30
  }, adminCookie);
  assert.equal(activateRes.status, 200);
  const activateBody = await activateRes.json();
  assert.equal(activateBody.ok, true);

  // Now new user dashboard shows hasPlan: true and daysLeft = 30
  const dashRes = await api('GET', '/api/dashboard', null, newMemberCookie);
  assert.equal(dashRes.status, 200);
  const dash = await dashRes.json();
  assert.equal(dash.member.hasPlan, true);
  assert.equal(dash.member.plan_name, 'Normal Gym');
  assert.equal(dash.member.daysLeft, 30);
});

test('14. Unauthenticated access to /admin redirects to /login', async () => {
  const res = await fetch(baseUrl + '/admin', { redirect: 'manual' });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/login');
});

test('15. Unauthenticated access to /member redirects to /login', async () => {
  const res = await fetch(baseUrl + '/member', { redirect: 'manual' });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/login');
});

test('16. Admin accessing /member redirects to /admin', async () => {
  const res = await fetch(baseUrl + '/member', {
    headers: { 'Cookie': adminCookie },
    redirect: 'manual'
  });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/admin');
});

test('17. Member login succeeds with 10-digit mobile number', async () => {
  const res = await api('POST', '/api/login', {
    user: '9876543210',
    pass: 'Member@123'
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.role, 'member');
  assert.equal(body.user.full_name, 'Yash Jayprakash');
});
