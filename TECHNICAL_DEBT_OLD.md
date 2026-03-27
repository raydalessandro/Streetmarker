# Technical Debt Backlog

**Project:** StreetMark PWA
**Last Updated:** 2026-03-27
**Prioritization:** P0 (critical) → P1 (high) → P2 (medium)

---

## Immediate (< 2h) — Production Blockers

### P0 Issues

- [ ] **Fix: Favorite persistence bug** — P0
  - **File:** `src/types/spot.ts`, `src/services/SpotService.ts`, `src/components/Gallery.tsx`
  - **Action:** Make `isFavorite: boolean` required (not optional), initialize to `false` in `createSpot()`
  - **Impact:** Fixes Gallery filtering breaking after spot updates
  - **Test:** Add unit test for Gallery favorite filter with undefined/false/true cases
  - **Effort:** 30 min

- [ ] **Add: Error Boundary for MapView** — P0
  - **File:** `src/components/ErrorBoundary.tsx` (new), `src/App.tsx`
  - **Action:** Create ErrorBoundary component, wrap MapView with fallback UI
  - **Impact:** Prevents app crash when Leaflet map fails to initialize
  - **Test:** Simulate map init failure, verify fallback UI shows
  - **Effort:** 45 min

- [ ] **Add: Error Boundary for Gallery/Feed/SpotListView** — P0
  - **File:** `src/App.tsx`
  - **Action:** Wrap each major view in ErrorBoundary
  - **Impact:** Prevents white screen of death from component errors
  - **Test:** Throw error in Gallery, verify fallback UI
  - **Effort:** 30 min

- [ ] **Add: Top-level Error Boundary** — P0
  - **File:** `src/main.tsx`
  - **Action:** Wrap `<App />` in ErrorBoundary with generic fallback
  - **Impact:** Catches all unhandled errors, prevents total app crash
  - **Test:** Throw error in App, verify top-level fallback
  - **Effort:** 15 min

---

## Short-term (< 1 day) — Critical UX Fixes

### P1 Issues

- [ ] **Refactor: Fix service instantiation in SpotForm** — P1
  - **File:** `src/components/SpotForm.tsx:30`
  - **Action:** Replace `const spotService = new SpotService()` with `useMemo(() => new SpotService(), [])`
  - **Impact:** Prevents unnecessary re-instantiation on every render
  - **Test:** Add console.log in SpotService constructor, verify only called once
  - **Effort:** 10 min

- [ ] **Refactor: Fix service instantiation in PhotoUpload** — P1
  - **File:** `src/components/PhotoUpload.tsx:15`
  - **Action:** Replace `const photoService = new PhotoService()` with `useMemo(() => new PhotoService(), [])`
  - **Impact:** Prevents memory churn during photo uploads
  - **Test:** Same as above
  - **Effort:** 10 min

- [ ] **Refactor: Fix service instantiation in ImportExport** — P1
  - **File:** `src/components/ImportExport.tsx:23-24`
  - **Action:** Memoize both ExportService and ImportService instances
  - **Impact:** Prevents re-instantiation on every render
  - **Effort:** 10 min

- [ ] **Extract: Create spotHelpers.ts utility module** — P1
  - **File:** `src/utils/spotHelpers.ts` (new)
  - **Action:** Extract `getSpotName`, `getStatusColor`, `getSecurityIcon` from 4 components
  - **Impact:** Eliminates 150 lines of duplication, ensures consistent behavior
  - **Test:** Unit tests for each helper function
  - **Effort:** 1 hour

- [ ] **Update: Replace duplicated helpers in SpotListView** — P1
  - **File:** `src/components/SpotListView.tsx`
  - **Action:** Import helpers from `spotHelpers.ts`, remove local implementations
  - **Effort:** 15 min

- [ ] **Update: Replace duplicated helpers in SpotDetailModal** — P1
  - **File:** `src/components/SpotDetailModal.tsx`
  - **Action:** Same as above
  - **Effort:** 15 min

- [ ] **Update: Replace duplicated helpers in Gallery** — P1
  - **File:** `src/components/Gallery.tsx`
  - **Action:** Same as above
  - **Effort:** 15 min

