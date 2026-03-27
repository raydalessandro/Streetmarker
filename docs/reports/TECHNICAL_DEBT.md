# Technical Debt Backlog

**Last Updated:** 2026-03-27
**Total Items:** 13
**Estimated Total Effort:** ~30 hours

---

## P0 — Must Fix Before Production

### [ ] 1. Sidebar Spot Click Handler Missing
**Description:** Clicking a spot in the sidebar (Map view) doesn't open the detail modal or highlight the marker. Only Edit/Delete buttons work.

**Files:**
- `src/App.tsx` L358-362
- `src/components/SpotList.tsx`

**Root Cause:** SpotList component has no `onSpotClick` prop/handler.

**Fix Strategy:**
1. Add `onSpotClick` prop to SpotList interface
2. Bind click handler to spot list items
3. Handler should: highlight marker + open detail modal + close sidebar

**Estimated Time:** 30 minutes

**Acceptance Criteria:**
- User clicks spot in sidebar → marker highlights on map
- Detail modal opens with spot info
- Sidebar auto-closes after selection

---

### [ ] 2. Favorite Toggle State Sync Issue
**Description:** Toggling favorites may not update Gallery view immediately. SpotListView modal closes before state updates. No loading feedback during async operation.

**Files:**
- `src/App.tsx` L210-247 (handleToggleFavorite, handleToggleFavoriteFromList)
- `src/components/SpotListView.tsx` L302-312

**Root Cause:**
1. No optimistic UI updates (waits for IndexedDB write)
2. SpotListView modal doesn't reflect updated state before closing
3. Potential race condition with Gallery's useEffect

**Fix Strategy:**
1. Add optimistic update: Update UI state immediately, rollback on error
2. Add loading spinner during async operation
3. Prevent double-clicks with disabled button state

**Estimated Time:** 1 hour

**Acceptance Criteria:**
- Favorite toggle shows immediate UI feedback
- Loading spinner appears during save
- Gallery view updates immediately when toggling from Map view
- Error handling with rollback on failure

---

### [ ] 3. Remove Duplicate Modal in SpotListView
**Description:** SpotListView implements its own detail modal (L205-318) instead of reusing the shared SpotDetailModal component. Causes code duplication and maintenance burden.

**Files:**
- `src/components/SpotListView.tsx` L205-318 (duplicate modal)
- `src/components/SpotDetailModal.tsx` (canonical version)

**Root Cause:** Component written independently without reusing shared component.

**Fix Strategy:**
1. Import SpotDetailModal into SpotListView
2. Remove internal modal implementation (L205-318)
3. Replace with SpotDetailModal component (10 lines)
4. Verify all functionality (View on Map, Edit, Open in Maps, Toggle Favorite)

**Estimated Time:** 30 minutes

**Acceptance Criteria:**
- SpotListView uses shared SpotDetailModal
- All actions work identically
- ~110 lines of duplicate code removed

---

### [ ] 4. Add Error Boundaries
**Description:** No error boundaries in the app. If any component throws an error, the entire app crashes with white screen.

**Files:**
- `src/App.tsx` (no error boundary wrapper)
- `src/components/ErrorBoundary.tsx` (new file)

**Root Cause:** Missing production-grade error handling.

**Fix Strategy:**
1. Create ErrorBoundary component with fallback UI
2. Wrap App in ErrorBoundary
3. Add error reporting (console.error or external service)
4. Design user-friendly error screen with "Reload" button

**Estimated Time:** 1 hour

**Acceptance Criteria:**
- Component errors don't crash entire app
- User sees friendly error message with recovery option
- Error details logged to console
- Error boundary catches errors in IndexedDB, Leaflet, photo processing

---

## P1 — Should Fix Soon

### [ ] 5. Props Drilling Hell (App.tsx)
**Description:** App.tsx passes 10+ props to child components. Makes code hard to maintain and test. Adding new features requires modifying 4-5 files.

**Files:**
- `src/App.tsx` (entire component)
- All view components (SpotListView, Gallery, Feed, Settings)

**Root Cause:** No state management library — all state lives in App.tsx.

**Fix Strategy (Short-term):**
1. Extract custom hooks:
   - `useSpotManagement` (add, update, delete, refresh)
   - `useViewState` (currentView, sidebar, selectedSpot)
   - `useFilterState` (filters, search)

