import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../backend/src/app.js';
import prisma from '../backend/src/config/db.js';
import { bootstrapInitialAccounts } from '../backend/src/config/bootstrap.js';
import enTranslations from '../frontend/src/i18n/locales/en.json' with { type: 'json' };
import teTranslations from '../frontend/src/i18n/locales/te.json' with { type: 'json' };
import hiTranslations from '../frontend/src/i18n/locales/hi.json' with { type: 'json' };

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

let server = null;

// Start server if not running
const ensureServer = async () => {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.ok) return;
  } catch (e) {
    // Server not running, start it
  }

  await bootstrapInitialAccounts();

  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      resolve();
    });
  });
};

test.before(async () => {
  await ensureServer();
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await prisma.$disconnect();
});

test('SUITE 1: Multilingual Translation Bundle Integrity', async (t) => {
  await t.test('1.1 Centralized locale files (en, te, hi) exist and are non-empty', () => {
    assert.ok(enTranslations.appTitle, 'English appTitle should exist');
    assert.ok(teTranslations.appTitle, 'Telugu appTitle should exist');
    assert.ok(hiTranslations.appTitle, 'Hindi appTitle should exist');
  });

  await t.test('1.2 Escalation keys are present across all three languages', () => {
    const requiredEscalationKeys = ['title', 'level1', 'level2', 'level3', 'deadline', 'instructions'];
    for (const key of requiredEscalationKeys) {
      assert.ok(enTranslations.escalation[key], `en.escalation.${key} should be defined`);
      assert.ok(teTranslations.escalation[key], `te.escalation.${key} should be defined`);
      assert.ok(hiTranslations.escalation[key], `hi.escalation.${key} should be defined`);
    }
  });

  await t.test('1.3 Role names exist for Municipal Officer and Collector Office', () => {
    assert.equal(enTranslations.roles.MUNICIPAL_OFFICER, 'Higher Municipal Authority');
    assert.ok(teTranslations.roles.MUNICIPAL_OFFICER, 'Telugu Municipal Officer should exist');
    assert.ok(hiTranslations.roles.MUNICIPAL_OFFICER, 'Hindi Municipal Officer should exist');

    assert.equal(enTranslations.roles.COLLECTOR_OFFICE, 'District Collector Office');
    assert.ok(teTranslations.roles.COLLECTOR_OFFICE, 'Telugu Collector Office should exist');
    assert.ok(hiTranslations.roles.COLLECTOR_OFFICE, 'Hindi Collector Office should exist');
  });
});

test('SUITE 2: Five-Role Authentication & Session Validation', async (t) => {
  let adminToken, officerToken, collectorToken, workerToken, citizenToken;

  await t.test('2.1 Municipal Administrator login (admin@smartwaste.gov)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartwaste.gov', password: 'AdminPassword@123' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.user.role, 'ADMIN');
    assert.ok(body.data.token);
    adminToken = body.data.token;
  });

  await t.test('2.2 Higher Municipal Officer login (officer@smartwaste.gov)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'officer@smartwaste.gov', password: 'OfficerPassword@123' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.user.role, 'MUNICIPAL_OFFICER');
    assert.ok(body.data.token);
    officerToken = body.data.token;
  });

  await t.test('2.3 District Collector Office login (collector@smartwaste.gov)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'collector@smartwaste.gov', password: 'CollectorPassword@123' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.user.role, 'COLLECTOR_OFFICE');
    assert.ok(body.data.token);
    collectorToken = body.data.token;
  });

  await t.test('2.4 Sanitation Worker login (ramesh.worker@smartwaste.gov)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ramesh.worker@smartwaste.gov', password: 'WorkerPassword@123' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.user.role, 'WORKER');
    assert.ok(body.data.token);
    workerToken = body.data.token;
  });

  await t.test('2.5 Citizen Registration and Login', async () => {
    const uniqueEmail = `test.escalation.${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Escalation Test Citizen',
        email: uniqueEmail,
        password: 'CitizenPassword@123',
        phone: '+91 99999 12345',
        city: 'Visakhapatnam',
      }),
    });
    assert.equal(regRes.status, 201);
    const regBody = await regRes.json();
    assert.equal(regBody.data.user.role, 'CITIZEN');
    assert.ok(regBody.data.token);
    citizenToken = regBody.data.token;
  });

  await t.test('2.6 Verify /auth/me for Officer and Collector roles', async () => {
    const officerMe = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    assert.equal(officerMe.status, 200);
    const officerData = await officerMe.json();
    assert.equal(officerData.data.role, 'MUNICIPAL_OFFICER');

    const collectorMe = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${collectorToken}` },
    });
    assert.equal(collectorMe.status, 200);
    const collectorData = await collectorMe.json();
    assert.equal(collectorData.data.role, 'COLLECTOR_OFFICE');
  });
});

