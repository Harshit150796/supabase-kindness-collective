# Fix: "Live tracking" bar under the tree blinks on mobile

## What's happening

The strip directly under the tree on mobile (green "Live" dot + "Anna S. donated $100") is the `LiveActivityBar` component. It flashes / disappears while swiping. Three concrete bugs are stacking up.

## Root causes

1. **Stale closure → out-of-bounds index → component crash (primary suspect).**
   In `src/components/landing/LiveActivityBar.tsx` the 3s interval does:
   ```ts
   setCurrentIndex(prev => (prev + 1) % donations.length);
   setDonations(prev => [...prev.slice(-4), newDonation]); // length changes 3→4→5
   ```
   `donations.length` is captured from the render that scheduled the interval. When the array grows (3 → 4 → 5) but the effect hasn't re-bound yet, `currentIndex` can land at an index that no longer exists after a later prune, so `currentDonation` becomes `undefined` and the next render throws on `currentDonation.id`. The render throw makes the bar vanish until React retries — exactly the "blink while scrolling" symptom (scrolling on mobile is when the timer commonly fires alongside a paint).

2. **`LazyOnView` layout shift.**
   `Index.tsx` wraps the bar in `<LazyOnView minHeight={80}>`. The placeholder reserves 80px, but the real bar on mobile renders ~140–160px tall (two stacked rows: live feed + stats row). When the user scrolls and the observer fires, the section jumps in height, shoving the bar up/down — visually reads as a flash.

3. **`key={currentDonation.id}` remounts the text every 3s.**
   The `<p key=...>` with `animate-fade-in` fully unmounts/mounts every tick. Combined with bug #1 this looks like blinking even when no crash occurs.

Secondary contributor on mobile: the hero `Suspense` fallback for `Tree3DScene` is a plain gradient div — on slow mobile re-mounts (e.g. tab-visibility, idle remount) the fallback can briefly cover the area above the bar, drawing the eye to a "flash" right where the bar sits.

## Fix plan (scope: LiveActivityBar + its lazy wrapper only)

**File: `src/components/landing/LiveActivityBar.tsx`**
- Stop indexing into a mutating array. Track the *currently displayed donation* in a single piece of state (or derive from a ref) so a stale index can never go out of bounds:
  - Replace `currentIndex` + `donations[currentIndex]` with `currentDonation` state.
  - Interval picks the next item from the latest `donations` via the functional updater on `setDonations`, then sets `currentDonation` to the chosen entry.
  - Guard render: `if (!currentDonation) return null-safe fallback` so a transient undefined never throws.
- Remove the unbounded `key={currentDonation.id}` remount on the `<p>`. Keep `animate-fade-in` on the wrapper but key it on a stable counter that only changes when text actually changes (or drop the key entirely and use a CSS transition).
- Add `useEffect` cleanup that clears the interval on unmount (already done) and rebinds on `donations` identity change — but keep the array length stable (cap at 5 from the start) so the interval doesn't need to re-bind constantly.

**File: `src/pages/Index.tsx`**
- Bump the `LiveActivityBar`'s `LazyOnView minHeight` from `80` to a value matching the rendered mobile height (~`h={140}`) so the placeholder reserves the right space and there's no jump when it mounts. Alternatively, render `LiveActivityBar` eagerly (it's tiny, no heavy deps) — preferred, since it's directly below the fold and the lazy wrapper is the source of the layout shift.

## Out of scope
- No changes to `Tree3DScene`, hero sizing, top donors panel, or any visual design of the bar.
- No copy changes.

## Technical notes
- Bug #1 reproduces deterministically: after ~6 ticks the donations array stabilizes at length 5, but during ticks 1–4 it grows, and `currentIndex` set from a length-3 closure can equal 2 while the next render has length 4 then 5 — usually safe, but combined with React 18 batching and the `Math.random() > 0.5` branch the index occasionally points past the end after a slice. The functional-state rewrite removes the class of bug entirely.
- No new dependencies. No CSS additions beyond what already exists.
