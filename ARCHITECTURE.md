# StreetMark — Architecture

**PWA locale per writers milanesi**
Milano città + area metropolitana, offline-first, P2P data sharing

---

## Tech Stack

- **Framework**: React 18 + Vite 5
- **Map Engine**: Leaflet 1.9 + OpenStreetMap tiles
- **Storage**: IndexedDB (via idb wrapper)
- **Testing**: Vitest + Testing Library
- **PWA**: Vite PWA plugin
- **Deploy**: Vercel (static)

---

## Data Schema (SHARED CONTRACT)

```typescript
// src/types/spot.ts

export type SpotType = 'wall' | 'train' | 'sign' | 'other';
export type SpotStatus = 'free' | 'occupied' | 'protected';
export type SecurityLevel = 'low' | 'medium' | 'high';

export interface TimeRange {
  from: string; // HH:MM format (24h)
  to: string;   // HH:MM format (24h)
}

export interface Spot {
  id: string;                    // UUID v4
  coords: [number, number];      // [lat, lng]
  type: SpotType;
  status: SpotStatus;
  availability: TimeRange[];
  securityLevel: SecurityLevel;
  owner?: string;                // crew/writer name (optional)
  notes: string;
  photos?: string[];             // base64 or blob URLs (optional)
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
}

export interface ExportData {
  version: string;               // Semver (e.g., '1.0.0')
  exportedAt: number;            // Unix timestamp
  spots: Spot[];
  metadata: {
    appVersion: string;
    deviceId: string;            // UUID persistent in localStorage
  };
}
```

---

## Service Interfaces (SHARED CONTRACT)

### StorageService
```typescript
interface StorageService {
  // CRUD operations
  getSpot(id: string): Promise<Spot | null>;
  getAllSpots(): Promise<Spot[]>;
  addSpot(spot: Spot): Promise<void>;
  updateSpot(spot: Spot): Promise<void>;
  deleteSpot(id: string): Promise<void>;

  // Bulk operations
  clearAllSpots(): Promise<void>;
  bulkAddSpots(spots: Spot[]): Promise<void>;
}
```

### MapService
```typescript
interface MapService {
  initMap(containerId: string, center: [number, number], zoom: number): void;
  addMarker(spot: Spot): L.Marker;
  removeMarker(spotId: string): void;
  updateMarker(spot: Spot): void;
  getMarker(spotId: string): L.Marker | null;
  setView(center: [number, number], zoom: number): void;
  onMapClick(callback: (coords: [number, number]) => void): void;
}
```

### SpotService
```typescript
interface SpotService {
  createSpot(data: Omit<Spot, 'id' | 'createdAt' | 'updatedAt'>): Spot;
  validateSpot(spot: Partial<Spot>): { valid: boolean; errors: string[] };
  filterSpots(spots: Spot[], filters: SpotFilters): Spot[];
  searchSpots(spots: Spot[], query: string): Spot[];
}

interface SpotFilters {
  type?: SpotType[];
  status?: SpotStatus[];
  securityLevel?: SecurityLevel[];
}
```

### ExportService
```typescript
interface ExportService {
  exportToJSON(spots: Spot[]): ExportData;
  downloadJSON(data: ExportData, filename: string): void;
}
```

### ImportService
```typescript
interface ImportService {
  validateImportData(data: unknown): { valid: boolean; errors: string[] };
  parseImportFile(file: File): Promise<ExportData>;
  mergeSpots(existing: Spot[], imported: Spot[]): {
    added: Spot[];
    updated: Spot[];
    conflicts: Spot[];
  };
}
```

---

## Directory Structure

```
streetmark/
├── src/
│   ├── components/
│   │   ├── MapView.tsx
│   │   ├── SpotForm.tsx
│   │   ├── SpotList.tsx
│   │   ├── ImportExport.tsx
│   │   └── __tests__/
│   ├── services/
│   │   ├── MapService.ts
│   │   ├── SpotService.ts
│   │   ├── StorageService.ts
│   │   ├── ExportService.ts
│   │   ├── ImportService.ts
│   │   └── __tests__/
│   ├── types/
│   │   └── spot.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   └── __tests__/
│   ├── App.tsx
│   └── main.tsx
├── public/
│   ├── manifest.json
│   └── icons/
├── tests/
│   └── e2e/
├── vite.config.ts
├── vitest.config.ts
├── package.json
└── README.md
```

---

## Testing Requirements (OBBLIGATORIO)

**Every agent MUST**:
- Write tests BEFORE implementation (TDD)
- Achieve ≥80% code coverage for own module
- Test all public service methods
- Test error cases (validation, network, storage)
- Mock external dependencies (IndexedDB, Leaflet, File API)

**Test organization**:
- Unit tests: `src/services/__tests__/ServiceName.test.ts`
- Component tests: `src/components/__tests__/ComponentName.test.tsx`
- Integration tests: `tests/integration/`

---

## Agent Coordination

**Agent dependencies**:
1. **setup-infra** → must complete FIRST (types + storage)
2. **map-engine**, **spot-manager**, **data-exchange** → parallel (depend on types from #1)

**Shared artifacts** (from setup-infra):
- `src/types/spot.ts` (data types)
- `src/services/StorageService.ts` (IndexedDB wrapper)
- `vitest.config.ts` (test config)

**No cross-agent modifications**:
- Each agent owns its own services/components
- Shared types = read-only after setup-infra completes

---

## Milano Geographic Config

**Default map center**: `[45.4642, 9.1900]` (Duomo Milano)
**Default zoom**: 13 (city overview)
**Zoom range**: 10-18 (metro area → street level)

**OSM tile server**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
**Attribution**: `© OpenStreetMap contributors`

---

## PWA Requirements

**manifest.json**:
- `name`: "StreetMark"
- `short_name`: "StreetMark"
- `start_url`: "/"
- `display`: "standalone"
- `theme_color`: "#1a1a1a"
- `background_color`: "#ffffff"
- Icons: 192x192, 512x512

**Service Worker**:
- Cache OSM tiles (zoom 10-18 for Milano bounds)
- Cache app shell (HTML/CSS/JS)
- Network-first for data (always try fresh)

---

## Code Style

- **TypeScript**: strict mode enabled
- **Formatting**: Prettier (auto-format on save)
- **Linting**: ESLint (error on warnings)
- **Naming**: camelCase (variables/functions), PascalCase (components/types)

---

## Version Control

**Branch strategy** (for this project):
- `main` → production-ready
- `dev` → integration branch
- Feature branches: `feature/agent-name`

**Commit messages**: Conventional Commits
- `feat: add spot filtering`
- `fix: marker clustering bug`
- `test: add StorageService tests`

---

## Success Criteria

✅ **Infrastructure**: Storage + types + test suite operational
✅ **Map**: Markers on Milano map, offline tiles, clustering
✅ **Spots**: CRUD form, validation, filters/search
✅ **Exchange**: Export/import JSON, merge conflicts handled

**Final integration**: All 4 modules → working PWA deployable on Vercel

---

**Last updated**: 2026-03-26
**Architect**: Claude (Orchestrator mode)
**Agents**: 4 parallel implementers (TDD-first)
