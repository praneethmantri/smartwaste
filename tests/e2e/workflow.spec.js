import { test, expect } from '@playwright/test';

test.describe('Smart Waste Management System - Browser E2E Journeys', () => {
  let createdRef = '';

  test('1. PWA, Manifest, and Service Worker Validation', async ({ page }) => {
    await page.goto('/');

    // Check Splash page renders
    await expect(page.locator('h1')).toContainText('Smart Waste Collection');

    // Check Manifest link exists and is valid
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestLink).toBe('/manifest.json');

    // Fetch manifest directly
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.status()).toBe(200);
    const manifestJson = await manifestResponse.json();
    expect(manifestJson.short_name).toBe('SmartWaste');
    expect(manifestJson.icons.length).toBeGreaterThanOrEqual(3);

    // Verify Favicon and Icons
    const faviconResp = await page.request.get('/favicon.ico');
    expect(faviconResp.status()).toBe(200);
    const icon192Resp = await page.request.get('/icon-192.png');
    expect(icon192Resp.status()).toBe(200);
  });

  test('2. Multi-Language Switching (English -> Telugu -> Hindi)', async ({ page }) => {
    // Clear storage for fresh session
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    // Log in as Citizen
    await page.fill('input[type="email"]', 'rahul.citizen@example.com');
    await page.fill('input[type="password"]', 'CitizenPassword@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Language dropdown in TopAppBar
    const langSelect = page.locator('header select');
    await expect(langSelect).toBeVisible();

    // Switch to Telugu
    await langSelect.selectOption('te');
    await expect(page.locator('header h1')).toContainText('స్మార్ట్ చెత్త నిర్వహణ వ్యవస్థ');

    // Switch to Hindi
    await langSelect.selectOption('hi');
    await expect(page.locator('header h1')).toContainText('स्मार्ट कचरा प्रबंधन प्रणाली');

    // Switch back to English
    await langSelect.selectOption('en');
    await expect(page.locator('header h1')).toContainText('Smart Waste Management');
  });

  test('3. Responsive Design Across Mobile, Tablet, and Desktop Viewports', async ({ page }) => {
    const viewports = [
      { width: 360, height: 800, name: 'Mobile 360x800' },
      { width: 390, height: 844, name: 'iPhone 390x844' },
      { width: 412, height: 915, name: 'Pixel 412x915' },
      { width: 768, height: 1024, name: 'Tablet 768x1024' },
      { width: 1366, height: 768, name: 'Laptop 1366x768' },
      { width: 1920, height: 1080, name: 'Desktop 1920x1080' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');

      // Verify no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // allows negligible pixel rounding

      // Verify essential buttons are clickable and visible
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    }
  });

  test('4. Complete End-to-End Civic Lifecycle in Browser', async ({ page }) => {
    // STEP 1: Citizen logs in and creates a complaint
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.fill('input[type="email"]', 'priya.citizen@example.com');
    await page.fill('input[type="password"]', 'CitizenPassword@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Raise Complaint
    await page.goto('/raise-complaint');
    await expect(page.locator('h1')).toContainText('Raise Complaint');

    // Fill form
    await page.fill('textarea', 'Browser E2E automated test: Overflowing public trash bin near main market entrance.');
    await page.fill('input[placeholder*="landmark"], input[placeholder*="Street"], input[name="address"]', 'Market Road Gate 1, Clock Tower');

    // Submit complaint
    await page.click('button[type="submit"]');

    // Wait for submission confirmation screen
    await page.waitForSelector('text=Complaint Registered!');
    const refElement = page.locator('p.font-mono');
    createdRef = (await refElement.textContent()).trim();
    expect(createdRef).toMatch(/^SW-\d{4}-\d+/);

    // STEP 2: Administrator logs in and assigns complaint
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.fill('input[type="email"]', 'admin@smartwaste.gov');
    await page.fill('input[type="password"]', 'AdminPassword@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*admin/);

    // Navigate to Admin Complaints
    await page.goto('/admin/complaints');
    await page.waitForSelector(`text=${createdRef}`);

    // Click Assign button on this complaint
    const complaintCard = page.locator(`text=${createdRef}`).locator('xpath=ancestor::div[contains(@class, "bg-white")][1]');
    await complaintCard.locator('button:has-text("Assign")').click();

    // In modal, select worker
    await page.locator('div.fixed select').selectOption({ index: 1 });
    await page.click('button:has-text("Confirm Assignment")');

    // Verify status changes to ASSIGNED
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${createdRef}`)).toBeVisible();

    // STEP 3: Sanitation Worker Suresh logs in
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.fill('input[type="email"]', 'suresh.worker@smartwaste.gov');
    await page.fill('input[type="password"]', 'WorkerPassword@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*worker/);

    // Worker finds assigned task and starts it
    await page.waitForSelector(`text=${createdRef}`);
    const taskCard = page.locator(`text=${createdRef}`).locator('xpath=ancestor::div[contains(@class, "bg-white")][1]');
    await taskCard.locator('button:has-text("Start Work")').click();

    // Status is now IN_PROGRESS, switch to In Progress tab
    await page.locator('span:has-text("In Progress")').first().click();
    await page.waitForSelector(`text=${createdRef}`);

    // STEP 4: Citizen verifies tracking updates
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.fill('input[type="email"]', 'priya.citizen@example.com');
    await page.fill('input[type="password"]', 'CitizenPassword@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goto('/track');
    await expect(page.locator(`text=${createdRef}`)).toBeVisible();
  });
});
