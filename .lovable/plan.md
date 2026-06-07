# Mobile hero stability fix

## Root causes (verified in code)

1. **Scroll-zoom interceptor hijacks vertical swipes on mobile.**
   `Tree3DScene.tsx` attaches a `touchmove` listener with `passive: false` on the hero wrapper. While `window.scrollY <= 4` and `zoomProgress` is between 0 and 1, it calls `e.preventDefault()` on every swipe — so the browser can't scroll the page. The page intermittently stalls then jumps when the zoom hits 0 or 1, which is exactly the "blinks / texts disappear and reappear when I swipe" symptom.

2. **Parallax boost fires on every touch.**
   `<Canvas onPointerDown={() => setParallaxBoost(true)} ...>` triggers on the very first touch of any swipe. The camera then drifts using `mouse.x/y` from R3F, which on touch devices keeps the last known position — producing a visible lurch each time the user puts a finger down.

3. **WindTracker reacts to touch-driven `pointermove`.**
   It bumps wind/leaf sway on every swipe, so leaves shake while scrolling.

4. **`frameloop` flips between `always` and `demand`** based on IntersectionObserver. As the hero scrolls out and back in (during the scroll fight), the canvas pauses/resumes — perceived as flicker.

5. **HeroHeadline rotating word remounts every 2.8s with a slide-in animation.** On a narrow viewport this text sits over the tree and visibly "pops" — reads as blinking.

6. **Hero height `h-[72vh]` on mobile** still covers most of small phones, leaving very little room before the LiveActivityBar — combined with #1 the bar appears to vanish.

## Changes

### `src/components/landing/Tree3DScene.tsx`
- **Disable the touch zoom-intercept entirely on mobile.** Keep wheel-based zoom for desktop only. Mobile gets native, uninterrupted vertical scroll. (Wrap the `touchstart/move/end` listeners in `if (!isMobile) return;` inside the effect.)
- **Skip `onPointerDown`/`onPointerUp` parallax boost on touch events.** In the Canvas handlers, early-return when `e.pointerType !== 'mouse'`.
- Pass `isMobile` to `Tree3DInner` for the above check (already passed).
- **Keep `frameloop="always"` while `tabVisible`.** Remove the `inView` gating so partial scroll doesn't toggle the loop. (Tab-hidden still pauses.)
- Reduce hero coverage: change `HeroSection` height from `h-[72vh]` to `h-[62vh]` on mobile (kept `md:h-[88vh]`).

### `src/components/landing/Tree3DScene.tsx` — `WindTracker`
- Filter `pointermove` to mouse only: `if (e.pointerType !== 'mouse') return;`. Leaves stop shaking during swipes.

### `src/components/landing/hero/HeroHeadline.tsx`
- On mobile, render the rotating word statically (pick one, no interval, no slide-in animation). Detect via `useIsMobile()`. Desktop behavior unchanged. Eliminates the 2.8s "blink" over the tree.

### `src/components/landing/HeroSection.tsx`
- Change `h-[72vh]` → `h-[62vh]` per above.

## Out of scope

- No changes to LiveActivityBar (already fixed last round), TopDonorsPanel, 3D model, lighting, leaf counts, or DPR caps.
- No new dependencies. No copy or visual-design changes beyond the hero height reduction.

## Technical notes

- The touch-zoom feature isn't useful on mobile anyway — users expect vertical swipes to scroll, not to dolly the camera. Removing it on mobile is the single biggest stability win.
- Filtering parallax/wind to `pointerType === 'mouse'` is the standard pattern for hover-only effects and is supported in all evergreen browsers.
- Keeping `frameloop="always"` adds negligible cost (already capped by DPR 1.5 + reduced leaves/plants/shadows on mobile) and prevents the pause/resume hitch.
