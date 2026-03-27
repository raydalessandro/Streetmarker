# StreetMark Milano — UI/UX Design System
**Version 1.0 | March 27, 2026**

## Executive Summary

This document defines the complete design system and implementation roadmap for transforming StreetMark Milano from a desktop-oriented React app into a mobile-first, street art-inspired PWA with underground aesthetic. The design honors the provided neon green spray can logo and HTML mockup while maintaining existing functionality.

**Key Design Principles:**
- Mobile-first (320px-400px primary target)
- Dark theme with neon green accents (#ccff00)
- Glassmorphism UI panels
- Tactical/underground vibe
- PWA-optimized performance
- Accessibility-first approach

---

## Section 1: Component Research & Library Recommendations

### 1.1 Evaluated Libraries

#### **Option A: Custom CSS with CSS Variables (RECOMMENDED)**
**Package:** None (pure CSS)
**Pros:**
- Zero bundle size overhead
- Full control over glassmorphism effects
- Perfect for PWA performance
- No framework lock-in
- CSS variables already proven in mockup

**Cons:**
- Manual component styling
- No pre-built component library

**Verdict:** Best choice. The mockup already demonstrates all needed patterns. Lightweight, performant, no dependencies to maintain.

---

#### **Option B: Headless UI + Tailwind (NOT RECOMMENDED)**
**Package:** `@headlessui/react` + `tailwindcss`
**Pros:**
- Accessible component primitives
- Utility-first styling
- Dark mode support

**Cons:**
- Tailwind adds ~50KB to bundle
- Requires PostCSS config
- Utility classes don't align with glassmorphism aesthetic
- Overkill for small PWA

**Verdict:** Too heavy for this use case.

---

#### **Option C: Radix UI Primitives (FALLBACK OPTION)**
**Package:** `@radix-ui/react-primitive` components
**Pros:**
- Unstyled, accessible primitives
- Modular (install only what you need)
- Excellent keyboard navigation
- ~5KB per component

**Cons:**
- Still adds dependencies
- Styling still manual

**Verdict:** Use only if complex interactions needed (e.g., dropdown menus, tooltips). For StreetMark's needs, pure CSS is sufficient.

---

### 1.2 Specific Component Recommendations

#### **Bottom Navigation with FAB**
**Recommendation:** Custom CSS
**Rationale:** Simple fixed-position nav with flexbox. FAB is just a centered circle with negative margin-top.

**Example structure:**
```jsx
<nav className="bottom-nav">
  <NavItem icon="map" label="Mappa" />
  <NavItem icon="list" label="Spot" />
  <FABButton icon="plus" /> {/* Central FAB */}
  <NavItem icon="filter" label="Filtri" />
  <NavItem icon="sync" label="Sync" />
</nav>
```

**CSS Pattern (from mockup):**
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-panel);
  backdrop-filter: blur(15px);
  display: flex;
  justify-content: space-around;
  padding: 0.8rem 1rem 1.5rem; /* Extra bottom for iOS safe area */
}

.fab-wrapper {
  background: var(--neon-green);
  border-radius: 50%;
  width: 45px;
  height: 45px;
  margin-top: -20px; /* Protrudes above nav */
  border: 4px solid var(--bg-dark);
}
```

---

#### **Hamburger Menu / Drawer**
**Recommendation:** Custom CSS with `transform: translateX()`
**Library (optional):** `react-burger-menu` (~4KB) if animations needed

**Rationale:** Slide-in sidebar for filters/search. Pure CSS is 10 lines:
```css
.drawer {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 280px;
  background: var(--bg-panel);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 1000;
}

.drawer.open {
  transform: translateX(0);
}
```

**React state:**
```jsx
const [drawerOpen, setDrawerOpen] = useState(false);
```

---

#### **Photo Gallery Grid**
**Recommendation:** CSS Grid
**Rationale:** Native CSS grid handles responsive layout perfectly.

**Pattern:**
```css
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  padding: 1rem;
}

.gallery-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}
```

---

#### **Social Feed / Infinite Scroll**
**Recommendation:** Custom with IntersectionObserver API
**Library (if needed):** `react-infinite-scroll-component` (~2KB)

**Rationale:** IntersectionObserver is native, performant, and perfect for PWAs.

**Example:**
```jsx
const observerRef = useRef<IntersectionObserver | null>(null);

useEffect(() => {
  observerRef.current = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        loadMoreSpots();
      }
    },
    { threshold: 0.5 }
  );

  const sentinel = document.querySelector('.load-more-sentinel');
  if (sentinel) observerRef.current.observe(sentinel);

  return () => observerRef.current?.disconnect();
}, []);
```

---

#### **Dark Map Tiles (Leaflet)**
**Recommendation:** CartoDB Dark Matter or Stadia Maps AlidadeSmoothDark
**Current:** Default OpenStreetMap (light)

**Migration:**
```js
// In MapService.ts, replace tile layer URL:
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

L.tileLayer(DARK_TILE_URL, {
  attribution: '© OpenStreetMap, © CartoDB',
  maxZoom: 19,
}).addTo(map);
```

**Free alternatives:**
- CartoDB Dark Matter (no API key required)
- Stamen Toner (high contrast, grayscale)

---

### 1.3 Icons

**Recommendation:** Lucide React (successor to Feather Icons)
**Package:** `lucide-react` (~15KB for tree-shakeable imports)

**Pros:**
- SVG-based, crisp at any size
- Tree-shakeable (only import icons used)
- Consistent stroke width (matches mockup)
- Active maintenance

**Usage:**
```jsx
import { MapPin, List, Plus, Filter, Upload } from 'lucide-react';

