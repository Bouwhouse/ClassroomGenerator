# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Application

No build step, no package manager, no server required. Open `index.html` directly in a browser:

```bash
# On Linux
xdg-open index.html
```

`html2canvas` is vendored locally as `html2canvas.min.js` — no CDN dependency. There are no tests.

## Deployment

Hosted on Netlify at `plattegrondgenerator.netlify.app`. Push to `main` on GitHub triggers an automatic redeploy. `netlify.toml` sets 1-year cache headers for JS/CSS/PNG assets and security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) for all routes.

## Architecture

Pure client-side single-page application written in Dutch. Four files of substance:
- `index.html` — page structure and `<template>` elements for dynamic rows
- `style.css` — all styling via CSS custom properties
- `app.js` — all logic (ES6+ Vanilla JS, no frameworks)
- `html2canvas.min.js` — vendored screenshot library

### Class Structure in `app.js`

Six classes instantiated in `DOMContentLoaded` and wired together by reference:

| Class | Responsibility |
|---|---|
| `State` | Central state + `localStorage` persistence |
| `NotificationSystem` | Toast-style user feedback |
| `SeatingGenerator` | Placement algorithm + DOM rendering of seat grids |
| `TabManager` | Switching between the 4 layout tabs (lazy rendering) |
| `ListManager` | Save/load/delete named class lists |
| `EventHandlers` | Attaches all UI event listeners |

**Wiring quirk**: `ListManager.updateUI` is monkey-patched after construction because it needs `EventHandlers.addFixedSeatInput` and `addSeparatedPairInput`, creating a circular dependency that's resolved post-instantiation.

### State Model

All state persists to `localStorage` under the key `'classroomState'`. The `State` class holds:
- `students: string[]` — ordered list of student names
- `fixedSeats: Map<studentName, seatIndex>` — 0-indexed internally, 1-indexed in the UI
- `separatedPairs: [string, string][]` — pairs that must not be neighbors
- `layouts: { '222'|'232'|'33'|'custom': Array<{name:string}|null> }` — current seat arrangements
- `savedLists: Map<listName, {students, fixedSeats, separatedPairs}>` — persisted class lists
- `customLayoutConfig: { rows, groupSizes }` — configuration for the custom tab
- `activeTab: string`

### Seating Algorithm (`SeatingGenerator`)

Layout types (`222`, `232`, `33`, `custom`) each define `{ groupSizes, rows, seatsPerRow }`. Seats are addressed by flat index: `row * seatsPerRow + col`.

Generation flow:
1. Place fixed-seat students first
2. Fisher-Yates shuffle remaining students into empty seats
3. Check for separation violations via `getNeighbors()` — adjacency is group-aware (no cross-aisle neighbours)
4. Swap-fix violations up to 500 attempts total
5. Warn via notification if constraints cannot be fully satisfied

`render(layoutType = null)` only renders the active tab. `TabManager` fires an `onTabChange` callback that calls `render(tabId)` when switching to a tab that has layout data, enabling lazy rendering.

### Easter Egg

`DEMO_NAMES` (module-level constant, top of `EventHandlers` section) holds 37 Dutch multicultural names. Clicking the logo 5 times within 1.5 seconds calls `loadDemoNames()`, which shuffles the list and loads 28 random names into the textarea — useful for quick testing.

### CSS Notes

- All colour tokens are CSS custom properties on `:root`. There is no theming system (dark mode and colour picker were removed).
- Tab switching uses a `@keyframes fadeIn` animation on `.tab-content.active` — not a `transition`, because `display:none → block` cannot be transitioned.
- The mobile breakpoint (768px) uses `:not(.remove-fixed):not(.remove-separated-pair)` to exempt small "X" buttons from the `width: 100%` rule that applies to all other buttons.
- `backdrop-filter` is not used — all container backgrounds are opaque.
