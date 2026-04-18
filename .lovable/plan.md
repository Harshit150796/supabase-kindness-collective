
The user wants a much richer, more detailed plan for the premium 3D tree. They want depth — actual implementation strategy, geometry choices, shader/material approach, lighting setup, and animation choreography. Let me think through this carefully like a senior 3D/WebGL artist would, then present a tight but rich plan.

Key upgrades over current implementation:
1. Trunk: replace LatheGeometry with a Catmull-Rom curved tube + bark normal map for organic curvature and surface detail
2. Branches: recursive L-system style generation with 2 levels of subdivision, tapered tubes following bezier curves (not straight cylinders)
3. Foliage: thousands of instanced leaf cards (InstancedMesh) with alpha-mapped leaf textures, distributed via Poisson sampling around branch tips — not low-poly icospheres
4. Wind: vertex shader-based wind sway on leaves (per-instance phase offset) — much smoother than scaling whole groups
5. Background: gradient sky dome + soft volumetric god-rays + distant blurred bokeh particles for depth
6. Ground: tessellated plane with grass blade instances in a ring around the tree, not flat color
7. Lighting: 3-point cinematic — warm key (golden hour sun), cool fill, rim backlight + drei's `<SoftShadows>` for area-light feeling shadows
8. Post-processing: `@react-three/postprocessing` for Bloom (sun glow on coupons), subtle DOF, vignette, ACES tone mapping
9. Coupons: rounded rectangle (ExtrudeGeometry from RoundedRect shape) instead of harsh box, gold rim emissive glow, subtle string physics (verlet)
10. Falling coupon: add tumble + air drag + soft squash on landing + dust puff particle burst
11. Ground label: glassmorphism card with gold border + donor avatar circle + counter animation on amount
12. Atmosphere: floating dust motes (instanced points), occasional drifting leaf particles
13. Camera: subtle dolly + slight orbit on mouse parallax (constrained)
14. Loading: bespoke skeleton showing tree silhouette growing in, not generic Skeleton

Reference for leaf textures: use a procedural canvas-drawn leaf alpha map (no external assets needed). Same approach as couponDesign.ts.

Performance: still single Canvas, frameloop demand-when-out-of-view, instanced everything, dpr capped, mobile gets reduced leaf count (1500 vs 4000) and disables postprocessing.

Let me present this as a concise but rich plan.