**Fix Strategy (Long-term):**
1. Introduce Context API:
   - `SpotsContext` (spots data + CRUD operations)
   - `FilterContext` (filters, search, sorted/filtered data)
   - `UIContext` (view state, modals, sidebar)

**Estimated Time:** 4 hours (hooks) or 6-8 hours (Context API)

**Acceptance Criteria:**
- Component props reduced from 10+ to 2-3
- State logic extracted from App.tsx
- Components easier to test in isolation
- No prop drilling beyond 2 levels

---

### [ ] 6. Add Loading States to Async Operations
**Description:** Async operations (IndexedDB reads/writes, favorite toggle, delete) have no loading UI. Users may double-click or experience freezes.

**Files:**
- `src/App.tsx` L52-55 (refreshSpots)
- `src/App.tsx` L210-229 (handleToggleFavorite)
- `src/App.tsx` L197-204 (handleDelete)
- `src/components/SpotDetailModal.tsx` (buttons)

**Root Cause:** No loading state management for async operations.

**Fix Strategy:**
1. Add `isLoading` state for each async operation
2. Disable buttons during loading
3. Show spinner or "Saving..." text
4. Use AbortController to cancel pending operations

**Estimated Time:** 2 hours

**Acceptance Criteria:**
- Buttons disabled during async operations
- Loading spinner/text visible
- Users can't double-click
- Loading state clears on error or success

---

### [ ] 7. Extract Overly Large Components
**Description:** Several components exceed 300 LOC, making them hard to maintain and test.

**Files:**
- `src/App.tsx` — 452 LOC
- `src/components/SpotListView.tsx` — 321 LOC
- `src/services/MapService.ts` — 323 LOC
- `src/components/SpotFilters.tsx` — 285 LOC

**Fix Strategy:**

**App.tsx (452 → ~200 LOC):**
- Extract `useSpotManagement` hook
- Extract `useViewState` hook
- Extract `useFilterState` hook

**SpotListView.tsx (321 → ~150 LOC):**
- Extract `<SpotCard>` component (L154-200)
- Reuse shared SpotDetailModal

**MapService.ts (323 → ~200 LOC):**
- Extract `MarkerFactory` class (popup creation, icon generation)

**SpotFilters.tsx (285 → ~120 LOC):**
- Extract `<FilterSection>` reusable component (collapsible section)

**Estimated Time:** 3-4 hours

**Acceptance Criteria:**
- No component/service exceeds 300 LOC
- Logic extracted into hooks/subcomponents
- Tests still pass

---

## P2 — Nice to Have

### [ ] 8. Remove Dead Time Range Filter Code
**Description:** SpotFilters has timeFrom/timeTo inputs that are never used. Dead code that confuses users.

**Files:**
- `src/components/SpotFilters.tsx` L16-18 (state)
- `src/components/SpotFilters.tsx` L261-280 (JSX)

**Root Cause:** Unfinished feature — inputs rendered but not wired to filter logic.

**Fix Strategy:**
**Option A (Quick):** Remove time range inputs entirely
**Option B (Feature completion):** Implement time range filtering in SpotService.filterSpots()

**Estimated Time:** 15 minutes (Option A) or 2 hours (Option B)

**Acceptance Criteria:**
- Time range inputs removed OR
- Time range filtering works correctly

---

### [ ] 9. Implement Photo Compression
**Description:** Photos stored as raw base64 in IndexedDB. Causes storage bloat (4MB photo → 5.3MB base64). Users may hit quota limits.

**Files:**
- `src/services/PhotoService.ts` L194 (TODO comment)

**Root Cause:** Compression not implemented — placeholder code only.

**Fix Strategy:**
1. Implement canvas-based image compression
2. Resize images to max 1920px width
3. Apply JPEG compression (80% quality)
4. Estimated 70-80% size reduction

**Estimated Time:** 2 hours

**Acceptance Criteria:**
- Photos compressed before storing in IndexedDB
- Max 1920px width, 80% quality
- ~5x storage reduction (4MB → 800KB)
- Progressive enhancement (original if compression fails)

---

### [ ] 10. Add View Persistence Validation
**Description:** localStorage view persistence has no validation. Corrupted data crashes app. Privacy mode errors not handled.

**Files:**
- `src/App.tsx` L35-39 (useState initializer)
- `src/App.tsx` L47-49 (useEffect)

**Root Cause:** No validation or error handling for localStorage operations.

**Fix Strategy:**
1. Validate view name against VALID_VIEWS array
2. Wrap localStorage calls in try-catch
3. Log warnings for errors (privacy mode, quota)
4. Fallback to default view on error

