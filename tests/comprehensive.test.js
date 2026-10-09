import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

// Helper to make requests
async function req(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, options);
  let json = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    json = await res.json();
  }
  return { status: res.status, headers: res.headers, data: json };
}

test('SUITE 1: System Health & Documentation', async (t) => {
  await t.test('1.1 Health endpoint returns HEALTHY status', async () => {
    const res = await req('/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'HEALTHY');
    assert.equal(res.data.system, 'Smart Waste Collection & Management System');
  });

  await t.test('1.2 Swagger documentation spec is accessible with endpoints', async () => {
    const res = await req('/docs.json');
    assert.equal(res.status, 200);
    assert.ok(Object.keys(res.data.paths).length >= 25);
  });
});

test('SUITE 2: Authentication & Authorization Flow', async (t) => {
  const uniqueCitizenEmail = `test.cit.${Date.now()}@example.com`;
  let citizenToken = '';
  let citizenUser = null;

  await t.test('2.1 Citizen Registration with Valid Data', async () => {
    const res = await req('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Automation Citizen',
        email: uniqueCitizenEmail,
        password: 'ValidPassword@123',
        phone: '+91 99887 76655',
        city: 'Visakhapatnam',
        state: 'Andhra Pradesh',
        pincode: '530002',
      }),
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.equal(res.data.data.user.role, 'CITIZEN');
    citizenToken = res.data.data.token;
    citizenUser = res.data.data.user;
  });

  await t.test('2.2 Duplicate Email Registration is Rejected (409)', async () => {
    const res = await req('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Duplicate User',
        email: uniqueCitizenEmail,
        password: 'AnotherPassword@123',
      }),
    });
    assert.equal(res.status, 409);
    assert.equal(res.data.success, false);
  });

  await t.test('2.3 Registration with Invalid Email is Rejected (400)', async () => {
    const res = await req('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Invalid Email User',
        email: 'not-an-email',
        password: 'ValidPassword@123',
      }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
  });

  await t.test('2.4 Registration with Short Password is Rejected (400)', async () => {
    const res = await req('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Short Pass User',
        email: `shortpass.${Date.now()}@example.com`,
        password: '123',
      }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
  });

  await t.test('2.5 Citizen Login with Correct Password', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueCitizenEmail,
        password: 'ValidPassword@123',
      }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.token);
  });

  await t.test('2.6 Citizen Login with Wrong Password is Rejected (401)', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueCitizenEmail,
        password: 'WrongPassword!',
      }),
    });
    assert.equal(res.status, 401);
    assert.equal(res.data.success, false);
  });

  await t.test('2.7 Worker Login with Seeded Credentials', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ramesh.worker@smartwaste.gov',
        password: 'WorkerPassword@123',
      }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.user.role, 'WORKER');
    assert.ok(res.data.data.user.worker);
  });

  await t.test('2.8 Admin Login with Seeded Credentials', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@smartwaste.gov',
        password: 'AdminPassword@123',
      }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.user.role, 'ADMIN');
  });

  await t.test('2.9 Verify Session /auth/me with Bearer Token', async () => {
    const res = await req('/auth/me', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.email, uniqueCitizenEmail);
  });

  await t.test('2.10 Request Without Token is Blocked (401)', async () => {
    const res = await req('/auth/me');
    assert.equal(res.status, 401);
  });

  await t.test('2.11 Request With Invalid JWT Token is Blocked (401)', async () => {
    const res = await req('/auth/me', {
      headers: { Authorization: 'Bearer fake.invalid.jwt.token' },
    });
    assert.equal(res.status, 401);
  });

  await t.test('2.12 Citizen is Blocked From Admin APIs (403)', async () => {
    const res = await req('/admin/statistics', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert.equal(res.status, 403);
  });

  await t.test('2.13 Citizen is Blocked From Worker Task APIs (403)', async () => {
    const res = await req('/workers/tasks', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert.equal(res.status, 403);
  });
});

