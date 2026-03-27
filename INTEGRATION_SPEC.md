# StreetMark — Integration Specification

**Integrazione finale moduli + E2E testing**

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│              App.tsx (Main)                  │
│  - State management (spots, selected spot)  │
│  - Orchestrates all modules                 │
└─────────────────────────────────────────────┘
            │
            ├─────────────────────────────────┐
            │                                 │
┌───────────▼─────────┐           ┌──────────▼────────┐
│   MapView            │           │  SpotForm         │
│   - Leaflet map      │◄──────────│  - CRUD form      │
│   - Markers          │           │  - Validation     │
│   - Click events     │           └───────────────────┘
└──────────────────────┘                     │
            │                                │
            │                    ┌───────────▼────────┐
            │                    │  StorageService    │
            │                    │  - IndexedDB       │
            │                    │  - CRUD operations │
            │                    └────────────────────┘
            │                                │
┌───────────▼─────────┐           ┌──────────▼────────┐
│   SpotList           │◄──────────│  ImportExport     │
│   - Display spots    │           │  - JSON export    │
│   - Edit/Delete      │           │  - JSON import    │
└──────────────────────┘           │  - Merge logic    │
            │                      └───────────────────┘
            │
┌───────────▼─────────┐
│   SpotFilters        │
│   - Type/Status      │
│   - Search           │
└──────────────────────┘
```

---

## Integration Points

### 1. App State Management
```typescript
interface AppState {
  spots: Spot[];              // All spots (from StorageService)
  filteredSpots: Spot[];      // After filters/search
  selectedSpot: Spot | null;  // For editing
  isFormOpen: boolean;        // Form modal state
  newSpotCoords: [number, number] | null; // From map click
}
```

### 2. Data Flow

**A. Load on mount**:
1. App mounts
2. Call `StorageService.getAllSpots()`
3. Set `spots` state
4. Render MapView + SpotList

**B. Add new spot**:
1. User clicks map
2. MapView fires `onMapClick(coords)`
3. App sets `newSpotCoords`, opens form
4. User fills SpotForm, submits
5. App calls `StorageService.addSpot(spot)`
6. Refetch spots, close form
7. MapView updates markers

**C. Edit spot**:
1. User clicks marker or "Edit" in SpotList
2. App sets `selectedSpot`, opens form
3. User edits SpotForm, submits
4. App calls `StorageService.updateSpot(spot)`
5. Refetch spots, close form

**D. Delete spot**:
1. User clicks "Delete" in SpotList
2. App calls `StorageService.deleteSpot(id)`
3. Refetch spots

**E. Filter/Search**:
1. User changes filters or search
2. App calls `SpotService.filterSpots()` + `SpotService.searchSpots()`
3. Set `filteredSpots` state
4. SpotList re-renders

**F. Export**:
1. User clicks "Export"
2. ImportExport calls `ExportService.exportToJSON(spots)`
3. Downloads JSON file

**G. Import**:
1. User selects file
2. ImportExport calls `ImportService.parseImportFile(file)`
3. ImportExport calls `ImportService.mergeSpots(existing, imported)`
4. Shows preview modal (added/updated/conflicts)
5. User confirms
6. App calls `StorageService.bulkAddSpots(added)` + updates
7. Refetch spots

---

## Component Integration Requirements

### App.tsx

**State**:
```typescript
const [spots, setSpots] = useState<Spot[]>([]);
const [filteredSpots, setFilteredSpots] = useState<Spot[]>([]);
const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
const [isFormOpen, setIsFormOpen] = useState(false);
const [newSpotCoords, setNewSpotCoords] = useState<[number, number] | null>(null);
const [filters, setFilters] = useState<SpotFilters>({});
const [searchQuery, setSearchQuery] = useState('');
```

**Effects**:
```typescript
// Load spots on mount
useEffect(() => {
  loadSpots();
}, []);