- [ ] **Update: Replace duplicated helpers in Feed** — P1
  - **File:** `src/components/Feed.tsx`
  - **Action:** Same as above
  - **Effort:** 15 min

- [ ] **Refactor: Implement surgical state updates (replace refreshSpots)** — P1
  - **File:** `src/App.tsx:52-55, 210-229`
  - **Action:** Replace `refreshSpots()` with targeted state updates after CRUD operations
  - **Impact:** Eliminates unnecessary re-renders, improves performance with 100+ spots
  - **Example:**
    ```typescript
    // Replace this:
    await storageService.updateSpot(updatedSpot);
    await refreshSpots(); // ❌ Fetches all spots, re-renders all components

    // With this:
    await storageService.updateSpot(updatedSpot);
    setSpots(prev => prev.map(s => s.id === updatedSpot.id ? updatedSpot : s)); // ✅ Surgical update
    ```
  - **Test:** Performance test with 100 spots, measure re-render count
  - **Effort:** 2 hours

- [ ] **Test: Add SpotListView component tests** — P1
  - **File:** `src/components/__tests__/SpotListView.test.tsx` (new)
  - **Action:** Test modal interactions, card clicks, favorite toggle, sorting
  - **Coverage:** 80%+ line coverage
  - **Effort:** 3 hours

- [ ] **Test: Add SpotDetailModal component tests** — P1
  - **File:** `src/components/__tests__/SpotDetailModal.test.tsx` (new)
  - **Action:** Test favorite toggle, edit button, navigation buttons
  - **Effort:** 2 hours

- [ ] **Test: Add Gallery component tests (reproduces P0-1 bug)** — P1
  - **File:** `src/components/__tests__/Gallery.test.tsx` (new)
  - **Action:** Test favorite filtering with undefined/false/true cases, photo modal
  - **Critical:** Must include regression test for P0-1 favorite persistence bug
  - **Effort:** 2 hours

- [ ] **Test: Add Feed component tests** — P1
  - **File:** `src/components/__tests__/Feed.test.tsx` (new)
  - **Action:** Test sorting, time formatting, empty state
  - **Effort:** 1.5 hours

- [ ] **Test: Add critical path integration test (toggle favorite)** — P1
  - **File:** `src/test/integration/FavoritePath.test.tsx` (new)
  - **Action:** Test: Toggle favorite → Update IndexedDB → Gallery filtering
  - **Impact:** Catches P0-1 style bugs end-to-end
  - **Effort:** 2 hours

---

## Long-term (> 1 day) — Maintainability & Scale

### P2 Issues

- [ ] **Architecture: Enable TypeScript strict mode** — P2
  - **File:** `tsconfig.json`
  - **Action:** Set `"strict": true`, fix ~20-30 type errors
  - **Impact:** Catches null/undefined bugs at compile time (prevents P0-1 style bugs)
  - **Effort:** 4 hours

- [ ] **Architecture: Implement Context-based state management** — P2
  - **File:** `src/contexts/SpotsContext.tsx` (new), `src/App.tsx`
  - **Action:** Create SpotsProvider with spots state, CRUD operations, replace props drilling
  - **Impact:** Simplifies App.tsx (15 useState → 5 useState), eliminates props drilling
  - **Test:** Refactor Gallery to use context, verify behavior unchanged
  - **Effort:** 1 day

- [ ] **Architecture: Extract modal state to custom hook** — P2
  - **File:** `src/hooks/useModal.ts` (new)
  - **Action:** Extract `isFormOpen`, `isDetailModalOpen`, `selectedSpot` to `useModal` hook
  - **Impact:** Reduces App.tsx state complexity
  - **Effort:** 2 hours

- [ ] **Architecture: Extract filter/search state to custom hook** — P2
  - **File:** `src/hooks/useSpotFilters.ts` (new)
  - **Action:** Extract `filters`, `searchQuery`, `filteredSpots` logic
  - **Impact:** Reusable filtering logic across views
  - **Effort:** 2 hours