test('SUITE 3: Full End-to-End Workflow (Citizen -> Admin -> Worker -> Citizen)', async (t) => {
  // 1. Logins
  const citizenLogin = await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul.citizen@example.com', password: 'CitizenPassword@123' }),
  });
  const citizenToken = citizenLogin.data.data.token;
  const citizenId = citizenLogin.data.data.user.id;

  const adminLogin = await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@smartwaste.gov', password: 'AdminPassword@123' }),
  });
  const adminToken = adminLogin.data.data.token;

  const workerLogin = await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'suresh.worker@smartwaste.gov', password: 'WorkerPassword@123' }),
  });
  const workerToken = workerLogin.data.data.token;
  const workerProfile = workerLogin.data.data.user.worker;

  let createdComplaintId = '';
  let complaintReference = '';

  await t.test('3.1 Citizen Raises New Waste Complaint', async () => {
    const res = await req('/complaints', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wasteType: 'Plastic waste',
        category: 'Overflowing dustbin',
        description: 'E2E workflow test: Community dustbin overflowing with recyclable bottles and boxes.',
        priority: 'HIGH',
        latitude: 17.7291,
        longitude: 83.3054,
        address: 'Gandhi Park Gate 4, Clock Tower Area',
      }),
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.complaintReference.startsWith('SW-'));
    assert.equal(res.data.data.status, 'SUBMITTED');
    createdComplaintId = res.data.data.id;
    complaintReference = res.data.data.complaintReference;
  });

  await t.test('3.2 Verify Citizen Scoping & Status in Database', async () => {
    const res = await req(`/complaints/${createdComplaintId}`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.id, createdComplaintId);
    assert.equal(res.data.data.status, 'SUBMITTED');
    assert.equal(res.data.data.citizenId, citizenId);
    assert.ok(res.data.data.statusHistory.length >= 1);
  });

  await t.test('3.3 Other Citizens Cannot Access This Complaint (403)', async () => {
    const otherCitizenLogin = await req('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.citizen@example.com', password: 'CitizenPassword@123' }),
    });
    const otherToken = otherCitizenLogin.data.data.token;

    const res = await req(`/complaints/${createdComplaintId}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    assert.equal(res.status, 403);
  });

  await t.test('3.4 Admin Finds New Complaint & Assigns to Suresh Reddy', async () => {
    const res = await req(`/complaints/${createdComplaintId}/assign`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workerId: workerProfile.id,
        notes: 'Assigned to Suresh Reddy for urgent clearance.',
      }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.assignedWorkerId, workerProfile.id);
    assert.equal(res.data.data.status, 'ASSIGNED');
  });

  await t.test('3.5 Assigned Worker Suresh Starts Task -> IN_PROGRESS', async () => {
    const res = await req(`/workers/tasks/${createdComplaintId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${workerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'IN_PROGRESS',
        notes: 'Worker arrived at location with municipal collection truck.',
      }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.status, 'IN_PROGRESS');
  });

  await t.test('3.6 Another Worker (Ramesh) Cannot Modify Suresh\'s Task (403)', async () => {
    const rameshLogin = await req('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ramesh.worker@smartwaste.gov', password: 'WorkerPassword@123' }),
    });
    const rameshToken = rameshLogin.data.data.token;

    const res = await req(`/workers/tasks/${createdComplaintId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${rameshToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'COMPLETED',
        notes: 'Unauthorized attempt',
      }),
    });
    assert.equal(res.status, 403);
  });

  await t.test('3.7 Worker Suresh Uploads Completion Proof & Marks COMPLETED', async () => {
    // Test multipart completion proof
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const sampleProofContent = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xd9]);
    
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="notes"\r\n\r\nStreet cleaned thoroughly and disinfected.\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="proof.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
    ];
    const endPart = `\r\n--${boundary}--\r\n`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(parts[0], 'utf8'),
      Buffer.from(parts[1], 'utf8'),
      sampleProofContent,
      Buffer.from(endPart, 'utf8'),
    ]);

    const res = await fetch(`${BASE_URL}/workers/tasks/${createdComplaintId}/completion-proof`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${workerToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: bodyBuffer,
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.complaint.status, 'COMPLETED');
    assert.ok(data.data.proof.imageUrl);
  });

  await t.test('3.8 Citizen Tracks Complaint and Sees COMPLETED Status & Proof', async () => {
    const res = await req(`/complaints/${createdComplaintId}`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.status, 'COMPLETED');
    assert.ok(res.data.data.completedAt);
    assert.ok(res.data.data.completionProofs.length >= 1);
  });

  await t.test('3.9 Citizen Submits Rating and Feedback', async () => {
    const res = await req('/feedback', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        complaintId: createdComplaintId,
        rating: 5,
        recommendation: true,
        comments: 'Outstanding work! Very quick clearance and polite worker.',
      }),
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.data.rating, 5);
  });

  await t.test('3.10 Citizen Re-submitting Feedback is Prevented (409)', async () => {
    const res = await req('/feedback', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        complaintId: createdComplaintId,
        rating: 4,
        recommendation: true,
        comments: 'Duplicate attempt',
      }),
    });
    assert.equal(res.status, 409);
  });

  await t.test('3.11 Admin Statistics & Reports Include Completed Grievance', async () => {
    const statsRes = await req('/admin/statistics', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(statsRes.status, 200);
    assert.ok(statsRes.data.data.completedComplaints >= 1);

    // CSV export test
    const csvRes = await fetch(`${BASE_URL}/admin/export/csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(csvRes.status, 200);
    assert.ok(csvRes.headers.get('content-type').includes('text/csv'));
    const csvText = await csvRes.text();
    assert.ok(csvText.includes(complaintReference));

    // PDF export test
    const pdfRes = await fetch(`${BASE_URL}/admin/export/pdf`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(pdfRes.status, 200);
    assert.equal(pdfRes.headers.get('content-type'), 'application/pdf');
    const pdfBuf = await pdfRes.arrayBuffer();
    assert.ok(pdfBuf.byteLength > 500); // Valid PDF stream
  });
});

test('SUITE 4: Collection Schedules & Service Zones', async (t) => {
  const adminLogin = await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@smartwaste.gov', password: 'AdminPassword@123' }),
  });
  const adminToken = adminLogin.data.data.token;

  let testScheduleId = '';

  await t.test('4.1 Retrieve Service Zones', async () => {
    const res = await req('/schedules/zones', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.length >= 4);
  });

  await t.test('4.2 Admin Creates New Collection Schedule', async () => {
    const zonesRes = await req('/schedules/zones', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const zoneId = zonesRes.data.data[0].id;

    const res = await req('/schedules', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceZoneId: zoneId,
        collectionDate: new Date().toISOString().split('T')[0],
        collectionTime: '06:00 AM - 08:00 AM',
        wasteType: 'Wet waste & Organic (Automation)',
        vehicleNumber: 'AP-31-TEST-9999',
      }),
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    testScheduleId = res.data.data.id;
  });

  await t.test('4.3 Admin Updates Collection Schedule', async () => {
    const res = await req(`/schedules/${testScheduleId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collectionTime: '06:30 AM - 08:30 AM',
        status: 'IN_PROGRESS',
      }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.collectionTime, '06:30 AM - 08:30 AM');
    assert.equal(res.data.data.status, 'IN_PROGRESS');
  });

  await t.test('4.4 Admin Deletes Collection Schedule', async () => {
    const res = await req(`/schedules/${testScheduleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
  });
});
