import { test, expect } from '@playwright/test';

test.describe('GPS Location & Accuracy Verification on Raise Complaint Page', () => {

  test('1. GPS Permission Granted with High Accuracy (<100m)', async ({ page, context }) => {
    // Grant geolocation permission and set high-accuracy coordinates (Visakhapatnam beach road, 18m accuracy)
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 17.71234, longitude: 83.31567, accuracy: 18 });

    // Login as citizen Priya
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.fill('input[type="email"]', 'priya.citizen@example.com');
    await page.fill('input[type="password"]', 'CitizenPassword@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Raise Complaint page
    await page.goto('/raise-complaint');
    await expect(page.locator('h1')).toContainText('Raise Complaint');

    // Verify initial default message
    await expect(page.locator('text=Default municipal area shown')).toBeVisible();

    // Click "Use My GPS"
    await page.click('button:has-text("Use My GPS")');

    // Verify High-Accuracy status banner and accuracy message
    await expect(page.locator('text=High-Accuracy GPS Fix')).toBeVisible();
    await expect(page.locator('text=Accurate to approximately 18 meters')).toBeVisible();

    // Verify coordinate pill overlay
    await expect(page.locator('text=Lat: 17.71234')).toBeVisible();
    await expect(page.locator('text=Lng: 83.31567')).toBeVisible();
    await expect(page.locator('text=±18m').first()).toBeVisible();
  });

  test('2. GPS Granted with Low Accuracy (>100m, e.g. 1500m ISP/Wi-Fi estimation)', async ({ page }) => {
    // Mock navigator.geolocation with 1500m accuracy (simulating laptop / Wi-Fi IP geolocation)
    await page.addInitScript(() => {
      window.navigator.geolocation.getCurrentPosition = (success, error, options) => {
        success({
          coords: {
            latitude: 18.14547,
            longitude: 83.44401,
            accuracy: 1500,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      };
    });

    // Login as citizen
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.fill('input[type="email"]', 'priya.citizen@example.com');
    await page.fill('input[type="password"]', 'CitizenPassword@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goto('/raise-complaint');
    await expect(page.locator('h1')).toContainText('Raise Complaint');

    // Click "Use My GPS"
    await page.click('button:has-text("Use My GPS")');

    // Verify warning banner and reported accuracy
    await expect(page.locator('text=Approximate Location Detected')).toBeVisible();
    await expect(page.locator('text=Approximate location, accuracy 1500 meters')).toBeVisible();
    await expect(page.locator('text=Large radius detected')).toBeVisible();

    // Verify coordinate pill has warning indicator
    await expect(page.locator('text=Lat: 18.14547')).toBeVisible();
    await expect(page.locator('text=Lng: 83.44401')).toBeVisible();
    await expect(page.locator('text=±1500m').first()).toBeVisible();
  });

  test('3. Refine Location via watchPosition with Progressive Accuracy', async ({ page }) => {
    // Mock watchPosition to deliver multiple readings improving from 450m -> 22m
    await page.addInitScript(() => {
      window.navigator.geolocation.watchPosition = (success, error, options) => {
        // First initial coarse reading
        setTimeout(() => {
          success({
            coords: {
              latitude: 17.7200,
              longitude: 83.3000,
              accuracy: 450,
            },
            timestamp: Date.now(),
          });
        }, 100);

        // Second improved reading
        setTimeout(() => {
          success({
            coords: {
              latitude: 17.7225,
              longitude: 83.3025,
              accuracy: 22,
            },
            timestamp: Date.now(),
          });
        }, 400);

        return 999; // watchId
      };

      window.navigator.geolocation.clearWatch = (id) => {
        window.__watchCleared = id;
      };
    });

    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.fill('input[type="email"]', 'priya.citizen@example.com');
    await page.fill('input[type="password"]', 'CitizenPassword@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goto('/raise-complaint');
    await expect(page.locator('h1')).toContainText('Raise Complaint');

    // Click "Refine Location"
    await page.click('button:has-text("Refine Location")');

    // Verify refined location is acquired
    await expect(page.locator('text=Refined location! Accurate to approximately 22 meters')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Lat: 17.72250')).toBeVisible();
    await expect(page.locator('text=±22m').first()).toBeVisible();

    // Verify "Lock Spot" button exists and click it
    await page.click('button:has-text("Lock Spot")');
    await expect(page.locator('text=Location locked at 22m accuracy')).toBeVisible();

    // Verify clearWatch was called
    const cleared = await page.evaluate(() => window.__watchCleared);
    expect(cleared).toBe(999);
  });

  test('4. GPS Permission Denied Error Handling', async ({ page }) => {
    // Mock permission denied error (code 1)
    await page.addInitScript(() => {
      window.navigator.geolocation.getCurrentPosition = (success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          message: 'User denied Geolocation',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      };
    });

    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.fill('input[type="email"]', 'priya.citizen@example.com');
    await page.fill('input[type="password"]', 'CitizenPassword@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goto('/raise-complaint');
    await expect(page.locator('h1')).toContainText('Raise Complaint');

    await page.click('button:has-text("Use My GPS")');

    // Verify error banner
    await expect(page.getByText('Location Permission Denied', { exact: true })).toBeVisible();
    await expect(page.locator('text=Please allow location access')).toBeVisible();
  });

  test('5. Manual Map Selection and Complaint Submission with Custom Coordinates', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.fill('input[type="email"]', 'priya.citizen@example.com');
    await page.fill('input[type="password"]', 'CitizenPassword@123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goto('/raise-complaint');
    await expect(page.locator('h1')).toContainText('Raise Complaint');

    // Click on the Leaflet map container to position pin manually
    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible();
    await map.click({ position: { x: 120, y: 100 } });

    // Verify status updates to Manual Location Selected
    await expect(page.locator('text=Manual Location Selected')).toBeVisible();
    await expect(page.locator('text=Manual Pin')).toBeVisible();

    // Fill the rest of the form
    await page.fill('textarea', 'Waste bin overflow at custom map selected spot near market gate.');
    await page.fill('input[placeholder*="Near Community Hall"]', 'Market Gate 4, Sector 7');

    // Submit complaint
    await page.click('button:has-text("Submit Complaint")');

    // Verify success banner and tracking reference
    await expect(page.locator('text=Complaint Registered!')).toBeVisible({ timeout: 15000 });
  });

});
