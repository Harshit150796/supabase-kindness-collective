## Goal

When a coupon (donation) falls and touches the grass, sprout a small, beautiful plant at the landing spot — a visible, lasting symbol that every donation creates new life around the tree. Plants accumulate over the session so the landscape gradually fills with greenery as donations come in.

## Visual concept

At the moment a coupon lands:

1. A tiny puff of soil/dust + green sparkle bursts at the landing point (reuses existing `SparkleBurst` look, recolored).
2. A sprout pushes up out of the ground over ~1.2s with an elastic ease (squash → stretch → settle).
3. The sprout grows into a small stylized plant (~0.25–0.45m tall) over another ~1.5s: stem rises, 2–4 leaves unfurl (scale + slight rotation), and 1–3 tiny flowers/buds bloom on top in a color tied to the coupon's brand (so the plant subtly "remembers" which donation created it).
4. After full bloom, the plant gently sways with the same wind signal already used by the tree, and stays in the scene.

Plants are placed slightly offset from the coupon's resting position (so they don't z-fight with the lying coupon card) and very lightly jittered so a cluster looks organic, not gridded.

## Plant variety

3 procedural plant archetypes, picked deterministically from the donation `id` so the same donation always produces the same plant:

- **Sprout-with-leaves** — short stem, 2 broad leaves, no flower. Used for small donations.
- **Flowering stem** — taller stem, 3 leaves, 1 flower head (5 rounded petals + center). Used for medium donations.
- **Mini bush** — 3 short stems clustered, multiple small leaves, 2–3 tiny buds. Used for larger donations.

Amount → archetype mapping:
- `< $10` → sprout
- `$10–$49` → flowering stem
- `>= $50` → mini bush

Flower/bud color = the coupon's brand color (already on `CouponData.color`), with a softer pastel variant for petals so it reads as natural, not neon.

## Lifecycle & limits

- Plants persist for the rest of the session (they do not disappear when the coupon regrows on the tree).
- Cap at **40 plants** total in the scene. When the cap is exceeded, the oldest plant fades out over 0.6s and is removed (FIFO) so the scene stays performant.
- Mobile cap: **20 plants** (detected via the existing `isMobile` flag in `Tree3DScene`).
- All plants share a small set of cached geometries/materials (one per archetype + one shared leaf/petal geometry) so adding a plant is cheap.

## Architecture

New files:

- `src/components/landing/tree3d/PlantSprout.tsx`
  - Single plant component. Props: `position`, `seed` (donation id), `archetype`, `accentColor`, `bornAt`, `fadingOut?`, `onFadedOut?`.
  - Owns its own grow animation in `useFrame` based on `bornAt`. Uses elastic ease for stem rise + staggered leaf unfurl + flower bloom.
  - Subscribes to `useInteraction().windRef` (same source the tree already reads) for sway.
  - Built from primitives (`cylinderGeometry` for stems, `sphereGeometry` scaled for leaves/buds, custom small `Shape`-based petals) — no external assets, no new dependencies.

- `src/components/landing/tree3d/PlantsLayer.tsx`
  - Holds the array of active plants. Exposes an imperative `spawnPlant(donation, position)` via context or a ref forwarded from `Scene`.
  - Manages the FIFO cap and triggers fade-outs.

Edits:

- `src/components/landing/tree3d/InteractionContext.tsx`
  - Add `spawnPlant(donation, position)` to the context (the same pattern already used for `spawnRipple`, `openStory`, etc.) so `CouponFruit` can call it without prop-drilling.

- `src/components/landing/tree3d/CouponFruit.tsx`
  - In the `useFrame` falling branch, at the exact moment we detect ground contact (and in the click-catch path before `setTimeout(onLanded)`), call `spawnPlant(state.donation, landingXZ)` once per landing. Guard with a ref so it can only fire once per fall.
  - No visual changes to the coupon itself.

- `src/components/landing/Tree3DScene.tsx`
  - Render `<PlantsLayer />` once inside `Scene`, alongside `Ground`, `Fireflies`, etc.
  - Pass the mobile cap into `PlantsLayer`.

## Performance notes

- Geometries and base materials are created once per archetype and reused (module-level cache, same pattern as `getCouponGeom` in `CouponFruit.tsx`).
- Plants opt out of shadow casting by default (only `receiveShadow` on the ground stays); we can enable `castShadow` on the tallest stem for the bush archetype only if it still feels light.
- All sway math is cheap sine-based, identical in cost to the existing leaf sway.
- No new npm packages.

## Out of scope

- No DB writes, no schema changes, no admin UI, no changes to coupon design, label text, donor name resolution, or the falling/regrow logic itself.
- Plants are visual only — they do not block clicks on the coupon, the tree, or the ground.

## Verification

On `/`:
- Wait for a coupon to fall → at the moment it touches the grass, a sprout appears next to it and grows into a small plant.
- Click a hanging coupon → catch it → after it settles, a plant sprouts at the landing spot.
- Trigger the shake cascade → multiple plants sprout in sequence around the tree.
- Plants gently sway and remain after the coupon regrows back onto the tree.
- After many drops, the oldest plants fade out so total never exceeds 40 (20 on mobile) and FPS stays smooth.