// Apply filters/search when spots/filters/query change
useEffect(() => {
  applyFiltersAndSearch();
}, [spots, filters, searchQuery]);
```

**Handlers**:
- `loadSpots()` → fetch from StorageService
- `handleMapClick(coords)` → open form with coords
- `handleMarkerClick(spot)` → open form for edit
- `handleFormSubmit(spot)` → add/update via StorageService
- `handleFormCancel()` → close form, clear state
- `handleDelete(id)` → delete via StorageService
- `handleFilterChange(filters)` → update filters
- `handleSearchChange(query)` → update search
- `handleImport(mergeResult)` → bulk operations

### MapView Props
```typescript
interface MapViewProps {
  spots: Spot[];                          // Display as markers
  onMapClick: (coords: [number, number]) => void;  // Add new spot
  onMarkerClick: (spot: Spot) => void;    // Edit existing spot
}
```

### SpotForm Props
```typescript
interface SpotFormProps {
  spot?: Spot;                  // For editing (undefined = new)
  initialCoords?: [number, number];  // From map click
  onSubmit: (spot: Spot) => void;
  onCancel: () => void;
}
```

### SpotList Props
```typescript
interface SpotListProps {
  spots: Spot[];
  onEdit: (spot: Spot) => void;
  onDelete: (id: string) => void;
}
```

### SpotFilters Props
```typescript
interface SpotFiltersProps {
  onFilterChange: (filters: SpotFilters) => void;
  onSearchChange: (query: string) => void;
}
```

### ImportExport Props
```typescript
interface ImportExportProps {
  spots: Spot[];
  onImport: (mergeResult: { added: Spot[]; updated: Spot[] }) => void;
}
```

---

## E2E Test Scenarios

### E2E-1: Full User Journey (Happy Path)
1. App loads with empty map
2. Click map → form opens with coords
3. Fill form (type=wall, status=free, notes="Test spot")
4. Submit → spot appears on map + in list
5. Click marker → form opens for edit
6. Change notes → submit → updates
7. Click delete in list → spot removed from map + list

### E2E-2: Filter & Search
1. Add 3 spots (wall, train, sign)
2. Apply filter (type=wall) → only wall spot visible
3. Clear filter → all 3 visible
4. Search "test" → only spots with "test" in notes visible
5. Clear search → all visible

### E2E-3: Export & Import
1. Add 2 spots
2. Export → JSON downloads
3. Delete all spots
4. Import JSON → merge preview shows 2 added
5. Confirm → spots restored

### E2E-4: Conflict Resolution
1. Add spot A (updatedAt = T1)
2. Export → JSON1
3. Edit spot A (updatedAt = T2)
4. Import JSON1 → merge preview shows 1 conflict
5. Confirm → keeps T2 version (newer)

### E2E-5: Persistence
1. Add spot
2. Refresh browser
3. Spot still visible (IndexedDB persistence)

### E2E-6: Validation Errors
1. Click map → form opens
2. Leave notes blank
3. Submit → error shown, submit blocked
4. Fill notes → submit enabled
5. Submit → spot created

---

## Testing Strategy

**Unit tests** (existing): 185 tests across services/components

**Integration tests** (NEW):
- `tests/integration/AppIntegration.test.tsx`
  - Test App orchestration (load → add → edit → delete)
  - Mock StorageService
  - Test state management + data flow

**E2E tests** (NEW):
- `tests/e2e/userJourney.spec.ts`
  - Playwright or Cypress
  - Real browser, real IndexedDB
  - Test full user scenarios (E2E-1 to E2E-6)

---

## Success Criteria

✅ App.tsx orchestrates all modules correctly
✅ Data flows: StorageService ↔ App ↔ Components
✅ Map click → form → storage → marker update
✅ Filter/search updates UI reactively
✅ Export/import with merge logic works
✅ IndexedDB persistence across refreshes
✅ All E2E scenarios pass
✅ No prop drilling (clean component boundaries)
✅ Error handling (storage errors, validation errors)

---

## Agent Coordination

**Agent A: Integration** (App.tsx + wiring)
- Implements App.tsx state management
- Wires all components together
- Handles data flow (StorageService ↔ components)
- Creates integration tests

**Agent B: E2E Testing** (Playwright setup + scenarios)
- Sets up Playwright config
- Implements E2E test scenarios (E2E-1 to E2E-6)
- Creates test utilities (helpers, fixtures)
- Runs E2E suite, reports results

**Dependencies**:
- Agent A reads all existing components (MapView, SpotForm, etc.)
- Agent B waits for Agent A to complete App.tsx
- Both agents follow TDD (tests first)

---

## Deliverables

**Agent A**:
- `src/App.tsx` (full integration)
- `src/App.css` (styling)
- `tests/integration/AppIntegration.test.tsx`
- Integration test results

**Agent B**:
- `playwright.config.ts`
- `tests/e2e/userJourney.spec.ts`
- `tests/e2e/helpers.ts` (utilities)
- E2E test results + screenshots

---

**Last updated**: 2026-03-26
**Phase**: Integration + E2E Testing
**Pattern**: Parallel agents with shared spec
