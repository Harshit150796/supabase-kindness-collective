## Improve hanging coupon image quality

The coupons hanging on the tree look blurry because their texture is drawn on a small 512×320 canvas and rendered with low anisotropy. Reference image shows a crisp Costco-style coupon — we'll match that clarity.

### Changes (single file: `src/components/landing/tree3d/couponDesign.ts`)

1. **Increase canvas resolution 4×** — go from 512×320 to 2048×1280 (matching the 1.15 × 0.74 aspect ratio of the 3D coupon plane). Scale every drawing coordinate, font size, border radius, and stroke width by 4× so the layout is identical, just sharper.

2. **Sharper texture sampling** on the `THREE.CanvasTexture`:
   - `anisotropy: 16` (up from 4) — dramatically reduces blur at glancing angles, which is exactly how the coupons hang.
   - `minFilter: THREE.LinearMipmapLinearFilter` + `magFilter: THREE.LinearFilter` + `generateMipmaps: true` for clean filtering at distance.
   - Set `colorSpace = THREE.SRGBColorSpace` so colors render correctly (currently default linear, which can wash things out).

3. **Crisper text rendering** — set `ctx.imageSmoothingQuality = 'high'` and use slightly heavier font weights so small labels (`GROCERY COUPON`, trait pill) stay readable at the new resolution.

No changes to the 3D mesh, geometry, lighting, layout, brand list, or any other component — purely a texture-quality upgrade.

### Why this fixes it

The 3D coupon is ~1.15 units wide and frequently shown at screen sizes well above 512px. The GPU was upscaling a tiny canvas, hence the blur. Quadrupling the source resolution + maxing anisotropy + proper mipmaps brings it to the crisp look in the reference image.