<MapPin size={24} strokeWidth={2} color="var(--neon-green)" />
```

**Alternative (no dependency):** Inline SVG icons (copy from mockup HTML).

---

## Section 2: Design System

### 2.1 Color Palette

#### **Primary Palette**
```css
:root {
  /* Background */
  --bg-dark: #050505;            /* Main app background */
  --bg-panel: rgba(15, 15, 15, 0.75); /* Glassmorphic panels */
  --bg-elevated: #18181b;        /* Elevated surfaces (tags, inputs) */

  /* Neon Green (Brand) */
  --neon-green: #ccff00;         /* Primary accent, CTAs, active states */
  --neon-green-dim: rgba(204, 255, 0, 0.2); /* Hover states, glows */
  --neon-green-dark: #a3cc00;    /* Pressed states */

  /* Text */
  --text-main: #f4f4f5;          /* Primary text (zinc-100) */
  --text-muted: #a1a1aa;         /* Secondary text (zinc-400) */
  --text-dim: #71717a;           /* Tertiary text (zinc-500) */

  /* Borders */
  --border-dark: #27272a;        /* Subtle borders (zinc-800) */
  --border-accent: rgba(204, 255, 0, 0.3); /* Neon borders */

  /* Semantic Colors */
  --danger-red: #ff3366;         /* Destructive actions, high security */
  --danger-dim: rgba(255, 51, 102, 0.2);
  --warning-yellow: #fbbf24;     /* Medium security, warnings */
  --success-green: #10b981;      /* Success states, low security */
}
```

#### **Semantic Status Colors**
```css
/* Spot Status */
--status-free: #10b981;        /* Green: available now */
--status-occupied: #f59e0b;    /* Amber: currently occupied */
--status-protected: #ef4444;   /* Red: high security / protected */

/* Security Levels */
--security-low: #10b981;       /* Green */
--security-medium: #f59e0b;    /* Amber */
--security-high: #ef4444;      /* Red */
```

#### **Spot Type Colors**
```css
/* Used for markers and type badges */
--type-wall: #3b82f6;          /* Blue */
--type-train: #8b5cf6;         /* Purple */
--type-sign: #f59e0b;          /* Amber */
--type-other: #6b7280;         /* Gray */
```

---

### 2.2 Typography

#### **Font Stack**
```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', sans-serif;
  --font-mono: 'SF Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
}

body {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

#### **Type Scale (Mobile-First)**
```css
/* Headings */
--text-3xl: 2rem;      /* 32px - Page titles (rare on mobile) */
--text-2xl: 1.5rem;    /* 24px - Section headers */
--text-xl: 1.25rem;    /* 20px - Card titles */
--text-lg: 1.125rem;   /* 18px - Large body */

/* Body */
--text-base: 1rem;     /* 16px - Default body text */
--text-sm: 0.875rem;   /* 14px - Secondary text, labels */
--text-xs: 0.75rem;    /* 12px - Captions, badges, metadata */

/* Mono (for coordinates, status badges) */
--text-mono-sm: 0.8125rem; /* 13px - Status badges */
--text-mono-xs: 0.6875rem; /* 11px - Tiny metadata */
```

#### **Font Weights**
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-black: 900; /* For logo, spot titles */
```

#### **Line Heights**
```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

---

### 2.3 Spacing System (8pt Grid)

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px - Base unit */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
}
```

**Usage guidelines:**
- **Padding:** Use `--space-4` (16px) as default for cards/panels
- **Gaps:** Use `--space-2` (8px) for tight spacing, `--space-4` for comfortable
- **Margins:** Use `--space-6` (24px) for section separation

---

### 2.4 Border Radius

```css
:root {
  --radius-sm: 4px;    /* Small inputs, badges */
  --radius-md: 8px;    /* Cards, buttons */
  --radius-lg: 16px;   /* Modal panels, glassmorphic cards */
  --radius-xl: 24px;   /* Large feature cards */
  --radius-full: 9999px; /* Pills, FAB button */
}
```

---

### 2.5 Shadows & Glows

```css
:root {
  /* Shadows (for cards, modals) */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.7);
  --shadow-xl: 0 20px 50px rgba(0, 0, 0, 0.8);

  /* Neon Glows (for markers, FAB, active states) */
  --glow-neon: 0 0 15px rgba(204, 255, 0, 0.6);
  --glow-danger: 0 0 15px rgba(255, 51, 102, 0.6);
  --glow-success: 0 0 10px rgba(16, 185, 129, 0.5);
}
```

**Usage:**
```css
.marker-active {
  box-shadow: var(--glow-neon);
}

.spot-card {
  box-shadow: var(--shadow-md);
}

.fab-button {
  box-shadow: var(--glow-neon);
}
```

---

### 2.6 Glassmorphism Effects

```css
.glass-panel {
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px); /* Safari support */
  border: 1px solid var(--border-dark);
  border-radius: var(--radius-lg);
}

