# Full 360° tree with always-readable logo fruits

Three fixes, all in the hero tree. Nothing else on the page changes, and the tree's look (lighting, colours, leaves, model, fog, sky) stays exactly as it is.

## 1. Free 360° rotation

Today the tree can only be turned about a quarter turn each way, and after 3 seconds of no dragging the view slides itself back to the front. Both of these change:

- Dragging left/right can go all the way around, endlessly, with no stop.
- The view no longer snaps back to the front on its own. Double-tap/double-click still returns to the default view instantly, and a gentle idle drift keeps the scene alive.
- Up/down tilt stays limited as today, so the camera never dips under the ground or flips over the top.

## 2. Logos that stay readable from every angle

Right now every logo is pinned facing the front of the tree and pushed toward the viewer, so once you turn the tree they go edge-on and disappear. New behaviour:

- Each logo always turns to face the viewer as you rotate, like a real hanging tag catching your eye — it keeps its own gentle sway, tilt and breathing so it still feels alive rather than a flat sticker.
- Logos are spread evenly all the way around the canopy in 3D — front, sides and back — instead of being bunched on the front face. Logos on the far side are naturally smaller/dimmer behind leaves, and rotating brings them forward.
- A logo currently passing behind the trunk gets a small readability lift so it never reads as a smudge.
- Sizes stay balanced per brand as they are now, and each logo keeps its true shape.

## 3. New brands appear when old ones fall

Each spot on the tree currently regrows the exact same brand it dropped. Instead, the full 27-brand set becomes a rotating pool: when a logo falls and its spot regrows, the next unused brand from the shuffled pool grows there. So the tree keeps changing over time and every brand gets its turn, while the number of logos on the tree stays the same.

## Technical notes

- `Tree3DScene.tsx`: `OrbitControls` — drop `minAzimuthAngle`/`maxAzimuthAngle` (unbounded azimuth), keep polar clamps, keep `enablePan`/`enableZoom` off and scroll-driven distance as is. Remove the idle azimuth re-centre branch in `CameraRig` while keeping the double-click reset animation and parallax.
- `CouponFruit.tsx`: replace the fixed `CANOPY_FACE_OFFSET` (+Z) placement with a radial offset along the branch tip's own outward direction, and add a yaw-only billboard in `useFrame` (`group.rotation.y = atan2(camera.x - pos.x, camera.z - pos.z)` composed with the existing sway/tilt) for the `hanging` and `regrowing` phases. Falling/landed behaviour unchanged.
- Brand pool: `Scene` keeps a per-slot brand index in state alongside `CouponState`, plus a shuffled queue over `COUPON_FRUITS`; `handleRegrown` assigns the next brand when a slot returns to `hanging`. `CouponFruit` already rebuilds its texture from `data`, so the logo swap is automatic; textures stay cached per brand in `couponDesign.ts`.
- `getBranchTips` distribution stays as-is (already a 3D spherical spread) — only the per-fruit offset direction changes.
- Protected: lighting, exposure, tone mapping, environment, fog, Sky, colours, tree geometry/model, fireflies, birds, plants, ripple, lazy chunk, canvas fade-in, wheel safety valves, leaf depth material.

## Verification

Screenshots at 1440px and mobile at several rotation angles (front, 90°, 180°) to confirm logos stay facing the viewer, plus a check that a dropped logo regrows as a different brand. Live WebGL capture has previously failed in this environment; if it fails again I will say so plainly instead of claiming visual proof.
