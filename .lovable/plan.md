
User wants:
1. Remove all overlay text/CTAs from the hero (no text on top of tree, no blur/gradient overlay).
2. Tree section becomes a pure, full-bleed 3D scene.
3. Make the tree look photorealistic — not cartoonish/stylized.

Current state: HeroSection has text overlay + readability gradients on top of Tree3DScene. Tree uses procedurally drawn canvas leaf textures (stylized look).

Plan:

## Pure Photoreal Tree Hero — Remove Text, Push Realism

### 1. Strip the hero down to just the tree
`src/components/landing/HeroSection.tsx`:
- Remove the text column (badge, headline, subcopy, CTA buttons, fine print)
- Remove the left-side readability gradient and bottom fade gradient (no blur)
- Keep only: full-bleed `<Tree3DScene />` filling the section edge-to-edge
- Section height stays ~88vh on desktop, ~60vh on mobile
- Suspense fallback becomes a clean warm gradient (no skeleton text)

### 2. Push the tree toward photorealism

**Leaves (`textures.ts` + `FoliageInstanced.tsx`):**
- Replace the cartoon canvas-painted leaf with a more photoreal leaf alpha map: irregular natural silhouette, real-looking color noise (mottled greens with subtle yellow + brown speckles), darker midrib, soft translucent edges
- Add a second leaf variant (slightly different shape/tint) — alternate per instance for variety
- Enable `transparent` + `alphaTest: 0.5` + `side: DoubleSide` and slight `roughness` variance per instance
- Increase leaf density: 7,000 desktop / 2,800 mobile
- Tighter Poisson clustering so canopy reads as solid mass, not sparse dots
- Per-instance scale variance widened (0.6–1.4) for natural irregularity

**Bark (`textures.ts`):**
- Generate a higher-res (1024×2048) bark color map with deeper crack shadows, lichen patches, knot details
- Generate a matching normal map (height-to-normal from canvas grayscale) so trunk catches light realistically
- Apply both to trunk + branches via `MeshStandardMaterial` (`map`, `normalMap`, `roughness: 0.95`)

**Tree shape (`Tree.tsx`):**
- Add 6–8 thin tertiary twigs branching off each secondary branch (more realistic silhouette under canopy)
- Slight random jitter on branch control points each render so no two branches feel identical
- Bigger overall scale to fill the wider section

**Lighting & atmosphere (`Tree3DScene.tsx`):**
- Switch `<Environment preset="sunset" />` to `preset="park"` for more neutral natural daylight (less orange wash → more realistic)
- Reduce warm directional intensity, raise ambient slightly
- Add subtle fog: `<fog attach="fog" args={['#DCE6D5', 18, 45]}` for atmospheric depth
- Keep Bloom but lower intensity (0.3) so highlights feel natural, not glowy
- Add `Vignette` at lower darkness (0.3)

**Ground (`Ground.tsx`):**
- Higher-detail grass canvas texture: blade strands, tiny clover, dirt patches, fallen leaf hints
- Slight bump via normalMap so ground catches sunlight unevenly

**Sky (`Sky.tsx`):**
- Soften gradient: pale blue `#BFD8E8` top → warm cream `#FFF2D8` horizon → muted green `#D8E0CC` bottom (matches a real outdoor scene at mid-morning)
- Reduce sun glow brightness

**Camera (`Tree3DScene.tsx`):**
- Pull back slightly (`position: [0, 4.0, 13]`, `fov: 38`) so the whole tree fits comfortably edge-to-edge with breathing room
- Keep mouse parallax subtle

### 3. Coupons
- Keep current coupon-fruit system intact (size/positions already good)
- Slightly reduce edge-glow intensity so they feel like real hanging tags, not neon

### Files changed
- `src/components/landing/HeroSection.tsx` — strip overlay text + gradients
- `src/components/landing/Tree3DScene.tsx` — env preset, fog, camera, lighting tuning, post-FX values
- `src/components/landing/tree3d/textures.ts` — photoreal leaf + bark + ground textures, add normal maps
- `src/components/landing/tree3d/Tree.tsx` — add tertiary twigs, denser canopy clusters
- `src/components/landing/tree3d/FoliageInstanced.tsx` — increased count, two leaf variants, wider scale variance
- `src/components/landing/tree3d/Ground.tsx` — richer grass texture + normal map
- `src/components/landing/tree3d/Sky.tsx` — softer realistic gradient
- `src/components/landing/tree3d/CouponFruit.tsx` — tone down edge glow

### Note
Removing the hero text means the headline + CTAs disappear from the landing page top. Sections below (LiveActivityBar, ImpactStories, etc.) remain — the page will scroll into them right after the tree. Confirm if you want the headline restored later in a separate section below the tree.