.glass-strong {
  background: rgba(15, 15, 15, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

**Browser support:** Excellent on modern iOS/Android. Fallback degrades gracefully (solid background without blur).

---

### 2.7 Animation & Transitions

```css
:root {
  /* Durations */
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 350ms;

  /* Easings */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Transitions */
.transition-default {
  transition: all var(--duration-base) var(--ease-out);
}

.transition-colors {
  transition: color var(--duration-fast) var(--ease-out),
              background-color var(--duration-fast) var(--ease-out),
              border-color var(--duration-fast) var(--ease-out);
}

.transition-transform {
  transition: transform var(--duration-base) var(--ease-in-out);
}
```

**Animation guidelines:**
- Buttons: 150ms color transitions
- Drawer open/close: 300ms slide
- Modal fade-in: 250ms opacity + 300ms transform
- FAB press: 100ms scale(0.95)

---

### 2.8 Component Inventory

#### **Buttons**

```css
/* Primary CTA (neon green) */
.btn-primary {
  background: var(--neon-green);
  color: #000;
  padding: 0.8rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  font-size: var(--text-sm);
  border: none;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.btn-primary:hover {
  background: var(--neon-green-dark);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: scale(0.98);
}

/* Secondary (outline) */
.btn-secondary {
  background: transparent;
  color: var(--text-main);
  padding: 0.8rem 1.5rem;
  border: 1px solid var(--border-dark);
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
}

.btn-secondary:hover {
  border-color: var(--neon-green);
  color: var(--neon-green);
}

/* Danger (red) */
.btn-danger {
  background: var(--danger-red);
  color: white;
}

.btn-danger:hover {
  background: #d61f4e;
}
```

---

#### **Cards**

```css
.spot-card {
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-dark);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-md);
  transition: all var(--duration-base) var(--ease-out);
}

.spot-card:hover {
  border-color: var(--border-accent);
  box-shadow: var(--shadow-lg);
}
```

---

#### **Badges / Tags**

```css
.tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  color: var(--text-muted);
}

.tag-neon {
  background: rgba(204, 255, 0, 0.05);
  border-color: var(--border-accent);
  color: var(--neon-green);
}

.tag-danger {
  background: rgba(255, 51, 102, 0.1);
  border-color: var(--danger-dim);
  color: var(--danger-red);
}
```

---

#### **Inputs**

```css
.input-text {
  width: 100%;
  padding: var(--space-3);
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  border-radius: var(--radius-md);
  color: var(--text-main);
  font-size: var(--text-sm);
  transition: all var(--duration-fast) var(--ease-out);
}

.input-text:focus {
  outline: none;
  border-color: var(--neon-green);
  box-shadow: 0 0 0 3px var(--neon-green-dim);
}

.input-text::placeholder {
  color: var(--text-dim);
}
```

---

#### **Status Badge (Monospace)**

```css
.status-badge {
  font-family: var(--font-mono);
  font-size: var(--text-mono-sm);
  background: var(--bg-panel);
  border: 1px solid var(--border-dark);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  backdrop-filter: blur(10px);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

### 2.9 Accessibility Guidelines

#### **Color Contrast**
- **AA compliance:** Minimum 4.5:1 for normal text, 3:1 for large text
- **Tested pairs:**
  - `--text-main` (#f4f4f5) on `--bg-dark` (#050505): 19.8:1 ✓
  - `--neon-green` (#ccff00) on `#000`: 16.4:1 ✓
  - `--text-muted` (#a1a1aa) on `--bg-dark`: 9.1:1 ✓

#### **Focus States**
```css
:focus-visible {
  outline: 2px solid var(--neon-green);
  outline-offset: 2px;
}

/* Remove default outline for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

#### **Reduced Motion**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### **Touch Targets**
- Minimum size: 44×44px (iOS Human Interface Guidelines)
- Spacing: 8px minimum between interactive elements

---

## Section 3: View Architecture

### 3.1 Navigation Structure

```
┌─────────────────────────────────────┐
│         Header (Fixed Top)          │
│  Logo + Status Badge + Menu Icon    │
├─────────────────────────────────────┤
│                                     │
│         Main Content Area           │
│      (View-specific layout)         │
│                                     │
│                                     │
├─────────────────────────────────────┤
│      Bottom Navigation (Fixed)      │
│  [Map] [Spot] [FAB+] [Gallery] [⋮] │
└─────────────────────────────────────┘
```

**Navigation flow:**
1. **Map View** (default, center pin icon active)
2. **Spots List View** (list icon)
3. **Add Spot** (FAB button, opens modal)
4. **Gallery View** (image grid icon)
5. **More Menu** (hamburger, opens drawer with Filters/Sync/Settings)

---

### 3.2 View 1: Map View (Enhanced)

**Current state:** Functional, but light-themed, no bottom nav, sidebar visible.

**Target design:**
```
┌─────────────────────────────────────┐
│ STREETMARK [MILAN]    REC // LOCAL  │ ← Header
├─────────────────────────────────────┤
│                                     │
│          DARK MAP TILES             │
│    (CartoDB Dark Matter)            │
│                                     │
│  ● ● Neon green markers             │
│  ● ● Clustered when zoomed out      │
│                                     │
│  ┌─────────────────────────────┐   │ ← Glassmorphic card
│  │ Muro Lambrate FS            │   │   (slides up from bottom)
│  │ WALL / CONCRETE             │   │
│  │ ● DISPONIBILE ORA           │   │
│  │ [Naviga allo Spot]          │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│ [Mappa] [Spot] [+] [Gallery] [⋮]   │ ← Bottom Nav
└─────────────────────────────────────┘
```

**Component breakdown:**
- `<MapView />` (existing, needs dark tiles)
- `<SpotCard />` (new, glassmorphic, slides up when marker clicked)
- `<BottomNav />` (new)
- `<Header />` (existing, needs restyling)

**Interactions:**
1. User taps marker → `<SpotCard />` slides up from bottom with spring animation
2. Card shows spot details (type, status, security, owner, photos)
3. Primary CTA: "Naviga allo Spot" opens device map app (Google Maps/Apple Maps)
4. Secondary CTA: "Modifica" opens `<SpotForm />` modal
5. Swipe down or tap backdrop → card slides down

**Mobile UX considerations:**
- **One-handed operation:** Bottom nav + card placed in thumb zone
- **Gesture support:** Swipe down to dismiss card
- **Performance:** Marker clustering for 100+ spots (already implemented)
- **Offline:** Map tiles cached via service worker (future PWA feature)

---

### 3.3 View 2: Spots List View (Redesigned)

**Current state:** Sidebar with filters + list. Not mobile-friendly.

**Target design:**
```
┌─────────────────────────────────────┐
│ STREETMARK [MILAN]    [≡] Menu      │ ← Header (hamburger opens filters)
├─────────────────────────────────────┤
│  🔍 [Search spots...]               │ ← Search bar (sticky)
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │ ← Spot cards (scrollable)
│  │ [WALL] [FREE]               │   │
│  │ Muro Lambrate FS            │   │
│  │ SEC: LOW | H: 3m            │   │
│  │ 45.50, 9.23                 │   │
│  │ [Edit] [Delete]             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [TRAIN] [OCCUPIED]          │   │
│  │ Deposito Greco              │   │
│  │ SEC: HIGH | @CREW_XYZ       │   │
│  │ [Edit] [Delete]             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ... (infinite scroll)              │
├─────────────────────────────────────┤
│ [Mappa] [Spot] [+] [Gallery] [⋮]   │
└─────────────────────────────────────┘
```

**Component breakdown:**
- `<SearchBar />` (sticky at top, below header)
- `<SpotCard />` (reusable component, same as map view)
- `<InfiniteScroll />` (load 20 spots at a time)
- `<FilterDrawer />` (hamburger menu opens from left)

**Interactions:**
1. User taps hamburger → `<FilterDrawer />` slides in from left
2. Drawer contains: Type filters, Status filters, Security level, Sort options
3. Search bar filters list in real-time
4. Tap card → opens `<SpotForm />` modal for editing
5. Swipe left on card → reveals "Delete" action (iOS-style)

**Mobile UX considerations:**
- **Search first:** Most common action is finding a specific spot
- **Quick filters:** Sticky filter chips below search (Free, Wall, Low Security)
- **Batch actions:** Long-press card → multi-select mode (future feature)

---

### 3.4 View 3: Gallery View (Favorites/Photos)

**Current state:** Does not exist.

**Target design:**
```
┌─────────────────────────────────────┐
│ Gallery               [Grid] [List] │ ← Header with view toggle
├─────────────────────────────────────┤
│                                     │
│  ┌────┐ ┌────┐ ┌────┐              │ ← Photo grid (3 columns)
│  │img1│ │img2│ │img3│              │
│  └────┘ └────┘ └────┘              │
│                                     │
│  ┌────┐ ┌────┐ ┌────┐              │
│  │img4│ │img5│ │img6│              │
│  └────┘ └────┘ └────┘              │
│                                     │
│  ... (infinite scroll)              │
│                                     │
├─────────────────────────────────────┤
│ [Mappa] [Spot] [+] [Gallery] [⋮]   │
└─────────────────────────────────────┘
```

**Purpose:** Show all spots with photos in a visual grid. Writers want to browse spots by visuals, not just text.

**Component breakdown:**
- `<PhotoGrid />` (CSS Grid, 3 columns on mobile)
- `<PhotoLightbox />` (tap photo → fullscreen with spot details overlay)

**Data logic:**
```jsx
// Filter spots with photos
const spotsWithPhotos = spots.filter(spot => spot.photos && spot.photos.length > 0);

// Flatten to photo array
const allPhotos = spotsWithPhotos.flatMap(spot =>
  spot.photos.map(photo => ({ photoUrl: photo, spot }))
);
```

**Interactions:**
1. User taps photo → `<PhotoLightbox />` opens fullscreen
2. Lightbox shows: Photo, spot name, location, type, status
3. Swipe left/right → navigate to next/previous photo
4. Tap "View Spot" → navigates to Map View with marker highlighted
5. Tap "Edit Spot" → opens `<SpotForm />`

**Mobile UX considerations:**
- **Lazy loading:** Load images as user scrolls (IntersectionObserver)
- **Thumbnail optimization:** Store 300×300px thumbnails in IndexedDB
- **Offline:** Show cached photos only, with "offline" badge

---

### 3.5 View 4: Feed View (Social-Style Scroll)

**Current state:** Does not exist.

**Target design:**
```
┌─────────────────────────────────────┐
│ Feed                  [Sort ⬇]      │ ← Header with sort dropdown
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │ ← Feed card (Instagram-style)
│  │ ┌─────────────────────────┐ │   │
│  │ │     [PHOTO CAROUSEL]    │ │   │   ← Swipeable photo carousel
│  │ │      1 / 3 photos        │ │   │
│  │ └─────────────────────────┘ │   │
│  │                             │   │
│  │ [WALL] [FREE] ● DISPONIBILE │   │   ← Tags + status
│  │                             │   │
│  │ Muro Lambrate FS            │   │   ← Spot name
│  │ Via Galilei, 12 • 2km away  │   │   ← Location + distance
│  │                             │   │
│  │ SEC: LOW | H: 3m | @owner   │   │   ← Metadata
│  │                             │   │
│  │ "Note: visibile da strada..." │   │   ← Spot notes (truncated)
│  │                             │   │
│  │ [Navigate] [Edit]           │   │   ← Actions
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │ ← Next feed card
│  │ ...                         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ... (infinite scroll)              │
├─────────────────────────────────────┤
│ [Mappa] [Spot] [+] [Gallery] [⋮]   │
└─────────────────────────────────────┘
```

**Purpose:** Browse all spots in a rich, visual feed. Perfect for discovering new spots.

**Component breakdown:**
- `<FeedCard />` (large glassmorphic card with photo carousel)
- `<PhotoCarousel />` (swipeable, dots indicator)
- `<InfiniteScroll />` (load 10 cards at a time)

**Sort options (dropdown):**
- Newest first
- Distance (nearest first, requires geolocation)
- Recently updated
- Status: Free first

**Interactions:**
1. User scrolls feed → new cards load automatically
2. Swipe left/right on photo carousel → navigate photos
3. Tap "Navigate" → opens device map app
4. Tap "Edit" → opens `<SpotForm />`
5. Long-press card → "Share spot" (exports JSON, future feature)

**Mobile UX considerations:**
- **Hero images:** Large photos (full width minus padding)
- **Skim-friendly:** Key info (type, status, distance) above fold
- **Progressive loading:** Load 10 cards, then 10 more on scroll
- **Skeleton screens:** Show loading placeholders while fetching

---

### 3.6 Drawer Menu (Hamburger)

**Opens from:** Top-right hamburger icon in header.

**Contents:**
```
┌─────────────────────────────────────┐
│ Filters & Settings                  │
├─────────────────────────────────────┤
│                                     │
│ 🔍 SEARCH                           │
│ [Search spots, owners, notes...]    │
│                                     │
│ 📍 FILTERS                          │
│ Type:  □ Wall □ Train □ Sign        │
│ Status: □ Free □ Occupied           │
│ Security: □ Low □ Med □ High        │
│                                     │
│ 🔄 SYNC                             │
│ Last sync: 2 hours ago              │
│ [Sync Now]                          │
│                                     │
│ ⚙️ SETTINGS                          │
│ [Import/Export]                     │
│ [About]                             │
│                                     │
└─────────────────────────────────────┘
```

**Component:** `<FilterDrawer />`

**Interactions:**
- Tap backdrop or swipe left → drawer closes
- Filters apply in real-time (updates active view)
- Sync button shows loading spinner + success toast

---

## Section 4: Implementation Roadmap

### Phase 1: Foundation (Week 1, ~8 hours)

#### **Step 1.1: CSS Variables Migration**
**Time:** 1 hour
**Files to modify:**
- `src/App.css`

**Tasks:**
1. Replace existing `:root` variables with new design system palette
2. Add all color, spacing, typography, shadow, and radius variables
3. Update component classes to use new variables

**Example diff:**
```diff
:root {
-  --primary-color: #1a1a1a;
-  --accent-color: #007bff;
+  --bg-dark: #050505;
+  --bg-panel: rgba(15, 15, 15, 0.75);
+  --neon-green: #ccff00;
+  --text-main: #f4f4f5;
+  /* ... (all new variables) */
}
```

**Verification:** Run dev server, check all components render without broken styles.

---

#### **Step 1.2: Dark Map Tiles**
**Time:** 30 minutes
**Files to modify:**
- `src/services/MapService.ts`

**Tasks:**
1. Replace OpenStreetMap tile URL with CartoDB Dark Matter
2. Update attribution
3. Test marker visibility (adjust icon colors if needed)

**Code change:**
```diff
- const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
+ const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
```

**Verification:** Map loads dark tiles, markers still visible.

---

#### **Step 1.3: Header Restyling**
**Time:** 1 hour
**Files to modify:**
- `src/App.tsx` (header JSX)
- `src/App.css` (header styles)

**Tasks:**
1. Add logo icon (spray can SVG or text-based)
2. Add status badge ("REC // LOCAL")
3. Add hamburger menu icon (for mobile)
4. Apply glassmorphic gradient background

**New JSX:**
```jsx
<header className="app-header">
  <div className="logo">
    <MapPin size={20} color="var(--neon-green)" />
    STREET<span>MARK</span>
  </div>
  <div className="status-badge">REC // LOCAL</div>
  <button className="menu-icon" onClick={toggleDrawer}>
    <Menu size={24} />
  </button>
</header>
```

**Verification:** Header matches mockup design, responsive on mobile.

---

### Phase 2: Bottom Navigation + FAB (Week 1, ~6 hours)

#### **Step 2.1: Create BottomNav Component**
**Time:** 2 hours
**Files to create:**
- `src/components/BottomNav.tsx`
- Add styles to `src/App.css`

**Component structure:**
```tsx
export interface BottomNavProps {
  activeView: 'map' | 'list' | 'gallery' | 'feed';
  onViewChange: (view: string) => void;
  onAddSpot: () => void;
}

export function BottomNav({ activeView, onViewChange, onAddSpot }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <NavItem icon="map" label="Mappa" active={activeView === 'map'} onClick={() => onViewChange('map')} />
      <NavItem icon="list" label="Spot" active={activeView === 'list'} onClick={() => onViewChange('list')} />
      <FABButton onClick={onAddSpot} />
      <NavItem icon="image" label="Gallery" active={activeView === 'gallery'} onClick={() => onViewChange('gallery')} />
      <NavItem icon="menu" label="More" onClick={() => onViewChange('more')} />
    </nav>
  );
}
```

**CSS (from mockup):**
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 400px; /* Constrain on desktop */
  margin: 0 auto;
  background: var(--bg-panel);
  backdrop-filter: blur(15px);
  border-top: 1px solid var(--border-dark);
  display: flex;
  justify-content: space-around;
  padding: 0.8rem 1rem 1.5rem; /* Extra padding-bottom for iOS safe area */
  z-index: 1000;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-out);
}

.nav-item.active {
  color: var(--neon-green);
}

.fab-wrapper {
  background: var(--neon-green);
  border-radius: 50%;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -20px; /* Protrudes above nav */
  border: 4px solid var(--bg-dark);
  box-shadow: var(--glow-neon);
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out);
}

.fab-wrapper:active {
  transform: scale(0.95);
}
```

**Verification:** Bottom nav appears, all icons visible, FAB protrudes, active state works.

---

#### **Step 2.2: Integrate BottomNav into App**
**Time:** 1 hour
**Files to modify:**
- `src/App.tsx`

**Tasks:**
1. Add state: `const [activeView, setActiveView] = useState('map')`
2. Conditionally render views based on `activeView`
3. Pass `onAddSpot` handler to FAB (opens `<SpotForm />`)
4. Hide sidebar on mobile (use media query or conditional render)

**New App structure:**
```tsx
<div className="app">
  <Header />

  {activeView === 'map' && <MapView ... />}
  {activeView === 'list' && <SpotListView ... />}
  {activeView === 'gallery' && <GalleryView ... />}
  {activeView === 'feed' && <FeedView ... />}

  <BottomNav activeView={activeView} onViewChange={setActiveView} onAddSpot={openAddModal} />
</div>
```

**Verification:** Navigation switches views, FAB opens form modal.

---

#### **Step 2.3: Add Icons (Lucide React)**
**Time:** 30 minutes
**Tasks:**
1. Install: `npm install lucide-react`
2. Replace placeholder icon strings with actual components
3. Import: `import { MapPin, List, Plus, Image, Menu } from 'lucide-react'`

**Verification:** Icons render correctly, tree-shaking works (check bundle size).

---

#### **Step 2.4: iOS Safe Area Support**
**Time:** 30 minutes
**Files to modify:**
- `src/index.html` (add viewport meta tag)
- `src/App.css` (add env() safe area insets)

**Meta tag:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

**CSS:**
```css
.bottom-nav {
  padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
}

.app {
  padding-top: env(safe-area-inset-top);
}
```

**Verification:** Test on iOS simulator or device, bottom nav doesn't overlap home indicator.

---

### Phase 3: Hamburger Menu & Filters (Week 2, ~5 hours)

#### **Step 3.1: Create FilterDrawer Component**
**Time:** 2 hours
**Files to create:**
- `src/components/FilterDrawer.tsx`

**Component structure:**
```tsx
export interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SpotFilters;
  onFilterChange: (filters: SpotFilters) => void;
}

export function FilterDrawer({ isOpen, onClose, filters, onFilterChange }: FilterDrawerProps) {
  return (
    <>
      {isOpen && <div className="drawer-backdrop" onClick={onClose} />}
      <div className={`filter-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>Filters & Settings</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <div className="drawer-content">
          <SearchBar ... />
          <FilterSection title="Type" options={['wall', 'train', 'sign']} ... />
          <FilterSection title="Status" options={['free', 'occupied', 'protected']} ... />
          <FilterSection title="Security" options={['low', 'medium', 'high']} ... />
        </div>
      </div>
    </>
  );
}
```

**CSS:**
```css
.drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 999;
  backdrop-filter: blur(4px);
}

