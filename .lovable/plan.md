

User wants: GLTF trunk + procedural instanced foliage + camera parallax. No leaf cluster GLB, no GLB empty dependency. Clean and stable.

Honest reality check: there's no `tree.glb` or `leaf-atlas.png` in the project today. I'll source CC0 assets and bundle them locally during implementation.

## Hybrid Tree v3 — GLTF Trunk + Smart Instanced Foliage

### Assets to add
- `public/models/tree.glb` — CC0 oak/maple trunk + branches only (Quaternius Ultimate Nature, ~1–2 MB). Foliage stripped if model has it.
- `public/textures/leaf-atlas.png` — 2×2 atlas of 4 real leaf cutouts with alpha (~150 KB, CC0 from ambientCG).

### `Tree.tsx` — GLTF only
- Delete all `TubeGeometry` (trunk, branches, twigs, roots)
- `useGLTF('/models/tree.glb')` → traverse, set `castShadow`/`receiveShadow`, replace material with `MeshStandardMaterial` if model ships with low-quality one
- Compute a procedural canopy bounding sphere (center ~`(0, 4.5, 0)`, radius ~2.2) — used by foliage, no branch-tip dependency
- Export `getCanopyVolume()` instead of `getBranchTips()`. Coupon-fruit positions stay (already hand-tuned in `couponDesign.ts`)

### `FoliageInstanced.tsx` — clean rewrite
- Single `InstancedMesh` of crossed quads
- Each "cluster point" = 3 crossed planes (X-shape) merged into one geometry → 1 instance covers ~3 leaf cards from any angle
- Distribution: spawn N points in canopy sphere using `sphere + 3D noise + outer-bias falloff` (`r = R * pow(rand, 0.4)` weights toward outer shell)
- Counts: desktop 3,000 instances (≈9,000 visible leaf cards) · mobile 1,000 instances (≈3,000)
- Per-instance attributes: `aPhase` (wind), `aAtlasIdx` (0–3 for atlas cell), `aTint` (HSL hue ±8°)
- Material: `MeshPhysicalMaterial` desktop (`transmission: 0.35`, `thickness: 0.4`, `alphaTest: 0.4`, `side: DoubleSide`, `roughness: 0.75`); mobile falls back to `MeshStandardMaterial` (no transmission)
- Vertex shader (via `onBeforeCompile`): `transformed.x += sin(uTime*1.2 + aPhase + position.y*0.8) * 0.04 * uv.y` — tip-weighted sway

### `Tree3DScene.tsx`
- Replace `Environment preset="park"` → `preset="forest"`
- Directional light: keep 4096 shadow map, add `shadow-radius: 8`, `shadow-blurSamples: 25` for soft PCSS-style shadows
- Camera parallax: smooth lerp toward `mouse.x * 0.6` and `mouse.y * 0.3` with subtle bobbing (already partially exists — tune dampening factor down to 1.2 for more visible response)
- Keep fog, tone mapping, post-FX as-is

### `useGLTF` setup
- Add `useGLTF.preload('/models/tree.glb')` at module top
- Wrap in `<Suspense>` (already in place)

### Files changed
- `src/components/landing/tree3d/Tree.tsx` — strip procedural, load GLB
- `src/components/landing/tree3d/FoliageInstanced.tsx` — full rewrite per spec
- `src/components/landing/Tree3DScene.tsx` — forest env, soft shadows, parallax tune
- `public/models/tree.glb` — new (~1.5 MB)
- `public/textures/leaf-atlas.png` — new (~150 KB)

### Risks (upfront)
- ~1.7 MB asset add → first hero paint +0.5–1s on slow networks (already lazy-loaded)
- If sourced GLB's trunk silhouette differs from current tree, coupon-fruit positions may need 1 minor tweak in `couponDesign.ts` to sit naturally on the new branches — I'll verify and adjust if needed
- `MeshPhysicalMaterial` + transmission is GPU-heavy; mobile fallback handles this

