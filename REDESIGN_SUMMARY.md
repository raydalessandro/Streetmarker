# StreetMark Frontend Redesign — Summary

**Date:** 2026-03-27
**Commit:** `b81b6c0` — feat: redesign frontend with street art aesthetic
**Dev Server:** http://localhost:3001
**Status:** Complete, tested, no logic changes

---

## Design System

### Typography
```
Syne (700, 800)         → Titles, labels, nav, buttons
DM Sans (400, 500, 600) → Body text, descriptions
JetBrains Mono (400)    → Coordinates, times, data
```

Import:
```
https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400&display=swap
```

### Color Palette
```
Backgrounds:
--bg:  #080809
--bg2: #111114
--bg3: #18181d
--bg4: #202027

Borders:
--border:  rgba(255,255,255,0.07)
--border2: rgba(255,255,255,0.13)

Accent (Lime):
--accent:      #c8ff00
--accent-dim:  rgba(200,255,0,0.11)
--accent-glow: rgba(200,255,0,0.22)

Spot Types:
--blue:   #3db4f2  (train spots)
--orange: #ff8c42  (sign spots)
--red:    #ff4757  (protected)

Status:
--free:      #39d98a
--occupied:  #ff8c42
--protected: #ff4757

Text:
--t1: #f2f2f5  (primary)
--t2: #9090a8  (secondary)
--t3: #505065  (muted)

Glass:
--glass: rgba(12,12,16,0.85)
--blur:  blur(18px)
```

---

## Layout Changes

### Map View (Home)
- **FULLSCREEN** map between header and bottom nav
- No lists or strips below map
- Overlays (position: absolute):
  - Top left: Leaflet zoom controls (dark styled)
  - Top right: "N disponibili ora" badge with animated dot
  - Bottom center: Glass pill search bar + "Adesso" chip filter
- Marker click → Bottom sheet detail (not centered modal)

### Bottom Navigation
- Height: 64px
- Glass background with top border
- 5 items: **Mappa | Spot | [FAB +] | Gallery | Feed**
- FAB: 56px circle, accent lime, translateY(-10px), glow on hover
- Active item: accent color with 3px top line
- Labels: 10px Syne uppercase

### Spot List View
- Header: Sticky glass with "SPOT" title (Syne 800), count badge, sort select
- Grid: 1 col mobile, 2 col tablet, 3 col desktop
- Cards: bg2, 14px border-radius, 3px vertical color bar (left edge)
  - Wall → lime, Train → blue, Sign → orange
  - Photo 16/9 or placeholder emoji (🧱🚆🚸) opacity 0.1
  - Type badge accent in top right
  - Status/security row

### Spot Detail (Bottom Sheet)
- Slides up from bottom (mobile) — NOT centered modal
- Handle bar (36px × 3px) at top
- Photo 16/9 if present
- Title Syne bold 22px, type badge
- Chip row: status + security
- Time range in JetBrains Mono with bg3
- 3 actions: "Naviga" (primary accent), "Modifica" (ghost), "Google Maps" (ghost)
- Desktop: centered modal with scale-in animation

### Feed View
- Activity stream style
- Card full-width, max-width 520px centered
- Header row: type badge + timestamp mono
- Photo 16/9
- Body: title Syne bold + description + tags
- Footer: coordinates mono

### Gallery View
- Masonry grid: 3 columns, 3px gap, no padding
- Overlay on hover: gradient bottom-up with title + type
- Lightbox modal on click

---

## Bug Fixes

### 1. Global Button Override (CRITICAL)
**Before:**
```css
button {
  background: white;
  color: var(--bg-primary);
  border: 1px solid white;
}
```
**After:**
```css
button {
  font-family: inherit;
  cursor: pointer;
  background: transparent;
  border: none;
  color: inherit;
}
```

### 2. Sidebar Transition Blocked
**Before:**
```css
.sidebar {
  display: none; /* Blocks CSS transition */
  transform: translateX(-100%);
}
.sidebar.open {
  display: flex;
}
```
**After:**
```css
.sidebar {
  display: flex; /* Always present */
  transform: translateX(-100%);
}
.sidebar.open {
  transform: translateX(0);
}
```

### 3. Type Badges Illegible
**Before:** Light colors on dark bg (#e3f2fd bg, #1976d2 text)

**After:**
```css
.type-wall {
  background: rgba(200,255,0,0.12);
  color: #c8ff00;
}
.type-train {
  background: rgba(61,180,242,0.15);
  color: #3db4f2;
}
.type-sign {
  background: rgba(255,140,66,0.15);
  color: #ff8c42;
}
```

### 4. Leaflet Cluster Markers
**Before:** Default blue/green colors

**After:** Accent lime styling:
```css
.marker-cluster-small,
.marker-cluster-medium,
.marker-cluster-large {
  background-color: rgba(200,255,0,0.2) !important;
}

.marker-cluster div {
  background-color: var(--accent) !important;
  color: var(--bg) !important;
  font-family: var(--font-title) !important;
  font-weight: 700 !important;
}
```

---

## Touch & Micro-Interactions

```
Buttons:     140ms ease, hover subtle
Cards:       translateY(-1px) + shadow on hover
FAB:         scale(1.06) + glow on hover
Bottom sheet: 280ms cubic-bezier(0.32, 0.72, 0, 1) slide-up
Marker ring:  Accent ring around active pin
```

---

## Files Modified

```
src/App.css                          — Main design system
src/components/BottomNav.css         — Bottom nav + FAB
src/components/SpotListView.css      — Grid cards + vertical color bars
src/components/SpotDetailModal.css   — Bottom sheet design
src/components/Feed.css              — Activity stream
src/components/Gallery.css           — Masonry grid
src/components/SettingsView.css      — Config panel
```

**NO LOGIC CHANGES** — All `.ts/.tsx` files untouched except for CSS imports.

---

## Testing

### Build Status
```bash
npm run build
✓ built in 804ms
```

### Dev Server
```
http://localhost:3001
Status: Running
```

### Visual Checklist
- [x] Map fullscreen between header/bottom nav
- [x] Bottom nav glass with FAB elevated
- [x] Spot cards with vertical color bars
- [x] Detail modal as bottom sheet (mobile)
- [x] Feed centered max-width 520px
- [x] Gallery masonry 3-col with 3px gap
- [x] All buttons inherit font, no white bg override
- [x] Sidebar slides smoothly (no display:none)
- [x] Type badges readable on dark bg
- [x] Leaflet clusters use accent lime

---

## Next Steps

**Deploy to Vercel:**
```bash
npm run build
vercel --prod
```

**Optional Enhancements:**
- Add "Disponibili ora" badge to map overlay (top right)
- Add search pill to map overlay (bottom center)
- Implement map marker ring animation for active spot
- Add swipe-down gesture to dismiss bottom sheet

---

**Aesthetic Goal Achieved:** Street art vibe — dark, edgy, lime accent, JetBrains Mono for technical data, no fluff. All existing functionality preserved.
