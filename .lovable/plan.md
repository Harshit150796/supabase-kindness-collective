

User uploaded 3 FBX files (CommonTree_3/4/5). Three.js doesn't natively load FBX in production well (FBXLoader exists in drei but is heavier and less reliable than GLTF). However, since these are what the user has, we'll use FBXLoader from three-stdlib via drei's `useFBX`.

Pick one tree (CommonTree_4 — typically the most balanced in such packs; we'll verify visually after load and switch if needed).

## Hybrid Tree v4 — FBX Trunk + Instanced Foliage

### Asset setup
- Copy `CommonTree_4.fbx` → `public/models/tree.fbx` (keep 3 & 5 as `tree-alt-3.fbx`, `tree-alt-5.fbx` for easy swap)
- Generate `public/textures/leaf-atlas.png` procedurally on first run via canvas (4 leaf variants with alpha) — saved as static asset, no external CDN needed

### `Tree.tsx` — FBX loader
- Remove all `TubeGeometry` (trunk, branches, twigs, roots)
- `useFBX('/models/tree.fbx')` from `@react-three/drei`
- Traverse loaded scene:
  - Set `castShadow` + `receiveShadow` on all meshes
  - **Hide any mesh whose material/name suggests foliage** (filter by name containing "leaf"/"leaves"/"foliage" or material with alpha map) — we use our own
  - Apply `MeshStandardMaterial` with `roughness: 0.92` to remaining (trunk/branch) meshes; keep original color map if present
- Auto-scale + center: compute bounding box, scale to ~6 units tall, position base at y=0
- Export `getCanopyVolume()` returning `{ center: Vector3(0, 4.5, 0), radius: 2.2 }`

### `FoliageInstanced.tsx` — clean rewrite per approved spec
- Single `InstancedMesh`, geometry = 3 crossed planes merged (BufferGeometryUtils.mergeGeometries)
- Distribution: spawn N points in canopy sphere using `r = R * pow(rand, 0.4)` outer-bias + 3D noise jitter
- Counts: desktop 3,000 instances · mobile 1,000
- Per-instance attributes: `aPhase`, `aAtlasIdx` (0–3), `aTint` (HSL hue ±8°)
- Material: desktop `MeshPhysicalMaterial` (`transmission: 0.35`, `thickness: 0.4`, `alphaTest: 0.4`, `side: DoubleSide`, `roughness: 0.75`); mobile `MeshStandardMaterial` (no transmission)
- Vertex shader (`onBeforeCompile`): `transformed.x += sin(uTime*1.2 + aPhase + position.y*0.8) * 0.04 * uv.y` for tip-weighted sway
- Fragment: sample atlas with per-instance UV offset (4 cells), apply `aTint` HSL shift

### `textures.ts` — leaf atlas
- New `getLeafAtlas()`: builds 1024×1024 canvas with 4 distinct leaf shapes (oak, maple-style, oval, elongated) in varied greens with proper alpha cutout — cached, returned as `THREE.CanvasTexture` with `colorSpace = SRGBColorSpace`, `anisotropy: 16`
- Keep existing `getLeafTexture` as deprecated fallback

### `Tree3DScene.tsx`
- `Environment preset="park"` → `preset="forest"`
- Directional light: keep 4096 shadow map, add `shadow-radius: 8`, `shadow-blurSamples: 25`
- Camera parallax: tighten lerp dampening factor to 1.2 (more visible response to mouse)
- Keep fog, tone mapping, post-FX as-is

### Coupon fruits
- Existing `couponDesign.ts` positions are independent of branch tips → unchanged
- If FBX trunk silhouette places coupons awkwardly after first render, I'll nudge `COUPON_FRUITS` positions in one follow-up tweak

### Files changed
- `src/components/landing/tree3d/Tree.tsx` — strip procedural, FBX loader, foliage filter
- `src/components/landing/tree3d/FoliageInstanced.tsx` — full rewrite
- `src/components/landing/tree3d/textures.ts` — add leaf atlas builder
- `src/components/landing/Tree3DScene.tsx` — forest env, soft shadows, parallax tune
- `public/models/tree.fbx` — new (copied from upload)
- `public/models/tree-alt-3.fbx`, `tree-alt-5.fbx` — alternates for easy swap

### Risks
- FBX is heavier than GLB (~2–5 MB typical). Loading is async + already in Suspense.
- If `CommonTree_4.fbx` ships with baked foliage that's hard to filter cleanly, I'll switch to `CommonTree_3.fbx` (often trunk-only in these packs) automatically.
- FBXLoader in three.js is mature but less optimized than GLTFLoader. Acceptable for hero scene.

