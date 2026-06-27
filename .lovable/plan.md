# Revive the Mobile Landscape: Vibrant, Alive, Birds Back

## Goal
Restore the lush, vibrant, "alive" feel of the hero tree/landscape on mobile — bring back flying birds, richer colors, sharper leaves, and remove the muted/blurry quality — while keeping scroll smooth and avoiding the earlier blink/jitter issues.

## Root causes of the current dull/blurry mobile look
From the recent mobile-optimization passes, several quality features were stripped on mobile and never restored:

1. **No birds on mobile** — `Bird` and `AmbientBirds` are gated behind `!isMobile` in `Tree3DScene.tsx`.
2. **No environment lighting** — `<Environment preset="forest" />` is desktop-only, so leaves/coupons lose their natural reflections and look flat/dull.
3. **No fireflies / trunk ripple** — both disabled on mobile, removing "alive" micro-motion.
4. **Tone mapping disabled** on mobile (`NoToneMapping`) — colors render flat and washed out instead of the filmic warmth used on desktop.
5. **Fog too aggressive** — even after the recent push to 35→90, mid-canopy still hazes on small screens.
6. **Leaf count cut to 1200** (from 7000) — canopy looks sparse and low-quality.
7. **Shadow map dropped to 512** — soft shadows look blocky/blurry under leaves.
8. **Ground/Sky** running in their mobile (lower quality) branches.

## Plan

### 1. Bring birds back to mobile
In `src/components/landing/Tree3DScene.tsx`, remove the `!isMobile` gate on:
- `<Bird />` (event-triggered flyby — cheap, single textured plane)
- `<AmbientBirds count={6} />` — reduce to `count={3}` on mobile to stay light

### 2. Restore vibrant lighting & color
- Enable `<Environment preset="forest" background={false} />` on mobile too — it's an IBL probe, not a heavy mesh; gives leaves/coupons their natural sheen.
- Re-enable `ACESFilmicToneMapping` on mobile in the `<Canvas gl={...}>` config so colors are warm and filmic instead of flat.
- Slightly raise `toneMappingExposure` to `1.1` for a brighter, more vibrant feel.
- Keep the day-locked palette already in place (no time-of-day muddiness).

### 3. Sharper, fuller canopy on mobile
- Raise mobile `leafCount` from `1200` → `3000` (still well under desktop's 7000, but visibly fuller).
- Pull fog in slightly: `[35, 90]` → `[45, 110]` so the back of the canopy isn't faded into haze.
- Raise mobile shadow map from `512` → `1024` for crisper leaf-shadow definition (still 1/16th of desktop, cheap).

### 4. Re-introduce subtle "alive" motion on mobile
- Re-enable `<Fireflies />` on mobile but reduce count internally (or via prop) so it's a sparse twinkle, not a swarm.
- Re-enable `<TrunkRipple />` on mobile — it's a single shader plane, near-zero cost, and adds the "breathing" feel when users tap.

### 5. Safeguards so we don't regress the smoothness fixes
- Keep `antialias: false` on mobile (MSAA is the expensive part; DPR=2 already gives sharp edges).
- Keep `frameloop="always"` while visible — no demand-switching mid-scroll.
- Keep CSS3D coupon `<Html transform>` overlay disabled on mobile (that was the real blur source, not the 3D scene itself).
- Keep `backdrop-blur` off mobile UI surfaces.
- Keep mobile camera framing (FOV 32, cam `[0, 4.4, 16]`) so the tree still fits nicely above the live activity bar.

## Files to change
- `src/components/landing/Tree3DScene.tsx` — re-enable Bird/AmbientBirds/Fireflies/TrunkRipple/Environment on mobile; raise `leafCount` to 3000; soften fog; switch tone mapping to ACES + exposure 1.1; bump mobile shadow map to 1024.
- `src/components/landing/tree3d/AmbientBirds.tsx` — accept/respect a lower `count` on mobile (already prop-driven; just pass 3).
- `src/components/landing/tree3d/Fireflies.tsx` — accept an `isMobile`/`count` prop for a lighter swarm (or hard-cap internally).

## Out of scope
- No changes to desktop look (already vibrant).
- No changes to live activity bar, headline, banners, or other sections.
- No new assets, no new dependencies.

## Expected result
Mobile hero: full warm colors, soft moving sunlight on leaves, birds occasionally crossing the sky, a few fireflies twinkling, sharper canopy — all while keeping the scroll-stable, no-blink behavior from the last pass.