- [ ] **Refactor: Convert SpotService to pure functions** — P2
  - **File:** `src/utils/spotUtils.ts` (new), remove `src/services/SpotService.ts`
  - **Action:** Convert class methods to exported functions
  - **Impact:** Simpler code, tree-shaking friendly, no instantiation overhead
  - **Effort:** 1 hour

- [ ] **Refactor: Convert PhotoService to pure functions** — P2
  - **File:** `src/utils/photoUtils.ts` (new), remove `src/services/PhotoService.ts`
  - **Action:** Same as above, keep MAX_MEDIA_PER_SPOT as constant
  - **Effort:** 1 hour

- [ ] **Refactor: Convert ExportService to pure functions** — P2
  - **File:** `src/utils/exportUtils.ts` (new), remove `src/services/ExportService.ts`
  - **Effort:** 30 min

- [ ] **Refactor: Convert ImportService to pure functions** — P2
  - **File:** `src/utils/importUtils.ts` (new), remove `src/services/ImportService.ts`
  - **Effort:** 30 min

- [ ] **Optimization: Migrate photos from base64 to Blob storage** — P2
  - **File:** `src/types/spot.ts`, `src/services/PhotoService.ts`, `src/services/StorageService.ts`
  - **Action:** Change `photos?: string[]` to `photos?: Blob[]`, update PhotoService to return Blobs
  - **Impact:** Reduces IndexedDB usage by 33%, increases quota headroom from ~50 to ~150 spots with photos
  - **Breaking Change:** Requires data migration script for existing users
  - **Effort:** 1 day

- [ ] **Feature: Add loading states to async operations** — P2
  - **File:** `src/hooks/useAsyncOperation.ts` (new), `src/App.tsx`
  - **Action:** Create `useAsyncOperation` hook, add loading indicators to CRUD operations
  - **Impact:** Better UX during slow operations (refreshSpots with 100+ spots)
  - **Effort:** 3 hours

- [ ] **Feature: Extend state persistence to filters and search** — P2
  - **File:** `src/App.tsx`
  - **Action:** Persist `filters`, `searchQuery` to localStorage, restore on mount
  - **Impact:** User returns to app with previous filter/search state intact
  - **Effort:** 1 hour

- [ ] **Feature: Persist sidebar state** — P2
  - **File:** `src/App.tsx`
  - **Action:** Persist `isSidebarOpen` to localStorage
  - **Impact:** Sidebar state survives page refresh
  - **Effort:** 30 min

- [ ] **Fix: Sidebar overlay click-through bug** — P2
  - **File:** `src/App.tsx`, `src/App.css`
  - **Action:** Make overlay click-through to map OR close sidebar and propagate click
  - **Impact:** Users can interact with map when sidebar is open
  - **Effort:** 1 hour

- [ ] **Fix: Add input validation for SpotForm initialCoords prop** — P2
  - **File:** `src/components/SpotForm.tsx:15-19`
  - **Action:** Validate `initialCoords` prop, fallback to Milano center if invalid
  - **Impact:** Prevents silent form failures from bad coords
  - **Effort:** 30 min

- [ ] **Cleanup: Remove console.log pollution** — P2
  - **File:** `src/App.tsx`, others
  - **Action:** Remove development console.log statements, use proper logging library
  - **Impact:** Cleaner production bundle, no info leaks
  - **Effort:** 30 min

- [ ] **Test: Add BottomNav component tests** — P2
  - **File:** `src/components/__tests__/BottomNav.test.tsx` (new)
  - **Action:** Test view switching, active state styling
  - **Effort:** 1 hour

- [ ] **Test: Add SettingsView component tests** — P2
  - **File:** `src/components/__tests__/SettingsView.test.tsx` (new)
  - **Action:** Test import/export integration, settings UI
  - **Effort:** 2 hours

- [ ] **Security: Add CSP (Content Security Policy) header** — P2
  - **File:** `index.html`, `vite.config.ts`
  - **Action:** Add CSP meta tag restricting script sources
  - **Impact:** Mitigates XSS attacks
  - **Effort:** 1 hour

