

User uploaded a `mango-tree.zip` plus 2 reference images (orange/apple-style fruit tree with dense green canopy). I need to inspect what's inside the zip before committing to format details.

## Plan: Full Photoreal Tree Upgrade from Uploaded Asset

### Phase 1 — Inspect & install asset (in default mode)
1. `lov-copy user-uploads://mango-tree.zip /tmp/mango.zip` then unzip to `/tmp/mango/`
2. List contents to identify: `.gltf/.glb/.fbx/.obj` model + textures (`.png/.jpg`)
3. Convert if needed:
   - If GLB → drop straight into `public/models/tree.glb`
   - If GLTF + separate textures → keep folder structure under `public/models/mango-tree/`
   - If FBX/OBJ → convert to GLB via `npx @gltf-transform/cli` (or assimp); fall back to FBXLoader path if conversion fails
4. Optimize: run `gltf-transform optimize` (draco compression, texture resize to max 1024) to keep payload <2 MB

### Phase 2 — Replace tree rendering
**`src/components/landing/tree3d/Tree.tsx`** — full rewrite
- Remove ALL `TubeGeometry` (trunk, branches, twigs, roots) and the procedural `FoliageInstanced` for the main canopy
- `useGLTF('/models/tree.glb')` (preloaded at module top)
- Traverse scene → `castShadow` + `receiveShadow` on every mesh; preserve original materials & textures (these are the photoreal leaves+bark from the asset)
- If material is `MeshBasicMaterial`, upgrade to `MeshStandardMaterial` with `roughness: 0.85`, keep map/alphaMap/normalMap
- Compute bounding box → auto-scale to ~6 units tall, base at y=0, centered on origin
- Apply subtle wind sway via `onBeforeCompile` on leaf-like materials (detect by `transparent === true` or `alphaTest > 0`): tip-weighted vertex offset using world Y

### Phase 3 — Coupon fruit positioning
- Asset already has fruit baked in (visible in reference images). Two options I'll decide after seeing the model:
  - **A:** If fruits are part of the GLB and look good → hide our procedural `CouponFruit` from the static canopy and only show them during `falling`/`landed` states (coupons fall from canopy area into ground)
  - **B:** If GLB fruits are not realistic / can't be hidden cleanly → keep our `CouponFruit` system but reposition `COUPON_FRUITS` to sit on the new canopy silhouette (sample 12 points on outer canopy bounding sphere)

### Phase 4 — Scene polish
**`src/components/landing/Tree3DScene.tsx`**
- `Environment preset="park"` → `preset="forest"`
- Directional light: `shadow-radius: 8`, `shadow-blurSamples: 25`, keep 4096 map
- Camera parallax already in place — tune dampening to 1.2 for more visible response
- Keep fog, tone mapping, post-FX

### Phase 5 — QA
- Take screenshot via browser tool, compare to uploaded reference images
- Adjust scale / camera position / lighting if silhouette doesn't match the reference vibe
- Check mobile viewport (850px shown — test both phone & desktop sizes)

### Files changed
- `public/models/tree.glb` (+ textures folder if separate) — new
- `src/components/landing/tree3d/Tree.tsx` — full rewrite, GLB only
- `src/components/landing/tree3d/couponDesign.ts` — possibly tweak `COUPON_FRUITS` positions
- `src/components/landing/Tree3DScene.tsx` — forest env, soft shadows, parallax tune
- `src/components/landing/tree3d/FoliageInstanced.tsx` — keep file but unused for main tree (or delete)

### Honest caveats upfront
- I cannot inspect zip contents in plan mode. If the zip contains only FBX (no textures) or unusable formats, I'll fall back to FBXLoader + your already-uploaded `CommonTree_4.fbx` and report back before continuing.
- Asset size: target <2 MB after optimization. If raw model is 10+ MB I'll aggressively compress (Draco + 512px textures) and show you the size tradeoff.
- The reference images show a full, mature fruit tree — exactly the look we'll match. Trunk silhouette will likely shift, so coupon-fruit positions will need one tuning pass after first render.