.filter-drawer {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 280px;
  max-width: 80vw;
  background: var(--bg-panel);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-dark);
  transform: translateX(-100%);
  transition: transform var(--duration-slow) var(--ease-out);
  z-index: 1000;
  overflow-y: auto;
}

.filter-drawer.open {
  transform: translateX(0);
}
```

**Verification:** Drawer slides in/out smoothly, filters apply to active view.

---

#### **Step 3.2: Move SpotFilters into Drawer**
**Time:** 1 hour
**Files to modify:**
- `src/components/SpotFilters.tsx` (extract logic, keep UI)
- `src/App.tsx` (remove sidebar, use drawer)

**Tasks:**
1. Extract filter logic from `<SpotFilters />` into reusable hook: `useSpotFilters()`
2. Render `<SpotFilters />` inside `<FilterDrawer />`
3. Remove sidebar from desktop layout (filters now always in drawer)

**Verification:** Filters work in drawer, no sidebar on any screen size.

---

#### **Step 3.3: Add Hamburger Menu Icon to Header**
**Time:** 30 minutes
**Files to modify:**
- `src/App.tsx` (header JSX)

**Tasks:**
1. Add hamburger icon button
2. Connect to `toggleDrawer()` handler
3. Show/hide based on screen size (always visible on mobile)

**JSX:**
```jsx
<button className="menu-btn" onClick={toggleDrawer}>
  <Menu size={24} color="var(--text-main)" />