- [ ] **Security: Validate photo MIME types to prevent XSS** — P2
  - **File:** `src/services/PhotoService.ts`
  - **Action:** Validate MIME type, reject SVG with `<script>` tags
  - **Impact:** Prevents malicious photo uploads
  - **Effort:** 1 hour

---

## Backlog Summary

**Immediate (< 2h):**
- 4 tasks (all P0 — error boundaries, favorite persistence)

**Short-term (< 1 day):**
- 16 tasks (all P1 — service instantiation, helpers extraction, state refactor, tests)

**Long-term (> 1 day):**
- 24 tasks (all P2 — architecture improvements, optimizations, security)

**Total Debt:** 44 tasks
**Estimated Total Effort:** ~6-8 weeks (1 developer, including testing)

---

## Priority Recommendations

### Sprint 1 (Week 1): Stabilization
**Goal:** Fix production blockers, achieve deployable state
- All P0 tasks (4 tasks, 2h)
- P1 service instantiation fixes (3 tasks, 30min)
- P1 helper extraction (5 tasks, 2.5h)
- **Total:** 5 hours

### Sprint 2 (Week 2): Performance & UX
**Goal:** Address critical UX issues, improve performance
- P1 surgical state updates (1 task, 2h)
- P1 test coverage for SpotListView, Gallery, Feed (3 tasks, 8.5h)
- P1 critical path integration test (1 task, 2h)
- **Total:** 12.5 hours

### Sprint 3 (Week 3): Architecture Refactor
**Goal:** Reduce state complexity, improve maintainability
- P2 TypeScript strict mode (1 task, 4h)
- P2 Context-based state management (1 task, 8h)
- P2 Custom hooks (2 tasks, 4h)
- P2 Service to function refactor (4 tasks, 4h)
- **Total:** 20 hours

### Sprint 4+ (Week 4+): Optimization & Polish
**Goal:** Long-term improvements, security hardening
- P2 Blob storage migration (1 task, 8h)
- P2 Loading states (1 task, 3h)
- P2 State persistence extensions (3 tasks, 2.5h)
- P2 Security improvements (2 tasks, 2h)
- P2 Remaining tests (2 tasks, 3h)
- **Total:** 18.5 hours

---

## Metrics to Track

**Code Quality:**
- Lines of duplicated code: **150 → 0** (after helper extraction)
- Service instantiation anti-patterns: **3 → 0** (after useMemo fixes)
- useState count in App.tsx: **15 → 5** (after context refactor)

**Test Coverage:**
- Component test coverage: **58% (7/12) → 100% (12/12)**
- Critical path coverage: **0% (0/4) → 100% (4/4)**
- Overall line coverage: **~70% → 85%**

**Performance:**
- refreshSpots() call time: **~300ms → <50ms** (surgical updates)
- Service re-instantiations per user action: **15 → 1** (useMemo fixes)
- Photo upload time: **~500ms → ~200ms** (Web Worker encoding)

**User Experience:**
- Favorite persistence bug: **BROKEN → FIXED** (P0-1)
- App crash risk: **HIGH → LOW** (error boundaries)
- Loading feedback: **NONE → PRESENT** (loading states)

---

## Risk Assessment

**High Risk (Do First):**
- P0-1 (Favorite persistence) — Breaks core feature, user data loss
- P0-2 (Error boundaries) — App crashes in production

**Medium Risk (Do Soon):**
- P1-4 (State refresh pattern) — Performance degrades with scale
- P1-5 (Test coverage) — No safety net for refactoring

**Low Risk (Can Defer):**
- P2-6 (Blob storage) — Only matters at scale (50+ spots with photos)
- P2-3 (TypeScript strict) — Nice-to-have, not urgent

---

## Notes

- **Breaking Changes:** P2 Blob storage migration requires data migration script for existing users
- **Dependencies:** Context refactor (P2) should happen before state persistence extensions (P2)
- **Testing Strategy:** Write tests BEFORE refactoring (regression safety net)
- **Performance:** Measure before/after for surgical state updates (P1-4)

---

**Next Action:** Start with Sprint 1 (Stabilization) — Fix all P0 issues before proceeding to P1/P2 work.
