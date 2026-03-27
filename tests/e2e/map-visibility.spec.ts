import { test, expect } from '@playwright/test';
import { clearIndexedDB, waitForMap } from './helpers';

/**
 * Map Visibility Debug Test
 *
 * This test explicitly checks map visibility and takes screenshots
 * to diagnose any rendering issues during E2E tests.
 */
test.describe('Map Visibility Debug', () => {
  test('Map renders and is visible throughout test lifecycle', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Clear IndexedDB for clean state
    await clearIndexedDB(page);
    await page.reload();

    // Take screenshot 1: After page load
    await page.screenshot({ path: 'test-results/map-debug-1-after-load.png', fullPage: true });

    // Wait for map to load
    await waitForMap(page);

    // Take screenshot 2: After map loaded
    await page.screenshot({ path: 'test-results/map-debug-2-after-map-loaded.png', fullPage: true });

    // Check map container
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();

    // Check tiles loaded
    const tiles = page.locator('.leaflet-tile-loaded');
    await expect(tiles.first()).toBeVisible();

    // Get map container dimensions
    const mapDimensions = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container') as HTMLElement;
      if (!container) return null;

      const rect = container.getBoundingClientRect();
      const computed = window.getComputedStyle(container);

      return {
        width: rect.width,
        height: rect.height,
        computedWidth: computed.width,
        computedHeight: computed.height,
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        zIndex: computed.zIndex,
      };
    });

    console.log('Map container dimensions:', mapDimensions);

    // Verify map has meaningful dimensions
    expect(mapDimensions).toBeTruthy();
    expect(mapDimensions!.width).toBeGreaterThan(100);
    expect(mapDimensions!.height).toBeGreaterThan(100);
    expect(mapDimensions!.display).not.toBe('none');
    expect(mapDimensions!.visibility).not.toBe('hidden');
    expect(parseFloat(mapDimensions!.opacity)).toBeGreaterThan(0);

    // Check if Leaflet map instance exists
    const hasLeafletMap = await page.evaluate(() => {
      const map = (window as any).leafletMap;
      return map !== undefined && map !== null;
    });

    expect(hasLeafletMap).toBe(true);
    console.log('Leaflet map instance exists:', hasLeafletMap);

    // Take screenshot 3: After visibility checks
    await page.screenshot({ path: 'test-results/map-debug-3-after-checks.png', fullPage: true });

    // Simulate user interaction: click on map
    await page.evaluate(() => {
      const map = (window as any).leafletMap;
      if (!map) throw new Error('Leaflet map not found on window');

      const center = map.getCenter();
      const point = map.latLngToContainerPoint(center);
      const target = map.getContainer();

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: point.x,
        clientY: point.y,
      });

      target.dispatchEvent(clickEvent);
    });

    // Wait for form to appear
    await page.waitForSelector('.spot-form', { timeout: 5000 });

    // Take screenshot 4: With form open
    await page.screenshot({ path: 'test-results/map-debug-4-form-open.png', fullPage: true });

    // Check if map is still visible behind form
    const mapStillVisible = await mapContainer.isVisible();
    expect(mapStillVisible).toBe(true);
    console.log('Map still visible with form open:', mapStillVisible);

    // Close form
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('.spot-form')).not.toBeVisible();

    // Take screenshot 5: After form closed
    await page.screenshot({ path: 'test-results/map-debug-5-form-closed.png', fullPage: true });

    // Final visibility check
    const finalCheck = await mapContainer.isVisible();
    expect(finalCheck).toBe(true);
    console.log('Final map visibility check:', finalCheck);
  });
});
