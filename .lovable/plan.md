# Fix mobile blurriness on the landing page

## Root cause

The mobile hero looks blurry and unstable because we are running the **full desktop 3D pipeline on phones** while also rendering the canvas at a lower resolution than the device's actual pixel ratio. Three things combine:

1. **`Tree3DScene.tsx` hard-codes `isMobile = false`.** Phones are forced to render 7,000 leaves, 4096×4096 shadow maps, antialiasing, ACES tone mapping, CSS3D `<Html transform>` coupon faces, fireflies, ambient birds, etc. The GPU can't keep up → dropped frames → the browser smears between frames, which reads as "blur".
2. **DPR is capped at 2 while the device reports dpr ≈ 3.75.** WebGL renders at 2× and the browser bilinearly upscales to 3.75× — that upscale is literally a blur filter on the canvas.
3. **CSS3D `<Html transform>` coupon overlays** (in `CouponFruit.tsx`) are composited by the browser as separate layers over WebGL. On mobile they get downsampled/repainted aggressively and look soft, and they jitter against the 3D scene.

Secondary contributors: `backdrop-blur` pills on hero CTAs, ACES tone mapping on a low-power GPU, fog re-tinting every frame.

## What to change

### 1. `src/components/landing/Tree3DScene.tsx` — re-enable real mobile mode
- Replace `const isMobile = false;` with `const isMobile = useIsMobile();` (import from `@/hooks/use-mobile`).
- Raise the mobile DPR cap from 2 → **3** so the canvas matches the screen and stops being upscaled. Keep desktop at 2.
- On mobile:
  - `antialias: false` (DPR 3 already gives effective supersampling)
  - `shadows={false}` on the `<Canvas>` and skip `castShadow` / `shadow-mapSize` (huge win)
  - `toneMapping: THREE.NoToneMapping`, `toneMappingExposure: 1`
  - `frameloop="demand"` when off-screen; keep `"always"` when in view
  - Drop `<directionalLight position={[0,4,-8]}>` rim light, keep the hemisphere fill
  - `<AmbientBirds count={2}>`, drop `<Fireflies />` and `<TrunkRipple />`
  - `leafCount = 2500`, `plantCap = 10`
  - Fog: `[ '#DCE6D5', 25, 70 ]`

### 2. `src/components/landing/tree3d/CouponFruit.tsx` — no CSS3D on mobile
- Accept the existing `isMobile` prop (already passed) and when true, render the coupon face as a **canvas texture on the mesh** (the existing `drawCouponTexture` path) instead of the `<Html transform>` DOM face. CSS3D over WebGL is the single biggest source of "blurry, jittery" coupons on phones.

### 3. `src/components/landing/hero/HeroHeadline.tsx` — drop backdrop blur on the CTA row
- Remove `md:backdrop-blur-sm` and `md:bg-background/70` from the button wrapper and the outline button. Use a solid `bg-background` pill. `backdrop-blur` re-samples the animated canvas underneath every frame and is the second-biggest blur source on mobile.

### 4. `src/components/landing/HeroSection.tsx` — stop fading the canvas in
- The 700 ms opacity fade on the canvas wrapper triggers a compositor blur pass during the transition. Render the canvas with `opacity: 1` once `treeReady` is true (no transition), keep the gradient underneath as the pre-mount fallback.

### 5. `src/components/landing/tree3d/Ground.tsx` and `Sky.tsx` — lighter mobile path
- When `isMobile`, skip the reflective floor pass in `Ground` (use a plain `MeshStandardMaterial`) and use a static gradient sky instead of the animated shader. These already accept an `isMobile` prop; just make sure both branches are wired.

## Why this fixes the blur

- Matching DPR to the device removes the canvas upscale → edges become crisp.
- Cutting shadows + AA + tone mapping lets the GPU hit 60 fps → no inter-frame smearing.
- Replacing CSS3D coupon faces with a baked texture removes the layer mismatch that makes coupons look soft.
- Removing `backdrop-blur` over an animated canvas removes a per-frame re-sample of the hero.

## Out of scope
No changes to copy, routes, business logic, donation flow, or any non-hero section. This is a presentation-layer perf/quality fix only.

## Verification
After implementing, open the preview on the mobile viewport and confirm: coupons read sharply, text on the CTA pill is crisp, the tree no longer "breathes" blur during idle, and the canvas resolution visibly matches the surrounding UI.