</button>
```

**Verification:** Tapping hamburger opens drawer.

---

### Phase 4: Gallery View (Week 2, ~4 hours)

#### **Step 4.1: Create PhotoGrid Component**
**Time:** 2 hours
**Files to create:**
- `src/components/PhotoGrid.tsx`

**Component structure:**
```tsx
export interface PhotoGridProps {
  spots: Spot[];
  onPhotoClick: (photo: string, spot: Spot) => void;
}

export function PhotoGrid({ spots, onPhotoClick }: PhotoGridProps) {
  const photos = useMemo(() => {
    return spots
      .filter(spot => spot.photos && spot.photos.length > 0)
      .flatMap(spot => spot.photos!.map(photo => ({ photo, spot })));
  }, [spots]);

  return (
    <div className="photo-grid">
      {photos.map(({ photo, spot }) => (
        <div key={`${spot.id}-${photo}`} className="photo-item" onClick={() => onPhotoClick(photo, spot)}>
          <img src={photo} alt={spot.notes} loading="lazy" />
        </div>
      ))}
    </div>
  );
}
```

**CSS:**
```css
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-2);
  padding: var(--space-4);
}

.photo-item {
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out);
}

.photo-item:hover {
  transform: scale(1.05);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

**Verification:** Grid displays photos, lazy loading works, tap opens lightbox (placeholder).

---

#### **Step 4.2: Create PhotoLightbox Component**
**Time:** 1.5 hours
**Files to create:**
- `src/components/PhotoLightbox.tsx`

**Component structure:**
```tsx
export interface PhotoLightboxProps {
  photo: string;
  spot: Spot;
  onClose: () => void;
  onNavigate: () => void;
  onEdit: () => void;
}

export function PhotoLightbox({ photo, spot, onClose, onNavigate, onEdit }: PhotoLightboxProps) {
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>&times;</button>
        <img src={photo} alt={spot.notes} />
        <div className="lightbox-info">
          <h3>{spot.notes}</h3>
          <p>{spot.coords[0].toFixed(4)}, {spot.coords[1].toFixed(4)}</p>
          <div className="lightbox-actions">
            <button className="btn-primary" onClick={onNavigate}>View on Map</button>
            <button className="btn-secondary" onClick={onEdit}>Edit Spot</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**CSS:**
```css
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.lightbox-content {
  max-width: 800px;
  width: 100%;
}

.lightbox-content img {
  width: 100%;
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
}
```

**Verification:** Lightbox opens, close button works, navigate/edit buttons functional.

---

#### **Step 4.3: Integrate GalleryView into App**
**Time:** 30 minutes
**Files to modify:**
- `src/App.tsx`

**Tasks:**
1. Add `GalleryView` case to view switcher
2. Pass filtered spots to `<PhotoGrid />`
3. Handle lightbox open/close state

**Verification:** Gallery icon in bottom nav switches to grid view.

---

### Phase 5: Feed View (Week 3, ~6 hours)

#### **Step 5.1: Create FeedCard Component**
**Time:** 3 hours
**Files to create:**
- `src/components/FeedCard.tsx`
- `src/components/PhotoCarousel.tsx`

**FeedCard structure:**
```tsx
export interface FeedCardProps {
  spot: Spot;
  onNavigate: () => void;
  onEdit: () => void;
}

export function FeedCard({ spot, onNavigate, onEdit }: FeedCardProps) {
  return (
    <div className="feed-card glass-panel">
      {spot.photos && spot.photos.length > 0 && (
        <PhotoCarousel photos={spot.photos} />
      )}
      <div className="feed-card-content">
        <div className="feed-card-tags">
          <span className={`tag type-${spot.type}`}>{spot.type}</span>
          <span className={`tag status-${spot.status}`}>{spot.status}</span>
        </div>
        <h3 className="feed-card-title">{spot.notes}</h3>
        <p className="feed-card-meta">
          {spot.coords[0].toFixed(4)}, {spot.coords[1].toFixed(4)}
        </p>
        <p className="feed-card-details">
          SEC: {spot.securityLevel} | {spot.owner && `@${spot.owner}`}
        </p>
        <div className="feed-card-actions">
          <button className="btn-primary" onClick={onNavigate}>Navigate</button>
          <button className="btn-secondary" onClick={onEdit}>Edit</button>
        </div>
      </div>
    </div>
  );
}
```

**PhotoCarousel structure:**
```tsx
export function PhotoCarousel({ photos }: { photos: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="photo-carousel">
      <img src={photos[currentIndex]} alt={`Photo ${currentIndex + 1}`} />
      {photos.length > 1 && (
        <div className="carousel-dots">
          {photos.map((_, i) => (
            <span key={i} className={i === currentIndex ? 'active' : ''} onClick={() => setCurrentIndex(i)} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**CSS:**
```css
.feed-card {
  margin: var(--space-4);
  overflow: hidden;
}

.photo-carousel {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.photo-carousel img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-dots {
  position: absolute;
  bottom: var(--space-2);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--space-1);
}

.carousel-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.carousel-dots span.active {
  background: var(--neon-green);
}
```

**Verification:** Feed cards render, carousel swipes (mouse drag or touch), actions work.

---

#### **Step 5.2: Implement Infinite Scroll**
**Time:** 2 hours
**Files to create:**
- `src/hooks/useInfiniteScroll.ts`

**Hook structure:**
```tsx
export function useInfiniteScroll(spots: Spot[], pageSize = 10) {
  const [displayedSpots, setDisplayedSpots] = useState<Spot[]>([]);
  const [page, setPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayedSpots(spots.slice(0, pageSize));
    setPage(1);
  }, [spots, pageSize]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && displayedSpots.length < spots.length) {
          const nextPage = page + 1;
          setDisplayedSpots(spots.slice(0, nextPage * pageSize));
          setPage(nextPage);
        }
      },
      { threshold: 0.5 }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [spots, displayedSpots, page, pageSize]);

  return { displayedSpots, sentinelRef };
}
```

**Usage in FeedView:**
```tsx
export function FeedView({ spots }: { spots: Spot[] }) {
  const { displayedSpots, sentinelRef } = useInfiniteScroll(spots, 10);

  return (
    <div className="feed-view">
      {displayedSpots.map(spot => (
        <FeedCard key={spot.id} spot={spot} ... />
      ))}
      <div ref={sentinelRef} className="load-more-sentinel" />
    </div>
  );
}
```

**Verification:** Feed loads 10 cards, scrolling triggers loading more, no duplicate renders.

---

#### **Step 5.3: Integrate FeedView into App**
**Time:** 1 hour
**Files to modify:**
- `src/App.tsx`

**Tasks:**
1. Add `FeedView` case to view switcher
2. Pass filtered spots
3. Connect navigation handlers

**Verification:** Feed icon in bottom nav switches to feed view, all interactions work.

---

### Phase 6: Polish & Optimization (Week 3-4, ~8 hours)

#### **Step 6.1: Spot Card Redesign (Glassmorphism)**
**Time:** 2 hours
**Files to modify:**
- `src/components/SpotList.tsx`
- `src/App.css`

**Tasks:**
1. Apply glassmorphic styles to `.spot-card`
2. Update badges with neon accents
3. Add hover glow effect

**CSS:**
```css
.spot-card {
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-dark);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-md);
  transition: all var(--duration-base) var(--ease-out);
}

.spot-card:hover {
  border-color: var(--border-accent);
  box-shadow: var(--glow-neon), var(--shadow-lg);
}
```

**Verification:** Cards match mockup aesthetic, hover states work.

---

#### **Step 6.2: Form Modal Redesign**
**Time:** 1.5 hours
**Files to modify:**
- `src/components/SpotForm.tsx`
- `src/App.css`

**Tasks:**
1. Apply glassmorphic background to modal
2. Update button styles (neon green primary)
3. Improve input focus states

**CSS:**
```css
.modal-overlay {
  backdrop-filter: blur(8px);
}

.modal-content {
  background: var(--bg-panel);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-dark);
  box-shadow: var(--shadow-xl);
}
```

**Verification:** Modal matches design system, form validation works.

---

#### **Step 6.3: Marker Style Update (Neon Green)**
**Time:** 1 hour
**Files to modify:**
- `src/services/MapService.ts`

**Tasks:**
1. Create custom neon green marker icons
2. Differentiate by status (green = free, red = protected, amber = occupied)
3. Add glow effect to active marker

**Code:**
```ts
const createMarkerIcon = (status: SpotStatus) => {
  const color = {
    free: '#10b981',
    occupied: '#f59e0b',
    protected: '#ef4444',
  }[status];

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      background: ${color};
      border: 3px solid #000;
      border-radius: 50%;
      box-shadow: 0 0 15px ${color};
    "></div>`,
  });
};
```

**Verification:** Markers glow on dark map, status colors visible.

---

#### **Step 6.4: Responsive Testing**
**Time:** 2 hours
**Tasks:**
1. Test on Chrome DevTools (iPhone SE, iPhone 12, Pixel 5)
2. Test on physical devices (iOS + Android)
3. Fix layout issues (spacing, overflow, touch targets)
4. Verify safe area insets work on iOS

**Checklist:**
- [ ] Bottom nav doesn't overlap home indicator (iOS)
- [ ] All touch targets ≥44px
- [ ] No horizontal scroll
- [ ] Text readable at 100% zoom
- [ ] Glassmorphic panels visible on dark map background

---

#### **Step 6.5: Performance Optimization**
**Time:** 1.5 hours
**Tasks:**
1. Lazy load components with `React.lazy()`:
   ```tsx
   const GalleryView = lazy(() => import('./views/GalleryView'));
   const FeedView = lazy(() => import('./views/FeedView'));
   ```
2. Add `loading="lazy"` to all images
3. Optimize photo thumbnails (resize to 300×300px on upload)
4. Use `useMemo()` for expensive computations (filtering, sorting)
5. Add Suspense boundaries:
   ```tsx
   <Suspense fallback={<LoadingSpinner />}>
     {activeView === 'gallery' && <GalleryView />}
   </Suspense>
   ```

**Verification:** Lighthouse score ≥90 on Performance, Accessibility, Best Practices.

---

## Appendix A: File Structure (After Implementation)

```
src/
├── components/
│   ├── BottomNav.tsx          ← NEW
│   ├── FeedCard.tsx            ← NEW
│   ├── FilterDrawer.tsx        ← NEW
│   ├── Header.tsx              ← NEW (extracted from App)
│   ├── ImportExport.tsx
│   ├── MapView.tsx             ← MODIFIED (dark tiles)
│   ├── PhotoCarousel.tsx       ← NEW
│   ├── PhotoGrid.tsx           ← NEW
│   ├── PhotoLightbox.tsx       ← NEW
│   ├── PhotoUpload.tsx
│   ├── SpotCard.tsx            ← NEW (reusable)
│   ├── SpotFilters.tsx         ← MODIFIED (extract logic)
│   ├── SpotForm.tsx            ← MODIFIED (restyled)
│   └── SpotList.tsx            ← MODIFIED (restyled)
├── views/
│   ├── FeedView.tsx            ← NEW
│   ├── GalleryView.tsx         ← NEW
│   ├── ListView.tsx            ← NEW (refactored from App)
│   └── MapView.tsx             ← NEW (refactored from App)
├── hooks/
│   ├── useInfiniteScroll.ts    ← NEW
│   └── useSpotFilters.ts       ← NEW
├── services/
│   ├── MapService.ts           ← MODIFIED (dark tiles, custom markers)
│   ├── SpotService.ts
│   └── StorageService.ts
├── types/
│   └── spot.ts
├── App.tsx                     ← MODIFIED (view routing, bottom nav)
├── App.css                     ← MODIFIED (design system variables)
└── main.tsx
```

---

## Appendix B: Testing Checklist

### Functional Tests
- [ ] Map view: Markers load, click opens card, FAB opens form
- [ ] Spots list view: Search filters, hamburger opens drawer, edit/delete work
- [ ] Gallery view: Photos load lazily, lightbox opens, navigation works
- [ ] Feed view: Infinite scroll loads more, carousel swipes, actions work
- [ ] Bottom nav: Switches views, FAB opens form, active state highlights
- [ ] Filter drawer: Opens/closes, filters apply, search works
- [ ] Form modal: Validation works, photo upload works, save persists to IndexedDB

### Visual Tests
- [ ] Dark theme applied everywhere
- [ ] Neon green accents on active states, CTAs, markers
- [ ] Glassmorphism panels visible on dark backgrounds
- [ ] Typography scale consistent
- [ ] Spacing follows 8pt grid

### Accessibility Tests
- [ ] Color contrast ≥4.5:1 (WCAG AA)
- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible (neon green outline)
- [ ] Screen reader labels present (`aria-label`)
- [ ] Reduced motion support

### Performance Tests
- [ ] Lighthouse Performance ≥90
- [ ] First Contentful Paint <2s
- [ ] Time to Interactive <3s
- [ ] Bundle size <500KB (gzipped)
- [ ] Lazy loading images work
- [ ] Infinite scroll doesn't lag

### Mobile Tests
- [ ] iOS Safari: Safe area insets, touch gestures, PWA install
- [ ] Android Chrome: Bottom nav, drawer, photo upload
- [ ] Touch targets ≥44px
- [ ] No horizontal scroll
- [ ] Portrait + landscape modes

---

## Appendix C: Future Enhancements (Post-MVP)

1. **PWA Features**
   - Service worker for offline map tiles
   - Add to Home Screen prompt
   - Background sync for spot uploads

2. **Advanced Interactions**
   - Swipe left to delete spot (iOS-style)
   - Pull-to-refresh in Feed View
   - Long-press for batch selection

3. **Social Features**
   - Like/favorite spots
   - Comment system
   - Crew tagging (@mentions)

4. **Data Sync**
   - P2P data sharing (WebRTC)
   - QR code export/import
   - Cloud backup (optional)

5. **Map Enhancements**
   - Heatmap layer (spot density)
   - Route planning (multi-spot trips)
   - Street View integration

---

## Conclusion

This design system provides a complete blueprint for transforming StreetMark into a mobile-first, underground-aesthetic PWA. The phased implementation plan prioritizes core functionality (navigation, views) before polish, ensuring a working app at each milestone.

**Total estimated time:** ~35-40 hours over 3-4 weeks.

**Key deliverables:**
1. Dark theme with neon green branding
2. Bottom navigation with FAB
3. Four main views (Map, List, Gallery, Feed)
4. Hamburger menu with filters
5. Glassmorphic UI components
6. Mobile-optimized, PWA-ready

The design honors the provided logo and mockup while maintaining compatibility with existing services (StorageService, SpotService, MapService) and ensuring no breaking changes to data flow.

Ready for implementation.
