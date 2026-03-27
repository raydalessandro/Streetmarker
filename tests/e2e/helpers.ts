import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helpers for StreetMark PWA
 *
 * Utilities for interacting with the app during E2E tests:
 * - IndexedDB management
 * - Map interactions
 * - Form interactions
 * - Spot management
 * - Import/export operations
 */

/**
 * Clear IndexedDB database before each test
 * Ensures clean state for every test run
 *
 * NOTE: Must be called AFTER page.goto() since IndexedDB
 * is only available in a page context, not beforeEach.
 */
export async function clearIndexedDB(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase('streetmark-db');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => {
          console.warn('IndexedDB deletion blocked');
          resolve(); // Continue anyway
        };
      });
    });
  } catch (error) {
    // If IndexedDB is not available, just continue
    console.warn('Could not clear IndexedDB:', error);
  }
}

/**
 * Wait for Leaflet map to fully load
 * Checks for map container, Leaflet initialization, and tiles
 */
export async function waitForMap(page: Page): Promise<void> {
  // Wait for map container to be visible
  await page.waitForSelector('.leaflet-container', { state: 'visible', timeout: 10000 });

  // Wait for Leaflet map instance to be initialized
  await page.waitForFunction(() => {
    const map = (window as any).leafletMap;
    return map && map._loaded; // Leaflet sets _loaded when ready
  }, { timeout: 10000 });

  // Wait for at least one tile to load
  await page.waitForSelector('.leaflet-tile-loaded', { timeout: 15000 });

  // Wait for multiple tiles to ensure map is rendered
  await page.waitForFunction(() => {
    const tiles = document.querySelectorAll('.leaflet-tile-loaded');
    return tiles.length >= 4; // At least 4 tiles should be visible
  }, { timeout: 15000 });

  // Give map a moment to settle and render all tiles
  await page.waitForTimeout(1000);
}

/**
 * Simulate a click on the map at specific coordinates
 *
 * @param page - Playwright page object
 * @param lat - Latitude
 * @param lng - Longitude
 */
export async function clickMap(page: Page, lat: number, lng: number): Promise<void> {
  // Use Leaflet's API to simulate a click at coordinates
  await page.evaluate(
    ({ lat, lng }) => {
      const map = (window as any).leafletMap;
      if (!map) throw new Error('Leaflet map not found on window');

      const point = map.latLngToContainerPoint([lat, lng]);
      const target = map.getContainer();

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: point.x,
        clientY: point.y,
      });

      target.dispatchEvent(clickEvent);
    },
    { lat, lng }
  );
}

/**
 * Fill the SpotForm with provided data
 *
 * @param page - Playwright page object
 * @param data - Spot form data
 */
export async function fillSpotForm(
  page: Page,
  data: {
    type?: string;
    status?: string;
    securityLevel?: string;
    owner?: string;
    notes?: string;
    availabilityFrom?: string;
    availabilityTo?: string;
  }
): Promise<void> {
  // Fill type dropdown
  if (data.type) {
    await page.selectOption('select[name="type"]', data.type);
  }

  // Fill status dropdown
  if (data.status) {
    await page.selectOption('select[name="status"]', data.status);
  }

  // Fill security level dropdown
  if (data.securityLevel) {
    await page.selectOption('select[name="securityLevel"]', data.securityLevel);
  }

  // Fill owner (optional)
  if (data.owner) {
    await page.fill('input[name="owner"]', data.owner);
  }

  // Fill notes
  if (data.notes) {
    await page.fill('textarea[name="notes"]', data.notes);
  }

  // Fill availability time range (if provided)
  if (data.availabilityFrom) {
    await page.fill('input[name="availabilityFrom"]', data.availabilityFrom);
  }
  if (data.availabilityTo) {
    await page.fill('input[name="availabilityTo"]', data.availabilityTo);
  }
}

/**
 * Wait for a spot to appear in the list/map
 *
 * @param page - Playwright page object
 * @param matcher - Function to match the spot or spot ID
 */
export async function waitForSpot(
  page: Page,
  matcher: string | ((spot: any) => boolean)
): Promise<void> {
  if (typeof matcher === 'string') {
    // Wait for spot by ID (in list or marker)
    await page.waitForSelector(`[data-spot-id="${matcher}"]`, { timeout: 5000 });
  } else {
    // Wait for spot matching predicate
    await page.waitForFunction(
      (matcherFn) => {
        const spots = (window as any).__spots__ || [];
        return spots.some(matcherFn);
      },
      matcher,
      { timeout: 5000 }
    );
  }
}

