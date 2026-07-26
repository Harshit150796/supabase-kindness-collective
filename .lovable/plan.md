## Goal

The hero tree currently waits for `window.load` + `requestIdleCallback` (up to ~1.8s) before it mounts, so visitors see a flat gradient first and then a late pop-in. Make the tree start loading the moment the page opens, and keep the rest of the page loading in one smooth pass. No changes to leaves, materials, lighting, camera, or any 3D quality settings.

## Changes

**1. `src/components/landing/HeroSection.tsx` — remove the idle gate**
- Drop the `treeReady` state, the `load` listener, and the `requestIdleCallback`/`setTimeout` delay.
- Keep the WebGL/bot capability check (`canRender3D()`), evaluated once on mount so bots and non-WebGL clients still get the gradient only.
- Mount `<Tree3DScene />` immediately inside the existing `Tree3DErrorBoundary` + `Suspense`.
- Keep the gradient layer painted underneath as the instant first frame and the Suspense fallback, so there is no blank flash and no layout shift while the GLB streams in.
- Add a short CSS opacity fade on the canvas wrapper so the tree eases in rather than snapping (purely presentational, no 3D changes).

**2. `index.html` — upgrade the model hint**
- Change the tree GLB hint from `rel="prefetch"` (low priority, idle-time) to `rel="preload" as="fetch" crossorigin` so the model download starts in parallel with the JS bundle instead of after it.
- Update the stale comment that references "becomes idle".

**3. `src/pages/Index.tsx` — smoother single-pass load below the fold**
- Keep the lazy sections, but raise the `LazyOnView` `rootMargin` from the default `300px` to ~`900px` so the next section's chunk is fetched well before it scrolls into view. This removes the visible "section appears late" stutter without loading the entire page up front.
- No changes to the section list, order, or reserved heights (CLS stays as-is).

## Notes / trade-offs

- The three.js chunk is already a single bundle (`manualChunks.three` in `vite.config.ts`), so mounting early means one extra parallel download rather than a waterfall.
- Mounting the canvas immediately shifts some Three.js parse work into initial load. On low-end mobile this can add a small delay to first interaction; the error boundary and gradient fallback keep the page usable and visually complete either way.
- Explicitly untouched: `Tree.tsx`, `FoliageInstanced.tsx`, `CouponFruit.tsx`, materials, shadows, DPR, and all scene quality settings.
