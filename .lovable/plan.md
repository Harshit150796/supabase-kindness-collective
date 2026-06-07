## What's wrong on mobile

Looking at `src/components/landing/HeroSection.tsx`, `src/components/landing/Tree3DScene.tsx`, and the screenshot:

1. **Tree takes over the screen.** Hero section is `h-[60vh] md:h-[88vh]`. The camera sits at `(0, 4.0, 13)` with FOV `38` regardless of device, so on a narrow phone viewport the tree fills the frame edge-to-edge and pushes coupon cards over the headline area.
2. **Layout overlap / "disappearing text".** Coupon fruits float at canopy height and visually overlap the `Donate now` / `How it works` buttons because the headline sits at `top-4` while the canopy is centered vertically in a short 60vh container. The "CouponDonation is Transparent" rotating label is `hidden md:flex` — that's why it never shows on mobile.
3. **Random reloading / flicker.** Three contributors:
   - `frameloop` flips between `'always'` and `'demand'` from an `IntersectionObserver` on the wrapper. On mobile address-bar resize and lazy section hydration below the fold, the hero briefly leaves the viewport and the canvas freezes, then resumes — looks like the scene "reloads".
   - `PerformanceMonitor` is wired with empty `onDecline`/`onIncline`, but drei still adapts DPR internally, causing the canvas to repaint at a different resolution mid-session (visible as a flash / re-clarify).
   - `mounted` is gated on `requestIdleCallback` on mobile, so the gradient fallback shows for up to 800ms before the canvas swaps in — on slower phones this looks like a reload every time the page re-hydrates a lazy chunk above the fold.
4. **Heavy for the device.** 2800 leaves, shadow map 1024 with PCFSoft, `Environment preset="forest"` (downloads HDR), ambient birds, fireflies, and full orbit controls all run on mobile.

## Changes

### 1. `src/components/landing/HeroSection.tsx`
- Reduce mobile hero height from `h-[60vh]` to `h-[72vh]` so the scene has vertical room and the tree no longer feels like it dominates a short box. Keep `md:h-[88vh]`.

### 2. `src/components/landing/Tree3DScene.tsx` — camera + framing
- Use a mobile-tuned camera: position `(0, 4.4, 16)` and FOV `32` on mobile (keeps `(0, 4.0, 13)` / FOV `38` on desktop). Pull `TARGET` slightly up to `(0, 3.6, 0)` on mobile so the canopy centers without the trunk eating the lower half.
- Raise `OrbitControls` `minDistance` to `12` on mobile so accidental pinch can't push the tree into the camera.
- This is the "reduce the size by very little" the user asked for — the tree visually shrinks ~15–20% on phones without changing desktop.

### 3. `src/components/landing/Tree3DScene.tsx` — stability fixes
- Remove the `frameloop` toggle from `IntersectionObserver`; keep `frameloop="always"` while the canvas is mounted, and instead pause only on `document.hidden` (already tracked via `tabVisible`). Stops the mid-page freeze/resume flash.
- Drop `PerformanceMonitor` (or pass a stable no-op factor) so drei doesn't auto-rescale DPR mid-session.
- On mobile, mount the canvas immediately instead of waiting on `requestIdleCallback` — the idle defer is what creates the "flash of gradient then tree" reload feeling. Keep the idle defer only when `navigator.connection?.saveData` is true.
- Add a `key` derived from a one-time `isMobile` capture so a viewport rotation does NOT remount the canvas. (Today the `useState(() => window.innerWidth < 768)` is fine, but we'll also add an explicit guard so address-bar resize never causes a remount.)

### 4. `src/components/landing/Tree3DScene.tsx` — mobile perf trim
- `leafCount`: 2800 → 2000 on mobile.
- `plantCap`: 20 → 12 on mobile.
- `AmbientBirds count`: 4 → 2 on mobile.
- Disable `Fireflies` on mobile (they're the bright dots in the screenshot — also a frame cost).
- Replace `Environment preset="forest"` on mobile with a cheap `<hemisphereLight>` boost — saves the HDR download and a cubemap render.
- Shadow map already drops to 1024 on mobile; lower to 512 and `shadow-blurSamples={2}` to reduce per-frame cost.

### 5. `src/components/landing/hero/HeroHeadline.tsx`
- Show the "CouponDonation is Transparent" rotating label on mobile too (remove `hidden md:flex`) so the headline area has clear content above the canopy.
- Add a subtle `bg-background/60 backdrop-blur-sm rounded-full px-3 py-2` wrapper around the buttons on mobile so they remain legible against the canopy and don't appear to "disappear" behind leaves.

### 6. `src/components/landing/hero/TopDonorsPanel.tsx`
- No change. Already `hidden md:block`.

## Technical notes

- The `frameloop="demand"` switch during scroll-driven hydration is the most likely root cause of the "random loading" report. With `lazy()` + `LazyOnView` below the fold (see `src/pages/Index.tsx`), each new section that hydrates pushes layout and briefly changes the hero's intersection ratio. Keeping `frameloop="always"` while `tabVisible` is true removes that visible stutter without raising battery cost meaningfully (tab-hidden pause still applies).
- We do NOT change the GLB model, lighting math, or interaction handlers — only mobile-conditional values and the stability toggles above.
- Out of scope: redesigning the hero, changing copy, touching `DonationFlow` or below-the-fold sections, or modifying the privacy banner.

## Files to edit
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/Tree3DScene.tsx`
- `src/components/landing/hero/HeroHeadline.tsx`
