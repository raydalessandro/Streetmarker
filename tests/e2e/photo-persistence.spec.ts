// E2E test for photo persistence - verify photos survive refresh
import { test, expect } from '@playwright/test';
import { clearIndexedDB, waitForMap, clickMap, fillSpotForm, submitSpotForm, getSpotsFromList } from './helpers';

test.describe('Photo Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearIndexedDB(page);
    await page.reload();
    await waitForMap(page);
  });

  test('photos should persist after page refresh', async ({ page }) => {
    // 1. Create spot with photo
    await clickMap(page, 45.464, 9.19);
    await fillSpotForm(page, {
      type: 'wall',
      status: 'free',
      notes: 'Test spot with photo',
    });

    // 2. Upload photo (mock file input)
    const fileInput = page.locator('input[type="file"]');

    // Create a test image file
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(testImageBase64, 'base64');

    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer,
    });

    // Wait for upload to complete
    await page.waitForTimeout(500);

    // 3. Submit form
    await submitSpotForm(page);

    // 4. Verify photo visible in thumbnails
    await expect(page.locator('.photo-thumbnail img')).toBeVisible({ timeout: 5000 });

    // 5. Get spot data from IndexedDB before refresh
    const spotBeforeRefresh = await page.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('streetmark-db', 1);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('spots', 'readonly');
          const store = tx.objectStore('spots');
          const getAllRequest = store.getAll();
          getAllRequest.onsuccess = () => {
            resolve(getAllRequest.result[0]);
          };
        };
      });
    });

    console.log('Spot before refresh:', spotBeforeRefresh);

    // 6. Refresh page
    await page.reload();
    await waitForMap(page);

    // 7. Verify spot still exists
    const spots = await getSpotsFromList(page);
    expect(spots.some(s => s.text?.includes('Test spot with photo'))).toBe(true);

    // 8. Get spot data from IndexedDB after refresh
    const spotAfterRefresh = await page.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('streetmark-db', 1);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('spots', 'readonly');
          const store = tx.objectStore('spots');
          const getAllRequest = store.getAll();
          getAllRequest.onsuccess = () => {
            resolve(getAllRequest.result[0]);
          };
        };
      });
    });

    console.log('Spot after refresh:', spotAfterRefresh);

    // 9. CRITICAL: Verify photos array persisted
    expect(spotAfterRefresh).toHaveProperty('photos');
    expect((spotAfterRefresh as any).photos).toBeDefined();
    expect((spotAfterRefresh as any).photos.length).toBeGreaterThan(0);

    // 10. Click spot to open detail and verify photo still renders
    const spotCards = page.locator('.spot-card');
    await spotCards.first().click();

    // Photo should be visible in detail view
    await expect(page.locator('.photo-thumbnail img')).toBeVisible({ timeout: 5000 });
  });

  test('multiple photos should persist after refresh', async ({ page }) => {
    // 1. Create spot
    await clickMap(page, 45.465, 9.191);
    await fillSpotForm(page, {
      type: 'train',
      status: 'occupied',
      notes: 'Multiple photos test',
    });

    // 2. Upload 3 photos
    const fileInput = page.locator('input[type="file"]');
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(testImageBase64, 'base64');

    for (let i = 0; i < 3; i++) {
      await fileInput.setInputFiles({
        name: `test${i}.png`,
        mimeType: 'image/png',
        buffer,
      });
      await page.waitForTimeout(300);
    }

    // 3. Submit
    await submitSpotForm(page);

    // 4. Verify 3 thumbnails visible
    const thumbnailsBeforeRefresh = page.locator('.photo-thumbnail');
    await expect(thumbnailsBeforeRefresh).toHaveCount(3, { timeout: 5000 });

    // 5. Refresh
    await page.reload();
    await waitForMap(page);

    // 6. Click spot
    const spotCards = page.locator('.spot-card');
    await spotCards.first().click();

    // 7. Verify 3 thumbnails still visible after refresh
    const thumbnailsAfterRefresh = page.locator('.photo-thumbnail');
    await expect(thumbnailsAfterRefresh).toHaveCount(3, { timeout: 5000 });
  });
});
