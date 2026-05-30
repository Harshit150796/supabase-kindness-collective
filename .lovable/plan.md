
## Goal
Shrink and simplify the "Emma L. donated $75" badge that floats above each landed coupon so it stops dominating the hero on mobile. No other visuals change.

## Scope
Single file: `src/components/landing/tree3d/CouponFruit.tsx` (the `showLabel` block, lines ~317–474).

## Changes

### 1. Smaller, simpler badge
Replace the current two-line card (avatar circle + name + amount, gold border, blur, big shadow) with a single compact pill:

`Emma L. · $75`

- Remove the 28px gradient avatar circle.
- Remove `backdropFilter: blur(8px)` (also helps mobile scroll perf).
- Thinner border: `1px solid rgba(212,160,23,0.5)` instead of `1.5px solid #D4A017`.
- Smaller padding: `6px 10px` (was `10px 16px`).
- Smaller font: `11px` name, `11px` amount inline (was 13px + 11px stacked).
- Softer shadow: `0 4px 12px rgba(0,0,0,0.12)`.
- Solid white background (no transparency).
- Truncate name to 14 chars (was 18).

### 2. Scale down in 3D
- `distanceFactor={8}` → `distanceFactor={5}`. This is the main thing that makes it huge on mobile.

### 3. Shorter lifetime + fade out
- Total lifetime: 2.8s → 1.8s.
- Last 0.5s: opacity fades from 1 → 0 (computed from `landTime`).

### 4. Mobile concurrency cap
- On viewports `< 768px`, never show more than 2 badges at once.
- Implementation: module-level `Set<number>` of currently-visible label indices. A new label only renders if either (a) not mobile, or (b) the set has fewer than 2 entries, or (c) this index is already in the set. `useEffect` adds/removes the index on show/hide.

## Not changed
- Coupon geometry, texture, glow, sparkle, fall physics, regrow — all untouched.
- Tap behavior (opens `RecipientStoryPanel`) — untouched.
- `LiveActivityBar`, tree, lighting, fireflies — untouched.

## Verification
After the edit, check the preview on the mobile viewport: badges should be roughly half the previous footprint, no blur, and at most 2 visible at a time; they should fade out smoothly just before disappearing.
