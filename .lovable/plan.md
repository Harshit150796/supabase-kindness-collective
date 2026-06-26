# Enlarge Mobile Landscape + Full Desktop Feature Parity

## Goal
Make the mobile hero landscape ~1 cm taller and remove every remaining mobile-only downgrade so phones get the same vibrant, full-featured 3D scene as desktop.

## Changes

### 1. Increase mobile landscape height (~1 cm ≈ 38 px ≈ ~6 svh)
- `src/components/landing/HeroSection.tsx`: mobile hero height `h-[52svh]` → `h-[58svh]`.

### 2. Bring all desktop features to mobile (full parity)
In `src/components/landing/Tree3DScene.tsx`:
- **Lighting:** add the desktop back-fill `<directionalLight position={[0,4,-8]} intensity={0.35} color="#FFD8A8" />` on mobile too; drop the mobile-only hemisphere stand-in.
- **Fog:** use desktop values `[18, 45]` on mobile as well.
- **Sky / Ground:** pass `isMobile={false}` so both render in full-quality desktop mode.
- **Camera:** use the desktop camera (`[0, 4.0, 13]`, fov 38, target `[0, 3.4, 0]`).
- **Leaves:** raise mobile `leafCount` 3000 → 7000 (desktop value).
- **Plants:** raise mobile `plantCap` 14 → 40 (desktop value).
- **Birds:** `AmbientBirds count={6}` on mobile (same as desktop).
- **Antialiasing & power:** enable `antialias: true` and `powerPreference: 'high-performance'` on mobile.
- **Shadow map:** raise to desktop 4096 with full blur samples.
- **OrbitControls min/max distance:** use desktop `9 / 17`.

### 3. CouponFruit overlay
- `src/components/landing/tree3d/CouponFruit.tsx`: stop suppressing the CSS3D `<Html transform>` coupon face on mobile so the labels look identical to desktop.

### 4. InteractionContext
- `src/components/landing/tree3d/InteractionContext.tsx`: remove the mobile-forced 'day' lock so mobile follows the same time-of-day behavior as desktop.

## Files to change
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/Tree3DScene.tsx`
- `src/components/landing/tree3d/CouponFruit.tsx`
- `src/components/landing/tree3d/InteractionContext.tsx`

## Trade-off the user should know
Full desktop parity on phones (7000 leaves, 4096 shadows, AA, CSS3D coupon labels, forest IBL, post-effects-free but full lighting) will be noticeably heavier on mid/low-end phones — expect lower FPS and possibly some of the earlier blur/jank to return on weaker devices. This is the explicit "same as laptop" request; if any phone struggles, we can dial back individual items afterwards.

## Out of scope
- No layout/content changes outside hero height.
- No changes to the live activity bar, headline, or other sections.
