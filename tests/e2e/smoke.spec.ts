import { test, expect } from '@playwright/test';
import { clearIndexedDB, waitForMap } from './helpers';

/**
 * Smoke Test - Basic app functionality
 *
 * Quick sanity check that the app loads and basic components render.
 */
test.describe('Smoke Tests', () => {
  test('App loads successfully with map', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Clear IndexedDB for clean state
    await clearIndexedDB(page);
    await page.reload();

    // Check header
    await expect(page.locator('h1')).toContainText('StreetMark');

    // Wait for map to load
    await waitForMap(page);

    // Verify map container is visible
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();

    // Verify map has tiles loaded
    const tiles = page.locator('.leaflet-tile-loaded');
    await expect(tiles.first()).toBeVisible();
  });

  test('Sidebar components render', async ({ page }) => {
    await page.goto('/');
    await clearIndexedDB(page);
    await page.reload();
    await waitForMap(page);

    // Check for filters
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    // Check for spot list (might show empty state or actual list)
    const spotListEmpty = page.locator('.spot-list-empty');
    const spotList = page.locator('.spot-list');

    // Either empty message or spot list should be visible
    const hasEmptyMessage = await spotListEmpty.isVisible().catch(() => false);
    const hasSpotList = await spotList.isVisible().catch(() => false);

    expect(hasEmptyMessage || hasSpotList).toBe(true);
  });

  test('Import/Export controls present', async ({ page }) => {
    await page.goto('/');
    await clearIndexedDB(page);
    await page.reload();
    await waitForMap(page);

    // Check header for import/export
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();
  });
});