**Estimated Time:** 15 minutes

**Acceptance Criteria:**
- Invalid view names rejected (fallback to 'map')
- localStorage errors caught and logged
- App doesn't crash in privacy mode

---

### [ ] 11. Extract Reusable Components
**Description:** Several UI patterns duplicated across components (SpotCard, EmptyState, FilterSection).

**Files:**
- `src/components/SpotListView.tsx` (SpotCard)
- `src/components/Gallery.tsx` (EmptyState, SpotCard variant)
- `src/components/Feed.tsx` (SpotCard variant)
- `src/components/SpotFilters.tsx` (FilterSection pattern)

**Fix Strategy:**
1. Create `<SpotCard>` component with variants (grid, feed, gallery)
2. Create `<EmptyState>` component with props (icon, title, hint)
3. Create `<FilterSection>` collapsible component

**Estimated Time:** 6 hours

**Acceptance Criteria:**
- ~200 LOC code reduction
- Consistent UI patterns across views
- Components tested in Storybook or unit tests

---

### [ ] 12. Add MapService Singleton Pattern
**Description:** MapView creates new MapService instance on every mount. Not actually a bug (useEffect runs once), but pattern could be clearer.

**Files:**
- `src/components/MapView.tsx` L20-54
- `src/services/MapService.ts`

**Fix Strategy:**
1. Add guard clause: `if (mapServiceRef.current) return;`
2. OR convert MapService to singleton pattern
3. Add JSDoc comment explaining pattern

**Estimated Time:** 30 minutes

**Acceptance Criteria:**
- Code intent is clear
- No double-initialization in StrictMode
- Pattern documented

---

### [ ] 13. Add Comprehensive E2E Tests
**Description:** E2E tests exist (Playwright) but coverage is unknown. Need tests for critical user journeys.

**Files:**
- `tests/` directory (existing Playwright tests)

**Missing Coverage:**
1. Full CRUD cycle with photo upload
2. Favorites workflow (add → view in Gallery → remove)
3. Import/export workflow (export → modify → import → merge)
4. Offline mode (service worker caching)
5. Cross-view navigation

**Estimated Time:** 8 hours

**Acceptance Criteria:**
- 5 critical user journeys covered
- Tests run in CI/CD pipeline
- Screenshots/videos on failure

---

## Architecture Improvements (Future)

### [ ] Introduce Context API for State Management
**Description:** Replace props drilling with Context API for global state.

**Estimated Time:** 6-8 hours

**Benefits:**
- Eliminates props drilling
- Easier testing (mock context)
- Better performance (prevent unnecessary re-renders)

---

### [ ] Add Service Worker for Offline Support
**Description:** PWA manifest exists but service worker not fully implemented.

**Estimated Time:** 4-6 hours

**Benefits:**
- Offline map tiles caching
- App shell caching
- Better PWA experience

---

### [ ] Add Analytics & Error Reporting
**Description:** No analytics or error reporting for production issues.

**Estimated Time:** 2-3 hours

**Tools:**
- Sentry for error tracking
- Plausible/PostHog for privacy-friendly analytics

---

## Test Coverage TODO

### [ ] Unit tests for StorageService edge cases
- IndexedDB quota exceeded
- Corrupted spot data
- Concurrent write conflicts

### [ ] Integration tests for favorites flow
- Add spot → Toggle favorite → Check Gallery
- Remove favorite → Check Gallery empty state

### [ ] E2E tests for critical user journeys
- Full CRUD cycle with photos
- Import/export workflow
- Offline mode (service worker)

---

## Summary

**P0 Issues:** 4 items — ~3 hours total
**P1 Issues:** 3 items — ~8-11 hours total
**P2 Issues:** 6 items — ~16-19 hours total

**Total Estimated Effort:** ~27-33 hours

**Recommended Sequence:**
1. **Week 1:** Fix all P0 issues (3 hours) → Production-ready
2. **Week 2:** Tackle P1 refactoring (8-11 hours) → Maintainable codebase
3. **Ongoing:** Address P2 improvements as time permits

**Quick Wins (< 2 hours total):**
- Sidebar spot click handler (30 min)
- Remove duplicate modal (30 min)
- Remove dead time range filter (15 min)
- Add view persistence validation (15 min)

These quick wins eliminate ~110 LOC of duplicate code and fix 2 UX bugs with minimal effort.