test('SUITE 3: Role-Based Access Control (RBAC) on Escalation APIs', async (t) => {
  // Login citizen and officer
  const [cRes, oRes] = await Promise.all([
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartwaste.gov', password: 'AdminPassword@123' }),
    }),
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'officer@smartwaste.gov', password: 'OfficerPassword@123' }),
    }),
  ]);
  const adminData = await cRes.json();
  const officerData = await oRes.json();

  // Create temporary citizen token
  const citizenRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'RBAC Citizen',
      email: `rbac.${Date.now()}@example.com`,
      password: 'CitizenPassword@123',
    }),
  });
  const citizenData = await citizenRes.json();
  const citizenToken = citizenData.data.token;
  const officerToken = officerData.data.token;

  await t.test('3.1 Unauthenticated requests are rejected (401)', async () => {
    const res = await fetch(`${BASE_URL}/escalation/complaints`);
    assert.equal(res.status, 401);
  });

  await t.test('3.2 Citizen is denied access to Escalated Complaints Dashboard (403)', async () => {
    const res = await fetch(`${BASE_URL}/escalation/complaints`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert.equal(res.status, 403);
  });

  await t.test('3.3 Municipal Officer can access Escalated Complaints (200)', async () => {
    const res = await fetch(`${BASE_URL}/escalation/complaints`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  await t.test('3.4 Municipal Officer cannot issue Collector directives (403)', async () => {
    const res = await fetch(`${BASE_URL}/escalation/complaints/dummy-id/instructions`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({ instructions: 'Test directive' }),
    });
    assert.equal(res.status, 403);
  });
});

test('SUITE 4: Full Complaint Escalation Lifecycle (Level 1 -> Level 2 -> Level 3 -> Resolution)', async (t) => {
  // Tokens
  const [citRes, admRes, offRes, colRes] = await Promise.all([
    fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Lifecycle Citizen',
        email: `lifecycle.${Date.now()}@example.com`,
        password: 'Password@123',
      }),
    }),
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartwaste.gov', password: 'AdminPassword@123' }),
    }),
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'officer@smartwaste.gov', password: 'OfficerPassword@123' }),
    }),
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'collector@smartwaste.gov', password: 'CollectorPassword@123' }),
    }),
  ]);

  const citizenToken = (await citRes.json()).data.token;
  const adminToken = (await admRes.json()).data.token;
  const officerToken = (await offRes.json()).data.token;
  const collectorToken = (await colRes.json()).data.token;

  let testComplaintId;
  let testComplaintRef;

  await t.test('4.1 Citizen submits complaint (enters Level 1 with resolution deadline)', async () => {
    const res = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        wasteType: 'Plastic waste',
        category: 'Overflowing dustbin',
        description: 'Large garbage accumulation overflowing near sector 4 community center.',
        priority: 'MEDIUM',
        latitude: 17.6868,
        longitude: 83.2185,
        address: 'Sector 4 Community Hall, Visakhapatnam',
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    testComplaintId = body.data.id;
    testComplaintRef = body.data.complaintReference;
    assert.equal(body.data.escalationLevel, 1);
    assert.ok(body.data.resolutionDeadline, 'Resolution deadline must be initialized');
  });

  await t.test('4.2 Verify complaint details contains Level 1 escalation status', async () => {
    const res = await fetch(`${BASE_URL}/complaints/${testComplaintId}`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.escalationLevel, 1);
    assert.ok(body.data.resolutionDeadline);
  });

  await t.test('4.3 Trigger Level 1 -> Level 2 escalation after SLA deadline expiry', async () => {
    // Fast forward deadline for this specific complaint in database to simulate 24h passage
    await prisma.complaint.update({
      where: { id: testComplaintId },
      data: {
        resolutionDeadline: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago
      },
    });

    // Run escalation evaluation
    const checkRes = await fetch(`${BASE_URL}/escalation/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reference: testComplaintRef }),
    });
    assert.equal(checkRes.status, 200);
    const checkData = await checkRes.json();
    assert.equal(checkData.success, true);
    assert.ok(checkData.data.escalatedToLevel2 >= 1);

    // Verify complaint is now Level 2 with ESCALATED status
    const complaintAfterL2 = await prisma.complaint.findUnique({
      where: { id: testComplaintId },
      include: { escalationEvents: true },
    });
    assert.equal(complaintAfterL2.escalationLevel, 2);
    assert.equal(complaintAfterL2.status, 'ESCALATED');
    assert.equal(complaintAfterL2.escalationEvents.length, 1);
    assert.equal(complaintAfterL2.escalationEvents[0].toLevel, 2);
  });

  await t.test('4.4 Escalation check is idempotent (no duplicate events created)', async () => {
    // Re-run check immediately
    const checkRes = await fetch(`${BASE_URL}/escalation/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reference: testComplaintRef }),
    });
    assert.equal(checkRes.status, 200);

    const events = await prisma.escalationEvent.findMany({
      where: { complaintId: testComplaintId },
    });
    assert.equal(events.length, 1, 'Duplicate escalation event must NOT be created');
  });

  await t.test('4.5 Municipal Officer prioritizes complaint to EMERGENCY', async () => {
    const res = await fetch(`${BASE_URL}/escalation/complaints/${testComplaintId}/prioritize`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({
        priority: 'EMERGENCY',
        notes: 'Priority elevated by Municipal Officer due to public health risk.',
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.priority, 'EMERGENCY');
  });

  await t.test('4.6 Trigger Level 2 -> Level 3 District Collector Office escalation after 2nd deadline expiry', async () => {
    // Fast forward Level 2 deadline in DB
    await prisma.complaint.update({
      where: { id: testComplaintId },
      data: {
        resolutionDeadline: new Date(Date.now() - 60 * 1000),
      },
    });

    const checkRes = await fetch(`${BASE_URL}/escalation/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reference: testComplaintRef }),
    });
    assert.equal(checkRes.status, 200);
    const checkData = await checkRes.json();
    assert.ok(checkData.data.escalatedToLevel3 >= 1);

    const complaintAfterL3 = await prisma.complaint.findUnique({
      where: { id: testComplaintId },
      include: { escalationEvents: true },
    });
    assert.equal(complaintAfterL3.escalationLevel, 3);
    assert.equal(complaintAfterL3.status, 'ESCALATED');
    assert.equal(complaintAfterL3.escalationEvents.length, 3); // L2, Priority, L3
  });

  await t.test('4.7 District Collector Office issues official administrative directives', async () => {
    const res = await fetch(`${BASE_URL}/escalation/complaints/${testComplaintId}/instructions`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${collectorToken}`,
      },
      body: JSON.stringify({
        instructions: 'Deploy rapid sanitation task force to clear site immediately within 3 hours.',
        priority: 'EMERGENCY',
        notes: 'Direct Collectorate intervention under municipal sanitation emergency powers.',
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(
      body.data.collectorInstructions,
      'Deploy rapid sanitation task force to clear site immediately within 3 hours.'
    );
  });

  await t.test('4.8 Direct resolution stops automatic escalation permanently', async () => {
    const res = await fetch(`${BASE_URL}/escalation/complaints/${testComplaintId}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${collectorToken}`,
      },
      body: JSON.stringify({
        notes: 'Site fully cleared and sanitized. Field photographic proof verified by Collectorate staff.',
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, 'RESOLVED');

    // Attempt to force escalation again
    await prisma.complaint.update({
      where: { id: testComplaintId },
      data: {
        resolutionDeadline: new Date(Date.now() - 3600 * 1000),
      },
    });

    const checkRes = await fetch(`${BASE_URL}/escalation/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reference: testComplaintRef, force: true }),
    });
    assert.equal(checkRes.status, 200);

    // Complaint must STILL be RESOLVED and escalation must have stopped
    const finalComplaint = await prisma.complaint.findUnique({
      where: { id: testComplaintId },
    });
    assert.equal(finalComplaint.status, 'RESOLVED');
  });
});