/**
 * Export spots as JSON
 *
 * @param page - Playwright page object
 * @returns Promise that resolves when export completes
 */
export async function exportSpots(page: Page): Promise<void> {
  // Click export button (English text)
  const exportButton = page.locator('button:has-text("Export Data")');
  await exportButton.click();

  // Wait for download to start (Playwright auto-handles downloads)
  await page.waitForTimeout(1000);
}

/**
 * Import spots from a JSON file
 *
 * @param page - Playwright page object
 * @param filePath - Path to JSON file to import
 */
export async function importSpots(page: Page, filePath: string): Promise<void> {
  // Find file input and set files
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);

  // Wait for merge preview to appear
  await page.waitForSelector('.merge-preview', { timeout: 5000 });
}

/**
 * Get all spots currently in the list
 *
 * @param page - Playwright page object
 * @returns Array of spot elements
 */
export async function getSpotsFromList(page: Page): Promise<any[]> {
  return page.evaluate(() => {
    const spotElements = document.querySelectorAll('.spot-list-item');
    return Array.from(spotElements).map((el) => ({
      id: el.getAttribute('data-spot-id'),
      text: el.textContent,
    }));
  });
}

/**
 * Get count of markers on the map
 *
 * @param page - Playwright page object
 * @returns Number of markers
 */
export async function getMarkerCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const markers = document.querySelectorAll('.leaflet-marker-icon');
    return markers.length;
  });
}

/**
 * Check if form validation error is shown
 *
 * @param page - Playwright page object
 * @param fieldName - Name of the field to check
 * @returns True if error is shown
 */
export async function hasValidationError(page: Page, fieldName: string): Promise<boolean> {
  const errorSelector = `.field-error[data-field="${fieldName}"]`;
  const errorElement = page.locator(errorSelector);
  return errorElement.isVisible();
}

/**
 * Submit the spot form
 *
 * @param page - Playwright page object
 */
export async function submitSpotForm(page: Page): Promise<void> {
  // Look for Submit or Save button (English) or Salva (Italian)
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();
}

/**
 * Cancel the spot form
 *
 * @param page - Playwright page object
 */
export async function cancelSpotForm(page: Page): Promise<void> {
  // Look for Cancel button
  const cancelButton = page.locator('button.btn-secondary').first();
  await cancelButton.click();
}

/**
 * Delete a spot by clicking delete button in list
 *
 * @param page - Playwright page object
 * @param spotId - ID of spot to delete
 */
export async function deleteSpot(page: Page, spotId: string): Promise<void> {
  // Use aria-label selector as it's more reliable (English: "Delete spot")
  const deleteButton = page.locator(`[data-spot-id="${spotId}"] button[aria-label="Delete spot"]`);
  await deleteButton.click();

  // Wait for confirmation if present (no confirmation dialog in current implementation)
  await page.waitForTimeout(500);
}

/**
 * Click a marker on the map
 *
 * @param page - Playwright page object
 * @param spotId - ID of spot marker to click
 */
export async function clickMarker(page: Page, spotId: string): Promise<void> {
  const marker = page.locator(`.leaflet-marker-icon[data-spot-id="${spotId}"]`);
  await marker.click();
}

/**
 * Apply filters to the spot list
 *
 * @param page - Playwright page object
 * @param filters - Filter options
 */
export async function applyFilters(
  page: Page,
  filters: {
    type?: string;
    status?: string;
    securityLevel?: string;
  }
): Promise<void> {
  if (filters.type) {
    await page.selectOption('select[name="filterType"]', filters.type);
  }
  if (filters.status) {
    await page.selectOption('select[name="filterStatus"]', filters.status);
  }
  if (filters.securityLevel) {
    await page.selectOption('select[name="filterSecurityLevel"]', filters.securityLevel);
  }
}

/**
 * Perform search in spot list
 *
 * @param page - Playwright page object
 * @param query - Search query
 */
export async function searchSpots(page: Page, query: string): Promise<void> {
  const searchInput = page.locator('input[name="search"]');
  await searchInput.fill(query);
}

/**
 * Clear all filters
 *
 * @param page - Playwright page object
 */
export async function clearFilters(page: Page): Promise<void> {
  const clearButton = page.locator('button:has-text("Cancella filtri")');
  await clearButton.click();
}
