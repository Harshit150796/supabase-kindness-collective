## Goal

Make the hero 3D scene look noticeably sharper and the hanging coupons look crisp, vibrant, and readable instead of dull/blurry.

## What's causing the current "dull/blurry" look

1. **Renderer DPR is capped at 1.75** and drops to 1.0 on any perf dip → on retina screens (devicePixelRatio 2–3) the canvas is upscaled, softening everything including coupon text.
2. **Coupon texture is only 512×320** drawn onto a ~1.15×0.74 unit card seen close-up → texels stretch, text edges blur. No mipmap/anisotropy tuning, no `colorSpace = SRGBColorSpace`.
3. **Coupon material is dim**: `roughness 0.45`, low `emissiveIntensity 0.06`, plus an additive gold "glow" box (1.08×1.12) that bleeds over the text and washes contrast.
4. **Tone mapping exposure 1.05** + `Vignette` + a faint global `fog` desaturate and darken everything in the foreground.
5. **No sharpening / no `outputColorSpace` set explicitly**; textures default to linear which dulls colors.

## Changes

### 1. Renderer & canvas quality (`Tree3DScene.tsx`)
- Raise DPR ceiling to `[1, Math.min(window.devicePixelRatio, 2.5)]` (was `[1, 1.75]`).
- Don't drop DPR to 1.0 on first PerformanceMonitor decline — drop to 1.25 instead, so coupons stay sharp on mid-range devices.
- Add `gl={{ ..., powerPreference: 'high-performance', outputColorSpace: THREE.SRGBColorSpace }}`.
- Bump `toneMappingExposure` 1.05 → 1.15 for a brighter, more vivid scene.
- Lower fog density: change `fog args={['#DCE6D5', 18, 45]}` → `[..., 26, 60]` so foreground coupons aren't tinted.

### 2. Coupon texture (`couponDesign.ts`)
- Increase canvas resolution 512×320 → **1024×640** (2× linear, 4× pixels).
- Set `tex.colorSpace = THREE.SRGBColorSpace`, `tex.anisotropy = 16`, `tex.minFilter = THREE.LinearMipMapLinearFilter`, `tex.magFilter = THREE.LinearFilter`, `generateMipmaps = true`.
- Slightly thicker brand-name stroke + drop shadow on the `$5/$10` amount for punch.

### 3. Coupon material (`CouponFruit.tsx`)
- `roughness 0.45 → 0.32`, `metalness 0.1 → 0.18` (subtle sheen, more "premium card").
- `emissiveIntensity 0.06 → 0.18` so the front face stays readable in shadow.
- Reduce the additive gold glow box opacity `0.14 → 0.06` and shrink scale `1.08, 1.12 → 1.04, 1.06` so it frames the card instead of washing the text.
- Set the coupon texture's `anisotropy` on mount (already covered by the texture change above).

### 4. Lighting tweak (`Tree3DScene.tsx`)
- Bump key directional light intensity 1.35 → 1.55 in `day` preset and ambient 0.75 → 0.85 so leaves and coupons read crisper.
- Keep sunset/night intentionally moody (unchanged).

### 5. Post-processing (`Tree3DScene.tsx`)
- Keep Bloom but lower intensity slightly so it doesn't bloom over coupon text edges (if Bloom is currently strong; verify in the unread tail of the file before edit).
- Soften `Vignette` (lower darkness/offset) to keep edges from looking muddy.

## Out of scope
- No changes to the GLB tree model, animation logic, or interaction behaviors.
- No copy/text changes.

## Files touched
- `src/components/landing/Tree3DScene.tsx`
- `src/components/landing/tree3d/CouponFruit.tsx`
- `src/components/landing/tree3d/couponDesign.ts`

## Risk
Higher DPR = more GPU work. Mitigated by capping at 2.5 and keeping the PerformanceMonitor auto-decline (just to 1.25 instead of 1.0). On low-end devices the scene stays smooth; on retina laptops/phones the coupons become visibly crisp.
