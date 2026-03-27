# StreetMark E2E Test Suite

**End-to-end testing with Playwright for StreetMark PWA**

## Overview

This E2E test suite validates the complete user journey through the StreetMark PWA, including:
- Real browser interactions (Chromium)
- Real IndexedDB persistence
- Map interactions with Leaflet
- Form validation and CRUD operations
- Import/export workflows
- Conflict resolution

## Test Scenarios

### E2E-1: Full User Journey
**Coverage**: Add → Edit → Delete workflow

1. App loads with map
2. User clicks map at coordinates
3. Form opens with pre-filled coords
4. User fills type, status, notes
5. Spot appears on map as marker
6. Spot appears in list
7. User clicks marker to edit
8. Form opens with existing data
9. User updates notes
10. Changes persist in list and map
11. User deletes spot
12. Spot removed from map and list

### E2E-2: Filter & Search
**Coverage**: Discovery and filtering

1. Add 3 spots (wall, train, sign)
2. Apply type filter (wall only)
3. Only wall spots visible
4. Clear filter
5. All spots visible again
6. Search by text query
7. Only matching spots visible
8. Clear search
9. All spots visible again

### E2E-3: Export & Import
**Coverage**: Data portability

1. Add 2 spots
2. Export to JSON file (downloads)
3. Clear IndexedDB
4. Import JSON file
5. Merge preview shows 2 added
6. Confirm import
7. Spots restored in map and list

### E2E-4: Conflict Resolution
**Coverage**: Timestamp-based merge

1. Add spot A at time T1
2. Export JSON (contains T1 version)
3. Edit spot A at time T2 (newer)
4. Import old JSON (T1 version)
5. Merge preview shows 1 conflict
6. Confirm import
7. T2 version kept (newer wins)

### E2E-5: Persistence
**Coverage**: IndexedDB across sessions

1. Add spot
2. Spot visible in list/map
3. Refresh browser
4. Spot still visible (persisted)

### E2E-6: Validation Errors
**Coverage**: Form validation UX

1. Click map to open form
2. Leave notes field blank
3. Attempt submit
4. Validation error shown
5. Submit blocked
6. Fill notes field
7. Submit succeeds
8. Spot created

## Test Utilities (helpers.ts)

### IndexedDB Management
- `clearIndexedDB(page)` - Clear database before tests

### Map Interactions
- `waitForMap(page)` - Wait for Leaflet to load
- `clickMap(page, lat, lng)` - Simulate click at coords
- `getMarkerCount(page)` - Count markers on map
- `clickMarker(page, spotId)` - Click specific marker

### Form Interactions
- `fillSpotForm(page, data)` - Fill form fields
- `submitSpotForm(page)` - Submit form
- `cancelSpotForm(page)` - Cancel form
- `hasValidationError(page, field)` - Check for error

### Spot Management
- `waitForSpot(page, matcher)` - Wait for spot to appear
- `getSpotsFromList(page)` - Get all spots in list
- `deleteSpot(page, spotId)` - Delete by ID

### Filters & Search
- `applyFilters(page, filters)` - Apply type/status filters
- `searchSpots(page, query)` - Search by text
- `clearFilters(page)` - Reset filters

### Import/Export
- `exportSpots(page)` - Trigger export download
- `importSpots(page, filePath)` - Import JSON file

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run with debug mode (step-through)
```bash
npm run test:e2e:debug
```

### Run specific test
```bash
npx playwright test --grep "E2E-1"
```

### Run in headed mode (see browser)
```bash
npx playwright test --headed
```

## View Reports

### HTML report (after test run)
```bash
npm run test:e2e:report
```

### Traces (on failure/retry)
Traces are automatically captured on first retry. View in Playwright trace viewer:
```bash
npx playwright show-trace trace.zip
```

## Configuration

See `playwright.config.ts` for:
- Base URL: `http://localhost:5173`
- Test directory: `tests/e2e/`
- Browser: Chromium only
- Timeout: 30s per test
- Workers: 1 (serial execution for IndexedDB safety)
- Screenshots: On failure
- Video: Retained on failure
- Traces: On first retry

## Prerequisites

### 1. Install dependencies
```bash
npm install
npm install -D @playwright/test
npx playwright install chromium
```

### 2. Ensure app components are implemented
Required components:
- `src/App.tsx` - Main app with state management
- `src/components/MapView.tsx` - Leaflet map
- `src/components/SpotForm.tsx` - CRUD form
- `src/components/SpotList.tsx` - Spot listing
- `src/components/SpotFilters.tsx` - Filters/search
- `src/components/ImportExport.tsx` - Data exchange
- `src/services/StorageService.ts` - IndexedDB wrapper

### 3. Ensure dev server works
```bash
npm run dev
# Should start on http://localhost:5173
```

## CI/CD Integration

### GitHub Actions example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests fail with "map not found"
- Ensure dev server is running on port 5173
- Check `webServer` config in `playwright.config.ts`
- Verify MapView component exposes map on `window.leafletMap`

### Tests fail with IndexedDB errors
- Ensure `clearIndexedDB()` is called in `beforeEach`
- Check browser console for IndexedDB quota errors
- Verify StorageService uses database name `streetmark-db`

### Tests are flaky
- Increase timeout in `playwright.config.ts`
- Add more `waitForTimeout()` calls after async operations
- Check for race conditions in app state updates

### Form selectors not found
- Verify form field `name` attributes match test selectors
- Check for dynamic class names or data-testid attributes
- Use Playwright inspector: `npx playwright test --debug`

## Test Data

### Demo spots (in App.tsx)
The app loads with 4 demo spots for Milano:
1. Duomo - wall, free
2. Stazione Centrale - train, occupied
3. Castello Sforzesco - sign, free
4. Navigli - wall, protected

Tests account for these demo spots when checking counts.

## Success Criteria

✅ All 6 E2E scenarios pass consistently
✅ No flaky tests (pass rate >95%)
✅ Screenshots captured on failure
✅ HTML report generated
✅ Real IndexedDB persistence tested
✅ Real Leaflet map interactions tested

## Future Enhancements

- [ ] Visual regression testing (Percy/Chromatic)
- [ ] Mobile viewport tests
- [ ] PWA offline mode tests
- [ ] Performance metrics (Lighthouse)
- [ ] Accessibility tests (axe-core)

---

**Last updated**: 2026-03-26
**Author**: Agent e2e-testing
**Framework**: Playwright 1.58+
