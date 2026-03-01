# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Application

No build step, no package manager, no server required. Open `index.html` directly in a browser:

```bash
# On Linux
xdg-open index.html

# Or just double-click index.html in a file manager
```

The only external dependency is `html2canvas` loaded from a CDN in `index.html`. There are no tests.

## Architecture

This is a pure client-side, single-page application written in Dutch. Three files:
- `index.html` — page structure and HTML templates for dynamic elements
- `style.css` — all styling using CSS custom properties for theming
- `app.js` — all application logic (no frameworks, ES6+ Vanilla JS)

### Class Structure in `app.js`

Six classes are instantiated in `DOMContentLoaded` and wired together by passing references:

| Class | Responsibility |
|---|---|
| `State` | Central state + `localStorage` persistence |
| `NotificationSystem` | Toast-style user feedback |
| `SeatingGenerator` | Placement algorithm + DOM rendering of seat grids |
| `TabManager` | Switching between the 4 layout tabs |
| `ListManager` | Save/load/delete named class lists |
| `EventHandlers` | Attaches all UI event listeners |

**Important wiring quirk**: `ListManager.updateUI` is monkey-patched after construction (line 882) because it needs `EventHandlers.addFixedSeatInput` and `addSeparatedPairInput`, which create a circular dependency.

### State Model

All state persists to `localStorage` under the key `'classroomState'`. The `State` class holds:
- `students: string[]` — ordered list of student names
- `fixedSeats: Map<studentName, seatIndex>` — 0-indexed seat positions (UI shows 1-indexed)
- `separatedPairs: [string, string][]` — pairs of students that must not be neighbors
- `layouts: { '222'|'232'|'33'|'custom': Array<{name:string}|null> }` — current seat arrangements
- `savedLists: Map<listName, {students, fixedSeats, separatedPairs}>` — persisted class lists
- `customLayoutConfig: { rows, groupSizes }` — configuration for the custom tab
- `darkMode: boolean`, `colorTheme: string`, `activeTab: string`

### Seating Algorithm (`SeatingGenerator`)

Layout types (`222`, `232`, `33`, `custom`) each define `{ groupSizes, rows, seatsPerRow }`. Seats are addressed by flat index: `row * seatsPerRow + col`.

Generation flow:
1. Place fixed-seat students first
2. Fisher-Yates shuffle the remaining students into empty seats
3. Check for separation violations using `getNeighbors()` — neighbors are only within the same visual group (not across the aisle gap between groups)
4. Attempt to swap-fix violations, up to 500 total attempts
5. Warn via notification if constraints cannot be fully satisfied

`getNeighbors()` computes adjacency group-aware: left/right/diagonal neighbors only connect seats within the same `groupSizes` block in a row.

### Theming

CSS custom properties are set on `:root` and `[data-theme]` selectors. The `data-theme` attribute on `<html>` controls the color theme (`blue`/`red`/`green`/`yellow`). Dark mode adds the `dark-mode` class to `<body>`.
