User wants: scroll inside hero = zoom tree out (good UX hint that it's interactive). Once tree fully zoomed out → further scroll lets the page scroll normally. Same for mobile swipe-up.

## Plan: Scroll-to-Zoom-Then-Release

### Behavior

1. User enters hero, scrolls down (or swipes up on mobile).
2. Page scroll is **intercepted** by the hero — instead of scrolling, the camera zooms out from `distance=13` → `distance=17` (max).
3. Once camera reaches max zoom **AND** user keeps scrolling in same direction → release: page scrolls normally.
4. Reverse: when scrolling back up and hero is at top of viewport, intercept again → zoom in from 17 → 13, then release.

This is the standard "sticky pinned scroll" pattern (used by Apple product pages).

### Implementation

`**Tree3DScene.tsx`:**

- Add a `zoomProgress` ref (0 = fully zoomed in / distance 13, 1 = fully zoomed out / distance 17).
- Add `wheel` + `touchstart`/`touchmove` listeners on the hero wrapper div.
- On wheel/swipe:
  - If hero is pinned at top of viewport AND (`deltaY > 0` AND `zoomProgress < 1`) OR (`deltaY < 0` AND `zoomProgress > 0` AND `window.scrollY === 0`): `preventDefault()`, increment/decrement `zoomProgress` by `deltaY * sensitivity`, clamp 0–1.
  - Else: don't prevent — page scrolls normally.
- In `useFrame`, lerp camera distance toward `13 + zoomProgress * 4` (smooth, dampingFactor 0.1).
- For touch: track `touchStartY`, compute delta on `touchmove`, same logic. Use `{ passive: false }` so `preventDefault` works.

&nbsp;

### Edge cases handled

- User scrolls up from below hero → page scrolls normally up to hero, then zoom-in intercept kicks in once `scrollY === 0`.
- Fast wheel flicks: accumulate delta with damping so it doesn't snap.
- Mobile: vertical swipe = zoom (intercepted) until fully zoomed, then `touchmove` stops being preventDefaulted → native scroll takes over mid-gesture (browsers handle this gracefully).
- Bonus: also fixes the original "can't scroll past hero" issue because release is built into the design.

### Files changed

- `src/components/landing/Tree3DScene.tsx` — add scroll-zoom listener, drive camera distance from `zoomProgress`, remove `enableZoom` from OrbitControls
- (Also fix the still-broken provider scope bug: move `RecipientStoryPanel` + `TransparencyPopover` inside `InteractionProvider`)

### Honest caveats

- `wheel` interception with `preventDefault` is a known trade-off — trackpad users may feel the brief "stickiness." Sensitivity tuning will need 1 follow-up pass after you test.
- On mobile, the gesture handoff (zoom → release to scroll) requires lifting and re-swiping in some browsers (iOS Safari especially). Best we can do — this is standard web behavior.
- Desktop click-drag rotate still works alongside scroll-zoom (different input channels).