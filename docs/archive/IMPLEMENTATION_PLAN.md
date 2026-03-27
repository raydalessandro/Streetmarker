# StreetMark Mobile + Gallery + Photo Upload - Implementation Plan

**Date**: 2026-03-27
**Scope**: Mobile optimization + Personal gallery + Photo upload + Home feed + Smart import/export merge
**Methodology**: TDD with parallel agent execution (test + code)

---

## Executive Summary

Based on comprehensive architecture analysis, implementing:

1. **Mobile Optimization** - Bottom nav, drawer UI, touch targets, PWA manifest
2. **Photo Upload** - Camera/gallery integration, base64 storage, size limits
3. **Personal Gallery** - Saved spots collection (new `savedSpots` field in user profile)
4. **Home Feed** - Mixed feed showing gallery + registered spots with photos
5. **Smart Import/Export** - Intelligent merge (don't overwrite, resolve conflicts)
6. **Menu & Navigation** - Bottom nav (mobile), hamburger menu (desktop)

**Key Finding**: Spot type already has `photos?: string[]` field! Photo infrastructure ready.

---

## Phase 1: Mobile Optimization Foundation (Day 1, ~4-6 hours)

### 1.1 Bottom Navigation Component (Mobile)

**New Component**: `src/components/BottomNav.tsx`

```typescript
interface BottomNavProps {
  activeView: 'map' | 'feed' | 'gallery';
  onViewChange: (view: 'map' | 'feed' | 'gallery') => void;
  onAddSpot: () => void;
}

// Bottom nav shows:
// [Map Icon] [Feed Icon] [+ Add] [Gallery Icon]
```

**Tests**: `src/components/__tests__/BottomNav.test.tsx`
- Renders 4 buttons
- Active state highlights current view
- Click changes activeView
- + button triggers onAddSpot callback

**CSS**: Mobile-only, sticky bottom, `z-index: 1000`

---

### 1.2 Responsive Layout Updates

**Update**: `src/App.css`

**Changes**:
```css
/* New breakpoints */
@media (max-width: 379px) { /* Small phones */ }
@media (min-width: 380px) and (max-width: 767px) { /* Large phones */ }
@media (max-height: 500px) and (orientation: landscape) { /* Landscape */ }

/* Fix form time-range grid */
@media (max-width: 767px) {
  .time-range {
    display: flex;
    flex-direction: column;
  }
}

/* Touch targets: 44x44px minimum */
@media (hover: none) {
  button, input[type="checkbox"] {
    min-height: 44px;
    min-width: 44px;
  }
}

/* Bottom sheet modal */
@media (max-width: 767px) {
  .modal-content {
    position: fixed;
    bottom: 0;
    max-height: 85vh;
    border-radius: 12px 12px 0 0;
  }
}
```

**Tests**: Visual regression tests (Playwright)
- E2E test on mobile viewport (375x667)
- Form time input stacks vertically
- Modal slides from bottom
- Touch targets meet 44px minimum

---

### 1.3 Filter Drawer (Collapsible on Mobile)

**Update**: `src/components/SpotFilters.tsx`

**New Props**:
```typescript
interface SpotFiltersProps {
  // ... existing
  isOpen?: boolean;           // Drawer state (mobile only)
  onToggle?: () => void;      // Toggle callback
}
```

**Behavior**:
- Desktop: Always visible sidebar
- Mobile: Drawer slides from bottom, triggered by bottom nav or button

**Tests**: `src/components/__tests__/SpotFilters.test.tsx`
- Desktop: always renders
- Mobile: hidden by default, opens on toggle
- Closing drawer preserves filter state

---

### 1.4 PWA Manifest

**New File**: `public/manifest.json`

```json
{
  "name": "StreetMark Milano",
  "short_name": "StreetMark",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1a1a1a",
  "background_color": "#ffffff",
  "orientation": "portrait"
}
```

**Update**: `index.html` - Add `<link rel="manifest" href="/manifest.json">`

**Assets Needed**: Generate 192x192 and 512x512 icons from logo/brand

---

## Phase 2: Photo Upload Infrastructure (Day 1-2, ~6-8 hours)

### 2.1 Photo Utilities Service

**New File**: `src/services/PhotoService.ts`

```typescript
class PhotoService {
  // Convert File to base64 string
  async fileToBase64(file: File): Promise<string>

  // Validate photo (size, type)
  validatePhoto(file: File): { valid: boolean; error?: string }

  // Compress image if > 500KB
  async compressImage(base64: string, maxSizeKB: number): Promise<string>

  // Check IndexedDB storage usage
  async getStorageUsage(): Promise<{ used: number; quota: number }>

  // Constants
  MAX_PHOTO_SIZE = 5 * 1024 * 1024;  // 5MB
  MAX_PHOTOS_PER_SPOT = 10;
  ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
}
```

**Tests**: `src/services/__tests__/PhotoService.test.ts`
- fileToBase64 converts File to data URL
- validatePhoto rejects > 5MB files
- validatePhoto rejects non-image types
- compressImage reduces size (mock canvas API)
- getStorageUsage returns quota info (mock indexedDB)

---

### 2.2 Photo Upload Component

**New Component**: `src/components/PhotoUpload.tsx`

```typescript
interface PhotoUploadProps {
  photos: string[];              // Current photos (base64)
  maxPhotos?: number;            // Default: 10
  onPhotosChange: (photos: string[]) => void;
  disabled?: boolean;
}

// Features:
// - Camera capture (mobile)
// - Gallery selection (desktop)
// - Drag & drop
// - Preview thumbnails
// - Delete photo
// - Reorder photos (drag)
```

**Tests**: `src/components/__tests__/PhotoUpload.test.tsx`
- Renders file input
- Shows thumbnails for existing photos
- Adds photo via file input change
- Removes photo on delete button
- Respects maxPhotos limit
- Shows error for invalid file type
- Shows error for oversized file

---

### 2.3 Update SpotForm with Photo Upload

**Update**: `src/components/SpotForm.tsx`

**Changes**:
```typescript
// Add PhotoUpload component
<PhotoUpload
  photos={formData.photos || []}
  maxPhotos={10}
  onPhotosChange={(photos) => setFormData({ ...formData, photos })}
  disabled={isSubmitting}
/>

// Update submit handler to include photos
const handleSubmit = async () => {
  const spot: Spot = {
    ...formData,
    photos: formData.photos || [],  // Include photos
  };
  await onSubmit(spot);
};
```

**Tests**: `src/components/__tests__/SpotForm.test.tsx`
- PhotoUpload component renders
- Adding photo updates form state
- Form submission includes photos array
- Photos persist on edit mode

---

### 2.4 Update SpotList with Photo Previews

**Update**: `src/components/SpotList.tsx`

**Changes**:
```tsx
// Show first photo as thumbnail in spot card
{spot.photos && spot.photos.length > 0 && (
  <img
    src={spot.photos[0]}
    alt={spot.notes}
    className="spot-thumbnail"
  />
)}
```

**CSS**: `.spot-thumbnail` - 80x80px, rounded, object-fit: cover

**Tests**: `src/components/__tests__/SpotList.test.tsx`
- Spot with photo shows thumbnail
- Spot without photo shows no thumbnail
- Clicking thumbnail opens spot detail (future)

---

## Phase 3: Personal Gallery System (Day 2, ~4-6 hours)

### 3.1 User Profile Storage

**New File**: `src/types/user.ts`

```typescript
interface UserProfile {
  id: string;                    // UUID
  deviceId: string;              // Persistent device ID
  savedSpots: string[];          // Array of spot IDs (saved/favorited)
  createdAt: number;
  updatedAt: number;
}
```

**Update**: `src/services/StorageService.ts`

**New Methods**:
```typescript
// User profile CRUD
async getUserProfile(): Promise<UserProfile>
async updateUserProfile(profile: UserProfile): Promise<void>
async addSavedSpot(spotId: string): Promise<void>
async removeSavedSpot(spotId: string): Promise<void>
async getSavedSpots(): Promise<Spot[]>  // Returns full Spot objects
```

**IndexedDB Schema Update**:
```typescript
// Add new object store: 'userProfile' (single record)
db.createObjectStore('userProfile', { keyPath: 'id' });
```

**Tests**: `src/services/__tests__/StorageService.test.ts`
- getUserProfile creates default profile if not exists
- updateUserProfile persists changes
- addSavedSpot appends to savedSpots array
- removeSavedSpot filters out spot ID
- getSavedSpots returns full Spot[] from IDs

---

### 3.2 Gallery View Component

**New Component**: `src/components/GalleryView.tsx`

```typescript
interface GalleryViewProps {
  savedSpots: Spot[];
  onUnsave: (spotId: string) => void;
  onViewSpot: (spot: Spot) => void;
}

// Grid layout (2 cols mobile, 3 cols tablet, 4 cols desktop)
// Each card shows:
// - First photo (large)
// - Spot type badge
// - Notes preview
// - Unsave button (heart icon)
```

**Tests**: `src/components/__tests__/GalleryView.test.tsx`
- Renders grid of saved spots
- Shows photo thumbnail for each spot
- Clicking card triggers onViewSpot
- Clicking unsave button triggers onUnsave
- Empty state shows "No saved spots yet"

---

### 3.3 Save/Unsave Button in SpotList

**Update**: `src/components/SpotList.tsx`

**New Prop**:
```typescript
interface SpotListProps {
  // ... existing
  savedSpotIds: string[];        // IDs of saved spots
  onToggleSave: (spotId: string) => void;
}

// Add heart icon button to each spot card
<button
  onClick={() => onToggleSave(spot.id)}
  className={savedSpotIds.includes(spot.id) ? 'saved' : ''}
>
  {savedSpotIds.includes(spot.id) ? '❤️' : '🤍'}
</button>
```

**Tests**: `src/components/__tests__/SpotList.test.tsx`
- Heart icon shows filled for saved spots
- Heart icon shows outline for unsaved spots
- Clicking heart triggers onToggleSave
- Saved state updates visually

---

## Phase 4: Home Feed (Day 2-3, ~6-8 hours)

### 4.1 Feed View Component

**New Component**: `src/components/FeedView.tsx`

```typescript
interface FeedViewProps {
  spots: Spot[];                 // All spots (user's + saved)
  currentUserDeviceId: string;   // To identify "my spots"
  onViewSpot: (spot: Spot) => void;
  onToggleSave: (spotId: string) => void;
}

// Feed shows:
// - Mixed timeline of all spots with photos
// - Sorted by createdAt (newest first)
// - Card shows:
//   - Photo carousel (if multiple photos)
//   - Spot type, status, security badges
//   - Notes
//   - "My spot" badge if created by user
//   - Save button
//   - View on map button
```

**Tests**: `src/components/__tests__/FeedView.test.tsx`
- Renders spots sorted by createdAt desc
- Shows "My spot" badge for user's spots
- Photo carousel works (prev/next buttons)
- Save button toggles saved state
- View on map button triggers callback
- Empty state shows "No spots yet"

---

### 4.2 Photo Carousel Component

**New Component**: `src/components/PhotoCarousel.tsx`

```typescript
interface PhotoCarouselProps {
  photos: string[];              // base64 images
  alt: string;
  className?: string;
}

// Swipeable carousel for mobile
// Prev/next buttons for desktop
// Dots indicator for multiple photos
```

**Tests**: `src/components/__tests__/PhotoCarousel.test.tsx`
- Renders first photo by default
- Next button shows second photo
- Prev button shows first photo again
- Dots indicator shows correct active dot
- Swipe gesture changes photo (mobile)

---

### 4.3 App State Management Update

**Update**: `src/App.tsx`

**New State**:
```typescript
const [activeView, setActiveView] = useState<'map' | 'feed' | 'gallery'>('map');
const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
const [savedSpots, setSavedSpots] = useState<Spot[]>([]);

// Load user profile on mount
useEffect(() => {
  const loadProfile = async () => {
    const profile = await storageService.getUserProfile();
    setUserProfile(profile);
    const saved = await storageService.getSavedSpots();
    setSavedSpots(saved);
  };
  loadProfile();
}, [storageService]);

// Handle save/unsave
const handleToggleSave = async (spotId: string) => {
  if (userProfile.savedSpots.includes(spotId)) {
    await storageService.removeSavedSpot(spotId);
  } else {
    await storageService.addSavedSpot(spotId);
  }
  // Refresh saved spots
  const saved = await storageService.getSavedSpots();
  setSavedSpots(saved);
};
```

**Conditional Rendering**:
```tsx
{activeView === 'map' && <MapView ... />}
{activeView === 'feed' && <FeedView spots={spots} onToggleSave={handleToggleSave} ... />}
{activeView === 'gallery' && <GalleryView savedSpots={savedSpots} ... />}

<BottomNav activeView={activeView} onViewChange={setActiveView} ... />
```

**Tests**: `src/test/integration/AppIntegration.test.tsx`
- Switching views updates UI
- Saving spot adds to savedSpots array
- Unsaving spot removes from savedSpots
- Gallery view shows only saved spots
- Feed view shows all spots

---

## Phase 5: Smart Import/Export Merge (Day 3, ~4-6 hours)

### 5.1 Enhanced Merge Strategy

**Update**: `src/services/ImportService.ts`

**Current**: Timestamp-based merge (newer wins)

**Enhancement**: Add merge options

```typescript
interface MergeOptions {
  strategy: 'timestamp' | 'manual' | 'keep-both';
  onConflict?: (local: Spot, imported: Spot) => Spot;  // Custom resolver
}

interface MergeResult {
  added: Spot[];
  updated: Spot[];
  conflicts: Spot[];
  skipped: Spot[];           // NEW: Explicitly skipped (older timestamp)
}

// New method
mergeSpots(
  existing: Spot[],
  imported: Spot[],
  options: MergeOptions = { strategy: 'timestamp' }
): MergeResult
```

**Strategies**:
1. **timestamp** (default): Newer updatedAt wins
2. **manual**: Return conflicts for user resolution
3. **keep-both**: Rename imported spot ID, keep both versions

**Tests**: `src/services/__tests__/ImportService.test.ts`
- timestamp strategy: newer spot updates existing
- timestamp strategy: older spot goes to skipped
- manual strategy: conflicts returned for user decision
- keep-both strategy: imported spot gets new ID, both preserved
- Photos merge correctly (append, dedupe by hash)

---

### 5.2 Import Preview UI

**Update**: `src/components/ImportExport.tsx`

**Enhancement**: Show detailed merge preview

```tsx
<ImportPreview mergeResult={previewResult}>
  <section>
    <h3>Will be added ({mergeResult.added.length})</h3>
    <ul>{mergeResult.added.map(spot => <SpotCard spot={spot} />)}</ul>
  </section>

  <section>
    <h3>Will be updated ({mergeResult.updated.length})</h3>
    <ul>{mergeResult.updated.map(spot => <SpotCard spot={spot} showDiff />)}</ul>
  </section>

  <section>
    <h3>Conflicts (require resolution) ({mergeResult.conflicts.length})</h3>
    <ul>{mergeResult.conflicts.map(conflict =>
      <ConflictResolver local={local} imported={imported} onResolve={...} />
    )}</ul>
  </section>

  <section>
    <h3>Skipped (older version) ({mergeResult.skipped.length})</h3>
    <ul>{mergeResult.skipped.map(spot => <SpotCard spot={spot} />)}</ul>
  </section>

  <button onClick={handleConfirmImport}>Confirm Import</button>
</ImportPreview>
```

**Tests**: `src/components/__tests__/ImportExport.test.tsx`
- Preview shows 4 sections (added, updated, conflicts, skipped)
- Each section shows correct count
- Conflict resolver allows manual selection
- Confirm button applies merge
- Cancel button aborts import

---

### 5.3 Conflict Resolution Component

**New Component**: `src/components/ConflictResolver.tsx`

```typescript
interface ConflictResolverProps {
  local: Spot;
  imported: Spot;
  onResolve: (resolution: 'keep-local' | 'use-imported' | 'keep-both') => void;
}

// Side-by-side diff view
// Shows: coords, type, status, photos, notes, timestamps
// User picks: Keep Local | Use Imported | Keep Both
```

**Tests**: `src/components/__tests__/ConflictResolver.test.tsx`
- Renders both spot versions side-by-side
- Highlights differences (different coords, notes, etc.)
- Clicking "Keep Local" calls onResolve('keep-local')
- Clicking "Use Imported" calls onResolve('use-imported')
- Clicking "Keep Both" calls onResolve('keep-both')

---

### 5.4 Export with User Profile

**Update**: `src/services/ExportService.ts`

**Enhancement**: Include user profile in export

```typescript
interface ExportData {
  version: "1.1.0";              // Bump version
  exportedAt: number;
  spots: Spot[];
  userProfile?: UserProfile;     // NEW: Include saved spots, preferences
  metadata: {
    appVersion: string;
    deviceId: string;
  };
}

// Export now includes:
// - All spots (user's created spots)
// - User profile (savedSpots array)
// - Device ID for merge deduplication
```

**Tests**: `src/services/__tests__/ExportService.test.ts`
- exportToJSON includes userProfile
- exportToJSON includes savedSpots array
- Import recognizes v1.1.0 format
- Backward compatible with v1.0.0 (no userProfile)

---

## Phase 6: Menu & Navigation Polish (Day 3-4, ~4 hours)

### 6.1 Hamburger Menu (Desktop Header)

**New Component**: `src/components/HamburgerMenu.tsx`

```typescript
interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onExport: () => void;
  onImport: () => void;
  onSettings: () => void;  // Future: settings modal
}

// Desktop: Hamburger icon in header
// Dropdown menu:
// - Export Data
// - Import Data
// - Settings (future)
// - About
```

**Tests**: `src/components/__tests__/HamburgerMenu.test.tsx`
- Hamburger icon renders
- Clicking icon opens menu
- Menu shows 4 options
- Clicking Export triggers onExport
- Clicking outside closes menu

---

### 6.2 Settings Modal (Future-Ready Stub)

**New Component**: `src/components/SettingsModal.tsx`

```typescript
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

// Settings:
// - Device name (for multi-device sync future)
// - Default spot type
// - Default security level
// - Clear all data (with confirmation)
```

**Tests**: `src/components/__tests__/SettingsModal.test.tsx`
- Renders when isOpen=true
- Shows user profile fields
- Save button triggers onSave
- Clear data shows confirmation dialog

---

## Phase 7: E2E Testing (Day 4, ~4-6 hours)

### 7.1 New E2E Scenarios

**File**: `tests/e2e/photoUpload.spec.ts`

```typescript
test('E2E-7: Photo upload flow', async ({ page }) => {
  // 1. Add spot with photo
  // 2. Upload photo (mock file input)
  // 3. See photo preview
  // 4. Submit form
  // 5. See spot in list with photo thumbnail
  // 6. Open spot detail
  // 7. See photo in carousel
});

test('E2E-8: Gallery flow', async ({ page }) => {
  // 1. Create spot
  // 2. Save spot (heart icon)
  // 3. Navigate to Gallery view
  // 4. See saved spot in gallery
  // 5. Unsave spot
  // 6. Gallery empty state
});

test('E2E-9: Feed flow', async ({ page }) => {
  // 1. Navigate to Feed view
  // 2. See all spots with photos
  // 3. Scroll feed
  // 4. Click "View on Map"
  // 5. Map view opens with spot selected
});

test('E2E-10: Smart merge flow', async ({ page }) => {
  // 1. Create 2 spots
  // 2. Export data
  // 3. Modify 1 spot locally
  // 4. Import exported data
  // 5. See merge preview (1 updated, 1 skipped)
  // 6. Confirm import
  // 7. Verify updated spot kept newer version
});
```

**File**: `tests/e2e/mobile.spec.ts`

```typescript
test('E2E-11: Mobile navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  // 1. See bottom nav
  // 2. Tap Map button
  // 3. See map view
  // 4. Tap Feed button
  // 5. See feed view
  // 6. Tap Gallery button
  // 7. See gallery view
});

test('E2E-12: Mobile form bottom sheet', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });

  // 1. Tap + button
  // 2. Form slides from bottom
  // 3. Fill form
  // 4. Swipe down to cancel (gesture)
  // 5. Form closes
});
```

---

## Implementation Order & Parallel Execution

### Day 1 (Mobile Foundation + Photo Infrastructure)

**Morning (4 hours)** - Mobile UI:
- Agent 1 (Test): Write tests for BottomNav, responsive CSS
- Agent 2 (Code): Implement BottomNav component, update App.css

**Afternoon (4 hours)** - Photo Upload:
- Agent 1 (Test): Write tests for PhotoService, PhotoUpload
- Agent 2 (Code): Implement PhotoService, PhotoUpload component

**Evening (2 hours)** - Integration:
- Update SpotForm with PhotoUpload
- Update SpotList with thumbnails
- Run E2E tests

---

### Day 2 (Gallery System + Feed)

**Morning (4 hours)** - Gallery:
- Agent 1 (Test): Write tests for UserProfile storage, GalleryView
- Agent 2 (Code): Implement UserProfile methods, GalleryView component

**Afternoon (4 hours)** - Feed:
- Agent 1 (Test): Write tests for FeedView, PhotoCarousel
- Agent 2 (Code): Implement FeedView, PhotoCarousel component

**Evening (2 hours)** - Integration:
- Update App.tsx with view switching
- Wire save/unsave logic
- Test mobile navigation

---

### Day 3 (Smart Merge + Menu)

**Morning (4 hours)** - Smart Merge:
- Agent 1 (Test): Write tests for enhanced ImportService, ConflictResolver
- Agent 2 (Code): Implement merge strategies, ConflictResolver UI

**Afternoon (3 hours)** - Menu & Settings:
- Agent 1 (Test): Write tests for HamburgerMenu, SettingsModal
- Agent 2 (Code): Implement HamburgerMenu, SettingsModal stub

**Evening (3 hours)** - E2E:
- Write E2E tests for new flows (photo, gallery, feed, merge)
- Run full test suite
- Fix any failures

---

### Day 4 (Polish + Deployment)

**Morning (3 hours)** - PWA:
- Create manifest.json
- Generate PWA icons
- Test install prompt

**Afternoon (3 hours)** - Final Testing:
- Run all E2E tests on mobile viewport
- Test import/export merge scenarios
- Performance check (bundle size, IndexedDB usage)

**Evening (2 hours)** - Deploy:
- Commit all changes
- Push to GitHub
- Vercel auto-deploy
- Test production build

---

## Test Coverage Goals

| Layer | Current | Target | New Tests |
|-------|---------|--------|-----------|
| Unit | 60% | 75% | +15 test files |
| Component | 70% | 85% | +8 components |
| Integration | 80% | 90% | +6 scenarios |
| E2E | 85% | 95% | +6 E2E specs |

**Total Estimated Tests**: 221 → 320+ tests

---

## Dependencies & Tools

**New Dependencies**:
```json
{
  "dependencies": {
    // Already installed:
    // - react, react-dom, leaflet, idb

    // No new runtime dependencies needed!
    // Photo handling uses native File API + Canvas API
  },
  "devDependencies": {
    // Already installed:
    // - vitest, @testing-library/react, playwright

    // Optional (for PWA):
    "vite-plugin-pwa": "^0.17.0"  // PWA manifest generation
  }
}
```

---

## Risk Mitigation

### Risk 1: IndexedDB Storage Quota (50MB limit)
**Mitigation**:
- Compress images > 500KB
- Warn user at 40MB usage
- Implement photo cleanup (delete old photos)

### Risk 2: Base64 Photo Performance
**Mitigation**:
- Lazy load photos in feed (intersection observer)
- Thumbnail generation (lower resolution for list view)
- Virtual scrolling for long feeds

### Risk 3: Import/Export Conflicts
**Mitigation**:
- Manual resolution UI (ConflictResolver)
- Preview before applying merge
- Undo/rollback capability (export before import)

### Risk 4: Mobile Gestures (Swipe, Pinch)
**Mitigation**:
- Use touch event API (touchstart, touchmove, touchend)
- Prevent default scroll during swipe
- Test on real devices (not just emulator)

---

## Success Criteria

✅ **Mobile Optimized**:
- Bottom nav works on mobile
- Touch targets meet 44x44px minimum
- Forms use bottom sheet modal
- PWA installable on mobile

✅ **Photo Upload**:
- Camera/gallery selection works
- Photos stored as base64 in IndexedDB
- Thumbnails display in list view
- Carousel works in feed view

✅ **Gallery System**:
- Save/unsave spots works
- Gallery view shows saved spots only
- Gallery persists across sessions

✅ **Feed View**:
- Mixed feed shows all spots
- Photos display in carousel
- "My spot" badge shows correctly
- Save button works in feed

✅ **Smart Merge**:
- Import shows preview (added/updated/conflicts/skipped)
- Timestamp strategy works (newer wins)
- Manual resolution works for conflicts
- Export includes user profile

✅ **Test Coverage**:
- All new components have unit tests
- Integration tests cover full flows
- E2E tests validate user journeys
- >90% coverage maintained

---

## Files to Create (New)

1. `src/components/BottomNav.tsx` + test
2. `src/components/PhotoUpload.tsx` + test
3. `src/components/PhotoCarousel.tsx` + test
4. `src/components/GalleryView.tsx` + test
5. `src/components/FeedView.tsx` + test
6. `src/components/ConflictResolver.tsx` + test
7. `src/components/HamburgerMenu.tsx` + test
8. `src/components/SettingsModal.tsx` + test
9. `src/services/PhotoService.ts` + test
10. `src/types/user.ts`
11. `public/manifest.json`
12. `public/icon-192.png`, `public/icon-512.png`
13. `tests/e2e/photoUpload.spec.ts`
14. `tests/e2e/gallery.spec.ts`
15. `tests/e2e/mobile.spec.ts`

---

## Files to Update (Existing)

1. `src/App.tsx` - View switching, user profile state
2. `src/App.css` - Mobile responsive updates
3. `src/components/SpotForm.tsx` - Add PhotoUpload
4. `src/components/SpotList.tsx` - Add thumbnails, save button
5. `src/components/SpotFilters.tsx` - Drawer behavior
6. `src/components/ImportExport.tsx` - Merge preview UI
7. `src/services/StorageService.ts` - UserProfile methods
8. `src/services/ImportService.ts` - Enhanced merge
9. `src/services/ExportService.ts` - Include userProfile
10. `index.html` - Add manifest.json link
11. `vite.config.ts` - PWA plugin config (optional)

---

## Estimated Effort

| Phase | Effort | Parallel Agents | Deliverable |
|-------|--------|-----------------|-------------|
| 1 | 6h | 2 (test + code) | Mobile UI foundation |
| 2 | 8h | 2 (test + code) | Photo upload working |
| 3 | 6h | 2 (test + code) | Gallery system live |
| 4 | 8h | 2 (test + code) | Feed view functional |
| 5 | 6h | 2 (test + code) | Smart merge implemented |
| 6 | 4h | 2 (test + code) | Menu & settings polished |
| 7 | 6h | 1 (E2E) | All E2E tests passing |
| **Total** | **38-44 hours** | **3-4 days** | **MVP deployed** |

---

## Next Steps

1. **User approval** on plan
2. **Start Phase 1** (Mobile foundation)
3. **Parallel agent execution** (test + code agents)
4. **Incremental commits** (each phase = 1 commit)
5. **Continuous E2E testing** (smoke tests after each phase)

---

## Questions for Ray

1. **Photo Storage**: Confermi base64 in IndexedDB? Alternative: Blob storage + URL references
2. **Gallery Privacy**: Saved spots sono privati o condivisibili (future)?
3. **Feed Sorting**: Preferisci createdAt desc o possiamo fare "relevance" (nearby + recent)?
4. **PWA Icons**: Hai già logo/brand assets o generiamo placeholder?
5. **Merge Conflicts**: Default strategy "timestamp" (newer wins) va bene? O preferisci sempre manual?

---

**Ready to proceed?** 🚀
