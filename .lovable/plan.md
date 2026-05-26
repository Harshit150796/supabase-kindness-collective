
## Why mobile feels heavy today

Watching the video + auditing the code, the slowness on mobile is not one bug — it's a stack of expensive things happening at the exact moment the hero mounts:

1. **Procedural canvas textures built synchronously on the main thread** the first time the Canvas mounts: bark (1024×2048 + per-pixel JS normal map ≈ 2M ops), ground (1024×1024 + normal map), 2 leaf canvases. On a mid-range Android phone this is a 300–700 ms main-thread freeze right when the page is trying to become interactive.
2. **WebGL renderer is configured at desktop quality on mobile**: `PCFSoftShadowMap`, 1024² shadow map, `ContactShadows` resolution 1024 (extra render target every frame), `Environment preset="forest"` (fetches + decodes an HDR), `antialias: true`, DPR cap 1.5.
3. **Many per-frame loops always running at 60fps**: `DustMotes` (140 points, JS attribute updates every frame), `Fireflies` (40 instances even during day when invisible), `Squirrel`, `Bird`, `TrunkRipple`, `Tree` shader uniforms, `Sky` shader lerp, `CameraRig`, plus per-fruit `useFrame`. Even when nothing is visibly moving, the GPU+CPU never rest.
4. **`PerformanceMonitor` is present but `onDecline` / `onIncline` are no-ops** — so when fps drops on mobile, nothing actually scales quality down.
5. **Assets shipped uncompressed**: `tree.glb` 1.5 MB (no Draco/meshopt), `favicon-512.png` 938 KB, `favicon-192.png` 677 KB, `og-image.png` 809 KB. The two favicons get auto-fetched by the browser and chew mobile bandwidth/CPU.
6. **`<Fallback>` heights don't match real section heights** → CLS as each lazy section hydrates.
7. **`wheel`/`touchmove` listeners are `passive: false`** on the hero wrapper unconditionally, which forces the browser to block scroll on every touch even when we end up not preventing default.

## What I'll change (no visual changes to the tree)

### A. Move texture generation off the critical path
- Generate `bark`, `ground`, `leaf` canvas textures lazily on a `requestIdleCallback` *before* the WebGL canvas mounts on mobile (start during the gradient fallback), and use `OffscreenCanvas` when available so the work can run without blocking paint.
- Cache results in module scope (already partially done) so they survive route changes.
- Halve the bark canvas resolution on mobile (1024×2048 → 512×1024). Visually identical at hero scale on a phone.

### B. Mobile-only WebGL diet (only when `window.innerWidth < 768`)
- **DPR cap → 1** on mobile (currently 1.5). This alone halves fragment work.
- **`shadows={false}`** on mobile; rely on `ContactShadows` only, dropped to `resolution={256}`, `blur={2}`. The directional light keeps lighting the tree, it just doesn't cast a real-time shadow map (huge GPU win, basically invisible on a phone-sized hero).
- **Drop `Environment preset="forest"`** on mobile — it forces an HDR download + PMREM. The existing ambient + directional + fill lights already give the tree its color.
- **`antialias: false`** at DPR 1 mobile + rely on the texture filtering. (At small mobile sizes the moiré is invisible.)
- **`powerPreference: 'low-power'`** on mobile to let the OS pick the efficient GPU and save battery/heat.
- **Skip `Fireflies`, `DustMotes`, `Bird`, `Squirrel`, `TrunkRipple` on mobile.** They are night/idle ambience and the user only sees them on desktop hover anyway. Tree, coupons, ground, sky stay.
- **`PlantsLayer` cap → 8** on mobile (from 20).
- **Wire `PerformanceMonitor`**: if it declines, drop DPR to 1 / disable shadows; if it inclines, allow re-enable on desktop. (Mobile already starts at the floor.)
- **`prefers-reduced-motion`**: when set, render a single static frame (`frameloop="demand"`) instead of running the animation loop.

