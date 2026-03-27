import { test, expect } from '@playwright/test';
import {
  clearIndexedDB,
  waitForMap,
  clickMap,
  fillSpotForm,
  submitSpotForm,
  cancelSpotForm,
  waitForSpot,
  exportSpots,
  importSpots,
  getSpotsFromList,
  getMarkerCount,
  deleteSpot,
  clickMarker,
  applyFilters,
  searchSpots,
  clearFilters,
  hasValidationError,
} from './helpers';

/**
 * E2E Test Suite for StreetMark PWA
 *
 * Tests cover:
 * - E2E-1: Full user journey (add, edit, delete)
 * - E2E-2: Filter & search functionality
 * - E2E-3: Export & import workflow
 * - E2E-4: Conflict resolution during import
 * - E2E-5: Data persistence across browser refresh
 * - E2E-6: Form validation errors
 */

test.describe('StreetMark E2E Tests', () => {
  // Setup: Navigate and clear IndexedDB before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearIndexedDB(page);
    await page.reload();
    await waitForMap(page);
  });

  /**
   * E2E-1: Full User Journey (Happy Path)
   *
   * User can:
   * 1. See empty map on first load
   * 2. Click map to add new spot
   * 3. Fill form and submit
   * 4. See spot on map and in list
   * 5. Click marker to edit
   * 6. Update spot details
   * 7. Delete spot
   */
  test('E2E-1: Full user journey - add, edit, delete spot', async ({ page }) => {
    // 1. App loads with map (demo spots may be present)
    await expect(page.locator('.leaflet-container')).toBeVisible();
    const initialMarkerCount = await getMarkerCount(page);

    // 2. Click map → form should open with coords
    await clickMap(page, 45.464, 9.19);
    await expect(page.locator('.spot-form')).toBeVisible({ timeout: 5000 });

    // Verify coordinates are pre-filled (approximately - allow for Leaflet coordinate conversion)
    const latInput = page.locator('input[name="lat"]');
    const lngInput = page.locator('input[name="lng"]');
    const latValue = await latInput.inputValue();
    const lngValue = await lngInput.inputValue();

    // Check coordinates are in Milan area (rough bounds)
    expect(parseFloat(latValue)).toBeGreaterThan(45.4);
    expect(parseFloat(latValue)).toBeLessThan(45.5);
    expect(parseFloat(lngValue)).toBeGreaterThan(9.1);
    expect(parseFloat(lngValue)).toBeLessThan(9.3);

    // 3. Fill form
    await fillSpotForm(page, {
      type: 'wall',
      status: 'free',
      securityLevel: 'low',
      notes: 'Test spot E2E - user journey',
    });

    // 4. Submit → spot appears on map + list
    await submitSpotForm(page);

    // Wait for form to close
    await expect(page.locator('.spot-form')).not.toBeVisible({ timeout: 5000 });

    // Check marker count increased
    const newMarkerCount = await getMarkerCount(page);
    expect(newMarkerCount).toBe(initialMarkerCount + 1);

    // Check spot appears in list
    const spots = await getSpotsFromList(page);
    const testSpot = spots.find((s) => s.text?.includes('Test spot E2E - user journey'));
    expect(testSpot).toBeDefined();

    // 5. Click marker → form opens for edit
    if (testSpot?.id) {
      await clickMarker(page, testSpot.id);
      await expect(page.locator('.spot-form')).toBeVisible({ timeout: 5000 });

      // Verify form is in edit mode (button text shows "Save" not "Submit")
      const submitButton = page.locator('.spot-form button[type="submit"]');
      await expect(submitButton).toContainText(/Save/i);

      // 6. Change notes → submit → updates
      await page.fill('textarea[name="notes"]', 'Updated notes E2E');
      await submitSpotForm(page);

      // Wait for form to close
      await expect(page.locator('.spot-form')).not.toBeVisible({ timeout: 5000 });

      // Verify update in list
      const updatedSpots = await getSpotsFromList(page);
      const updatedSpot = updatedSpots.find((s) => s.text?.includes('Updated notes E2E'));
      expect(updatedSpot).toBeDefined();

      // 7. Click delete → spot removed
      await deleteSpot(page, testSpot.id);

      // Verify spot removed from list
      const finalSpots = await getSpotsFromList(page);
      const deletedSpot = finalSpots.find((s) => s.id === testSpot.id);
      expect(deletedSpot).toBeUndefined();

      // Verify marker count decreased
      const finalMarkerCount = await getMarkerCount(page);
      expect(finalMarkerCount).toBe(initialMarkerCount);
    }
  });

  /**
   * E2E-2: Filter & Search
   *
   * User can:
   * 1. Add multiple spots of different types
   * 2. Filter by type
   * 3. Clear filters
   * 4. Search by text
   * 5. Clear search
   */
  test('E2E-2: Filter and search spots', async ({ page }) => {
    // Add 3 spots with different types
    const spotsToAdd = [
      { lat: 45.464, lng: 9.19, type: 'wall', notes: 'Wall spot test' },
      { lat: 45.465, lng: 9.191, type: 'train', notes: 'Train spot test' },
      { lat: 45.466, lng: 9.192, type: 'sign', notes: 'Sign spot test' },
    ];

    for (const spot of spotsToAdd) {
      await clickMap(page, spot.lat, spot.lng);
      await fillSpotForm(page, {
        type: spot.type,
        status: 'free',
        notes: spot.notes,
      });
      await submitSpotForm(page);
      await expect(page.locator('.spot-form')).not.toBeVisible({ timeout: 3000 });
    }

    // Wait for all spots to be added
    await page.waitForTimeout(1000);

    // Get initial spot count (includes demo spots)
    const allSpots = await getSpotsFromList(page);
    const initialCount = allSpots.length;
    expect(initialCount).toBeGreaterThanOrEqual(3);

    // Apply filter (type=wall) → only wall spots visible
    await applyFilters(page, { type: 'wall' });
    await page.waitForTimeout(500);

    const wallSpots = await getSpotsFromList(page);
    expect(wallSpots.length).toBeLessThan(initialCount);
    expect(wallSpots.some((s) => s.text?.includes('Wall spot test'))).toBe(true);

    // Clear filter → all visible
    await clearFilters(page);
    await page.waitForTimeout(500);

    const allSpotsAgain = await getSpotsFromList(page);
    expect(allSpotsAgain.length).toBe(initialCount);

    // Search "Train" → only train spot visible
    await searchSpots(page, 'Train');
    await page.waitForTimeout(500);

    const trainSpots = await getSpotsFromList(page);
    expect(trainSpots.length).toBeLessThan(initialCount);
    expect(trainSpots.some((s) => s.text?.includes('Train spot test'))).toBe(true);

    // Clear search → all visible
    await searchSpots(page, '');
    await page.waitForTimeout(500);

    const allSpotsFinal = await getSpotsFromList(page);
    expect(allSpotsFinal.length).toBe(initialCount);
  });

  /**
   * E2E-3: Export & Import
   *
   * User can:
   * 1. Add spots
   * 2. Export to JSON
   * 3. Clear database
   * 4. Import JSON
   * 5. Spots are restored
   */
  test('E2E-3: Export and import spots', async ({ page }) => {
    // Add 2 spots
    const spotsToAdd = [
      { lat: 45.464, lng: 9.19, notes: 'Export test spot 1' },
      { lat: 45.465, lng: 9.191, notes: 'Export test spot 2' },
    ];

    for (const spot of spotsToAdd) {
      await clickMap(page, spot.lat, spot.lng);
      await fillSpotForm(page, {
        type: 'wall',
        status: 'free',
        notes: spot.notes,
      });
      await submitSpotForm(page);
      await expect(page.locator('.spot-form')).not.toBeVisible({ timeout: 3000 });
    }

    // Wait for spots to be saved
    await page.waitForTimeout(1000);

    // Export → JSON downloads
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportSpots(page),
    ]);

    expect(download).toBeDefined();
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // Clear database
    await clearIndexedDB(page);
    await page.reload();
    await waitForMap(page);

    // Verify spots cleared (only demo spots remain)
    const spotsAfterClear = await getSpotsFromList(page);
    expect(spotsAfterClear.some((s) => s.text?.includes('Export test spot'))).toBe(false);

    // Import JSON → merge preview shows added spots
    if (downloadPath) {
      await importSpots(page, downloadPath);

      // Wait for merge preview
      const mergePreview = page.locator('.merge-preview');
      await expect(mergePreview).toBeVisible({ timeout: 5000 });

      // Check merge preview shows 2 added
      const addedCount = page.locator('.merge-preview .added-count');
      await expect(addedCount).toContainText('2');

      // Confirm import (English text)
      const confirmButton = page.locator('button:has-text("Confirm Import")');
      await confirmButton.click();

      // Wait for import to complete
      await expect(mergePreview).not.toBeVisible({ timeout: 5000 });

      // Verify spots restored
      await page.waitForTimeout(1000);
      const spotsAfterImport = await getSpotsFromList(page);
      expect(spotsAfterImport.some((s) => s.text?.includes('Export test spot 1'))).toBe(true);
      expect(spotsAfterImport.some((s) => s.text?.includes('Export test spot 2'))).toBe(true);
    }
  });

  /**
   * E2E-4: Conflict Resolution
   *
   * User can:
   * 1. Add spot A (T1)
   * 2. Export
   * 3. Edit spot A (T2)
   * 4. Import old export
   * 5. Conflict detected, newer version kept
   */
  test('E2E-4: Import handles conflicts correctly', async ({ page }) => {
    // Add spot A
    await clickMap(page, 45.464, 9.19);
    await fillSpotForm(page, {
      type: 'wall',
      status: 'free',
      notes: 'Conflict test spot - version 1',
    });
    await submitSpotForm(page);
    await expect(page.locator('.spot-form')).not.toBeVisible({ timeout: 3000 });

    // Wait for spot to be saved (T1)
    await page.waitForTimeout(1000);

    // Get spot ID
    const spots = await getSpotsFromList(page);
    const spotA = spots.find((s) => s.text?.includes('Conflict test spot'));
    expect(spotA).toBeDefined();

    // Export → JSON1 (T1 version)
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportSpots(page),
    ]);
    const downloadPath = await download.path();

    // Wait a moment to ensure timestamps differ
    await page.waitForTimeout(2000);

    // Edit spot A (T2)
    if (spotA?.id) {
      await clickMarker(page, spotA.id);
      await expect(page.locator('.spot-form')).toBeVisible({ timeout: 5000 });

      await page.fill('textarea[name="notes"]', 'Conflict test spot - version 2 (NEWER)');
      await submitSpotForm(page);
      await expect(page.locator('.spot-form')).not.toBeVisible({ timeout: 3000 });

      // Wait for update
      await page.waitForTimeout(1000);

      // Import JSON1 → merge preview shows conflict
      if (downloadPath) {
        await importSpots(page, downloadPath);

        // Wait for merge preview
        const mergePreview = page.locator('.merge-preview');
        await expect(mergePreview).toBeVisible({ timeout: 5000 });

        // Check for conflicts
        const conflictCount = page.locator('.merge-preview .conflict-count');
        await expect(conflictCount).toContainText('1');

        // Confirm → keeps T2 version (newer)
        const confirmButton = page.locator('button:has-text("Confirm Import")');
        await confirmButton.click();

        await expect(mergePreview).not.toBeVisible({ timeout: 5000 });

        // Verify T2 version kept (newer)
        await page.waitForTimeout(1000);
        const finalSpots = await getSpotsFromList(page);
        const finalSpotA = finalSpots.find((s) => s.text?.includes('Conflict test spot'));
        expect(finalSpotA?.text).toContain('version 2 (NEWER)');
        expect(finalSpotA?.text).not.toContain('version 1');
      }
    }
  });

  /**
   * E2E-5: Persistence
   *
   * User can:
   * 1. Add spot
   * 2. Refresh browser
   * 3. Spot still visible (IndexedDB persistence)
   */
  test('E2E-5: Spots persist across browser refresh', async ({ page }) => {
    // Add spot
    await clickMap(page, 45.464, 9.19);
    await fillSpotForm(page, {
      type: 'wall',
      status: 'free',
      notes: 'Persistence test spot',
    });
    await submitSpotForm(page);
    await expect(page.locator('.spot-form')).not.toBeVisible({ timeout: 3000 });

    // Wait for spot to be saved
    await page.waitForTimeout(1000);

    // Verify spot visible
    const spotsBeforeRefresh = await getSpotsFromList(page);
    const testSpot = spotsBeforeRefresh.find((s) => s.text?.includes('Persistence test spot'));
    expect(testSpot).toBeDefined();

    // Refresh browser
    await page.reload();
    await waitForMap(page);

    // Spot still visible
    await page.waitForTimeout(1000);
    const spotsAfterRefresh = await getSpotsFromList(page);
    const persistedSpot = spotsAfterRefresh.find((s) => s.text?.includes('Persistence test spot'));
    expect(persistedSpot).toBeDefined();
    expect(persistedSpot?.id).toBe(testSpot?.id);
  });

  /**
   * E2E-6: Validation Errors
   *
   * User can:
   * 1. Open form
   * 2. Leave required fields blank
   * 3. Submit → error shown, submit blocked
   * 4. Fill fields → submit enabled
   * 5. Submit → spot created
   */
  test('E2E-6: Form shows validation errors', async ({ page }) => {
    // Click map → form opens
    await clickMap(page, 45.464, 9.19);
    await expect(page.locator('.spot-form')).toBeVisible({ timeout: 5000 });

    // Leave notes blank, try to submit
    await fillSpotForm(page, {
      type: 'wall',
      status: 'free',
    });

    // Submit → error shown
    await submitSpotForm(page);

    // Check for validation error on notes field
    const notesError = await hasValidationError(page, 'notes');
    expect(notesError).toBe(true);

    // Form should still be visible (submit blocked)
    await expect(page.locator('.spot-form')).toBeVisible();

    // Fill notes → error disappears
    await page.fill('textarea[name="notes"]', 'Validation test spot');
    await page.waitForTimeout(300);

    // Submit → spot created
    await submitSpotForm(page);

    // Form closes
    await expect(page.locator('.spot-form')).not.toBeVisible({ timeout: 5000 });

    // Spot appears in list
    await page.waitForTimeout(1000);
    const spots = await getSpotsFromList(page);
    const validatedSpot = spots.find((s) => s.text?.includes('Validation test spot'));
    expect(validatedSpot).toBeDefined();
  });
});
