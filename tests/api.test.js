import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

test('1. Health Check Endpoint', async () => {
  const res = await fetch(`${BASE_URL}/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'HEALTHY');
});

test('2. Authentication Flow - Citizen Registration & Login', async () => {
  const uniqueEmail = `test.citizen.${Date.now()}@example.com`;
  
  // Registration
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test Automation User',
      email: uniqueEmail,
      password: 'SecurePassword@123',
      phone: '+91 99999 88888',
      city: 'Visakhapatnam',
    }),
  });
  assert.equal(regRes.status, 201);
  const regData = await regRes.json();
  assert.equal(regData.success, true);
  assert.ok(regData.data.token);
  assert.equal(regData.data.user.role, 'CITIZEN');

  // Login with correct credentials
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'SecurePassword@123',
    }),
  });
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.equal(loginData.success, true);
  assert.ok(loginData.data.token);

  // Login with wrong password
  const failLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'WrongPassword!',
    }),
  });
  assert.equal(failLoginRes.status, 401);
});

test('3. Role-Based Access Control (RBAC) Enforcement', async () => {
  // Login as Citizen
  const citizenLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rahul.citizen@example.com',
      password: 'CitizenPassword@123',
    }),
  });
  const citizenData = await citizenLogin.json();
  const citizenToken = citizenData.data.token;

  // Citizen trying to access admin statistics endpoint
  const unauthorizedRes = await fetch(`${BASE_URL}/admin/statistics`, {
    headers: { Authorization: `Bearer ${citizenToken}` },
  });
  assert.equal(unauthorizedRes.status, 403);

  // Admin login and access statistics
  const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@smartwaste.gov',
      password: 'AdminPassword@123',
    }),
  });
  const adminData = await adminLogin.json();
  const adminToken = adminData.data.token;

  const adminRes = await fetch(`${BASE_URL}/admin/statistics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(adminRes.status, 200);
  const adminStats = await adminRes.json();
  assert.equal(adminStats.success, true);
  assert.ok(adminStats.data.totalComplaints > 0);
});

test('4. Citizen Complaint Creation and Retrieval Flow', async () => {
  const citizenLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'priya.citizen@example.com',
      password: 'CitizenPassword@123',
    }),
  });
  const citizenData = await citizenLogin.json();
  const citizenToken = citizenData.data.token;

  // Create Complaint
  const complaintRes = await fetch(`${BASE_URL}/complaints`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${citizenToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      wasteType: 'Plastic waste',
      category: 'Overflowing dustbin',
      description: 'Street corner bin is completely full and spilling over on sidewalk.',
      priority: 'HIGH',
      latitude: 17.7291,
      longitude: 83.3054,
      address: 'Near Gandhi Park Gate 2',
    }),
  });
  assert.equal(complaintRes.status, 201);
  const complaintData = await complaintRes.json();
  assert.equal(complaintData.success, true);
  assert.ok(complaintData.data.complaintReference.startsWith('SW-'));

  const complaintId = complaintData.data.id;

  // Fetch Complaint details
  const getRes = await fetch(`${BASE_URL}/complaints/${complaintId}`, {
    headers: { Authorization: `Bearer ${citizenToken}` },
  });
  assert.equal(getRes.status, 200);
  const getDetail = await getRes.json();
  assert.equal(getDetail.data.id, complaintId);
  assert.equal(getDetail.data.status, 'SUBMITTED');
  assert.ok(getDetail.data.statusHistory.length >= 1);
});

test('5. Collection Schedule Retrieval & Filtering', async () => {
  const citizenLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rahul.citizen@example.com',
      password: 'CitizenPassword@123',
    }),
  });
  const token = (await citizenLogin.json()).data.token;

  const res = await fetch(`${BASE_URL}/schedules`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.data.length > 0);
});

test('6. In-App Notifications Fetch and Mark Read', async () => {
  const citizenLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rahul.citizen@example.com',
      password: 'CitizenPassword@123',
    }),
  });
  const token = (await citizenLogin.json()).data.token;

  const notifRes = await fetch(`${BASE_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(notifRes.status, 200);
  const notifData = await notifRes.json();
  assert.equal(notifData.success, true);
  assert.ok(Array.isArray(notifData.data.notifications));

  // Mark all as read
  const markRes = await fetch(`${BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(markRes.status, 200);
});