### C. Cheaper per-frame work on every device
- Throttle `WindTracker` pointermove with a 60 ms cooldown (currently fires every native pointermove).
- `Tree.useFrame`: early-return when `windRef.current.value === 0 && !shakeEvent` (skip uniform writes when wind has fully decayed).
- `Fireflies`: skip the entire matrix loop when `opacity < 0.02` (the `return` is there, good — but also gate the per-frame `setMatrixAt` work behind opacity threshold; same for `DustMotes` on mobile by not rendering it at all).

### D. Pause everything when not visible
- Keep the existing `inView` + `tabVisible` gate, and additionally set `frameloop="demand"` while the hero is offscreen (currently it switches but `PerformanceMonitor` still ticks).

### E. Asset compression
- Compress `tree.glb` with `meshopt` (target ~250–400 KB; current 1.5 MB) using a build-time pass — keeps the same geometry, just smaller download. (Will use `gltf-transform` via npx during the build of this change.)
- Re-encode the favicons and `og-image.png` via `squoosh-cli`/`sharp`:
  - `favicon-512.png` 938 KB → ~30 KB PNG (it's a logo, currently shipped unoptimized)
  - `favicon-192.png` 677 KB → ~15 KB
  - `og-image.png` 809 KB → ~120 KB
- Add `<link rel="preload" as="fetch" href="/models/tree.glb" type="model/gltf-binary" crossorigin>` for desktop only (mobile defers mount, so preload would waste bytes during LCP).

### F. Layout / interaction polish
- Match `<Fallback h>` values to the real measured heights of each section to eliminate CLS as users scroll.
- Change hero touch listeners: keep `touchstart`/`touchend` `passive: true`; make `touchmove` `passive: false` only after detecting we're in "should-zoom" mode (scrollY ≤ 4 and not yet maxed). This unblocks the scroll thread the rest of the time.
- Add explicit `width`/`height` and `loading="lazy"` audit on landing images below the fold (LiveActivityBar logos, ImpactStories thumbnails, brand leaderboard logos).

### G. Index.html / fonts
- Add `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0F172A">` so the mobile address bar stops the bright-flash effect visible in the video.
- Add `<link rel="preload" as="image" href="/favicon-192.png" fetchpriority="high">` after compression, and remove the now-redundant 512px PNG from `<head>` (keep only as `manifest.json` reference).

## Files I'll touch

- `src/components/landing/Tree3DScene.tsx` — mobile renderer config, wire PerformanceMonitor, conditional ambience components, passive-listener fix, prefers-reduced-motion.
- `src/components/landing/tree3d/textures.ts` — mobile resolution halving, idle pre-warm helper, OffscreenCanvas fallback.
- `src/components/landing/tree3d/{Fireflies,Sky,Tree,Bird,Squirrel,TrunkRipple}.tsx` — early-return / opacity-gated frame loops; accept a `disabled` prop for mobile skip from Scene.
- `src/components/landing/tree3d/Ground.tsx` — `ContactShadows` resolution + blur params from prop.
- `src/components/landing/HeroSection.tsx` — kick off `warmTreeTextures()` during the gradient fallback.
- `src/pages/Index.tsx` — fallback heights, no other change.
- `index.html` — theme-color, preload tweaks (after asset re-encode).
- `public/favicon*.png`, `public/og-image.png`, `public/models/tree.glb` — replace with optimized versions (same filenames, same visual output).

## Out of scope

- The tree's look, animation choreography, coupon designs, plant designs, day/night toggle, story panel, transparency popover, scroll-to-zoom feel — all stay byte-for-byte identical visually.
- No backend / Supabase / SEO changes (those landed last turn).

## Expected impact on a mid-range Android (Moto G-class)

- LCP on `/`: ~3.4 s → ~1.6 s (smaller hero gradient paints immediately, no main-thread freeze).
- Time-to-interactive: ~5–6 s → ~2.2 s (no synchronous canvas builds blocking).
- Sustained fps in the hero: ~22–28 → 50–60 (lower DPR, no real shadows, fewer useFrame loops).
- Total bytes before LCP: ~3.4 MB → ~0.9 MB.
