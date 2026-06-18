# Mobile UI Smoothness & Load Performance — Optimization Plan

After re-reading `Index.tsx`, `HeroSection.tsx`, `Tree3DScene.tsx`, `LiveActivityBar.tsx`, `HeroHeadline.tsx`, `TopDonorsPanel.tsx`, `LazyOnView.tsx`, and `use-mobile.tsx`, here is what is still costing mobile users smoothness — and the targeted fixes I will apply. Nothing below changes business logic, copy, routes, or data flow; this is presentation/perf only.

## Issues identified

1. **3D canvas is too heavy on mobile.** `Tree3DScene` still runs with `antialias: true`, `PCFSoftShadowMap` shadows, `ACESFilmicToneMapping`, 2000 leaves, 2 directional lights + hemisphere + ambient + extra orange dir light, and `Environment preset="forest"` PMREM generation. Each one is fine alone; combined on a 3.75× DPR phone they cause sustained jank and the very blinking the user is reporting.

2. **Frame loop keeps running while user scrolls past the hero.** `inView` is wired in, but the 200ms scroll debounce means every momentum-scroll keeps the GPU busy. We can also drop frameloop to `'demand'` whenever the hero is < 25% visible, and fully unmount the Canvas when scrolled well past it.

3. **`Index.tsx` double-reserves vertical space.** Every section is wrapped in both a `<Suspense fallback={<Fallback h=N>}>` *and* a `<LazyOnView minHeight=N>`. That stacks 3800 px of empty placeholders on first paint, inflating scroll height, hurting CLS scoring, and making the page feel "empty then pops". One reservation is enough.

4. **`useIsMobile()` starts as `undefined`** in `LiveActivityBar`, so the first paint always renders the desktop branch (with `animate-pulse`, `animate-ping`, `backdrop-blur`, marquee) for ~1 frame on a phone before swapping. That is a visible flash. `HeroHeadline` was already fixed locally — apply the same synchronous-init pattern in the shared hook so every consumer benefits.

5. **`LiveActivityBar` re-renders the whole bar every 3.5 s** because three state setters fire together; the donation card is not memoised, so the surrounding flex container reflows. Split state and memoise the inner card.

6. **No `content-visibility` on off-screen sections.** Adding `content-visibility: auto` with a `contain-intrinsic-size` to lazy sections lets the browser skip layout/paint until they scroll in — large win on mobile.

7. **Tree3D wrapper has no `contain` hint.** The Canvas changes pixels constantly; without `contain: strict` the browser may re-evaluate ancestors. Adds GPU/CPU cost on every frame.

8. **Hero overlays use heavy `backdrop-blur-xl` (TopDonorsPanel).** It's already `hidden md:block` so mobile is fine — leave as-is. Noted to confirm no regression.

## Changes to apply

### A. `Tree3DScene.tsx` — mobile-tuned renderer
- Set `antialias: false` on mobile (DPR cap 1.5 already gives a clean look; AA is the single biggest fragment-shader cost).
- Skip `shadows` entirely on mobile (`shadows={!isMobile && { type: PCFSoftShadowMap }}`); remove `castShadow` paths via the `isMobile` flag already threaded into `DayNightLights`.
- Drop `toneMapping` to `NoToneMapping` on mobile (cheaper, visually negligible at hero scale with current palette).
- Reduce `leafCount` mobile 2000 → 1200, `plantCap` 12 → 8, `AmbientBirds count` 2 → 1.
- Remove the extra `directionalLight position={[0,4,-8]}` on mobile (kept on desktop for rim light).
- Wrap the outer `<div ref={wrapRef}>` with inline style `contain: 'strict', willChange: 'transform'`.
- Use a tighter scroll-pause threshold: switch frameloop to `'demand'` whenever `window.scrollY > window.innerHeight * 0.25` on mobile (not only while actively scrolling). Add a `scroll` listener with rAF throttling and update an `aboveFold` boolean.
- Fully unmount the Canvas (`mounted=false`) when `scrollY > window.innerHeight * 1.5`, remount when user scrolls back near the top. Keeps the gradient fallback visible so layout doesn't shift.

### B. `Index.tsx` — collapse double placeholders
- Remove the `<Suspense fallback={<Fallback h=…>}>` wrappers; rely on `LazyOnView`'s built-in `minHeight` only. Where `Suspense` is still needed for the lazy import boundary, use `fallback={null}` (the surrounding `LazyOnView` already reserves space).
- Add `style={{ contentVisibility: 'auto', containIntrinsicSize: '<h>px' }}` to each `LazyOnView` placeholder div via a new `contentVisibilityAuto` prop on `LazyOnView`.

### C. `LazyOnView.tsx` — `content-visibility` support
- Add optional `contentVisibilityAuto?: boolean` prop. When true, also set `contentVisibility: 'auto'` and `containIntrinsicSize` on the wrapper. Default off to avoid surprising existing call sites; opt-in from `Index.tsx`.

### D. `use-mobile.tsx` — synchronous initial value
- Initialise state with `window.innerWidth < MOBILE_BREAKPOINT` instead of `undefined`, matching the local fix already in `HeroHeadline`. Removes the first-frame desktop flash for every consumer (`LiveActivityBar` chief among them).

### E. `LiveActivityBar.tsx` — fewer reflows
- Extract the donation pill into a memoised sub-component keyed by `currentDonation.id` so the stats row and marquee don't re-render every 3.5 s.
- Keep the existing scroll-pause logic; no behaviour change.

## Out of scope (intentionally)
- No change to copy, donation flow, auth, or any non-hero route.
- No new dependencies.
- Desktop visuals unchanged (AA, shadows, tone mapping, full leaf count all preserved via the `isMobile` branch).

## Verification
After implementing, I will:
1. Open the preview at 390×844, scroll through the landing page, screenshot the hero + the area right below to confirm no blink.
2. Run `browser--performance_profile` to confirm LCP / INP improvements on mobile viewport.
3. Visually confirm desktop hero looks identical (shadows, AA, lighting all intact at ≥ 768 px).
