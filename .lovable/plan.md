# More Wildlife: Ambient Birds & Ground Animals

Today the scene has only **one** bird (triggered only by a canopy hold) and **one** squirrel (only peeks from the trunk on mouse proximity). During day/sunset the scene feels empty. We'll add continuous ambient wildlife while keeping the existing interactive bird/squirrel untouched.

## What we'll add

### 1. `AmbientBirds.tsx` (new) — flock flying across the sky
- Render **6 birds on desktop, 4 on mobile** as instanced/individual `planeGeometry` sprites reusing the existing `makeBirdTexture()` helper from `Bird.tsx` (extract it into a small shared module `birdTexture.ts` so both components share one canvas texture).
- Each bird flies on a randomized quadratic-Bezier path across the sky:
  - start at one edge (x ≈ ±14), height 5–9, z between −4 and 2
  - end at the opposite edge
  - 6–14 s per crossing; on completion, pick a new path and reverse direction sometimes
- Wing-flap via vertical scale (same trick as `Bird.tsx`).
- `lookAt` next path point so birds face their travel direction.
- **Hidden at night** (`timeOfDay === 'night'`) — fade opacity to 0; restore at day/sunset. At sunset, tint material slightly warmer via `color` prop.
- No click/hover interaction. Pure ambience.

### 2. `GroundCritters.tsx` (new) — squirrels & small animals wandering on grass
- Render **4 critters on desktop, 2 on mobile** as sprite planes on the ground (y ≈ 0.35).
- Mix of textures via two new canvas helpers:
  - reuse `makeSquirrelTexture()` (extract from `Squirrel.tsx` into `squirrelTexture.ts`)
  - add `makeRabbitTexture()` — small gray/white bunny silhouette (canvas, same style as squirrel)
- Each critter has a wander state machine:
  - pick a random target point within grass radius (1.8 ≤ r ≤ 9.5, avoiding trunk r < 1.6)
  - walk toward it at ~0.6 units/s with a small hop bob (`sin(t*8) * 0.04`)
  - on arrival, pause 1–3 s, then pick a new target
- Billboard toward camera each frame (so the sprite always faces the viewer) — copy the camera-quaternion approach used in fireflies/coupon sprites.
- **Night behavior**: keep them visible but reduce count to 1 and dim opacity to ~0.5 (mostly nocturnal critters skip; rabbits stay).
- No click interaction.

### 3. Texture extraction (small refactor)
- Move `makeBirdTexture` from `Bird.tsx` → `src/components/landing/tree3d/birdTexture.ts` and import in both `Bird.tsx` and `AmbientBirds.tsx`.
- Move `makeSquirrelTexture` from `Squirrel.tsx` → `src/components/landing/tree3d/squirrelTexture.ts` and import in both `Squirrel.tsx` and `GroundCritters.tsx`.
- Behavior of existing `Bird.tsx` / `Squirrel.tsx` unchanged.

### 4. Wire into `Tree3DScene.tsx`
- In `Scene`, after `<Bird />` / `<Squirrel />` add:
  ```tsx
  <AmbientBirds count={isMobile ? 4 : 6} />
  <GroundCritters count={isMobile ? 2 : 4} />
  ```
- Pass `isMobile` through (already available as prop).

## Mobile performance

- Bird/critter sprites are cheap (single quad each, shared texture). Total added draw calls: ≤10 on mobile, ≤14 on desktop — well within the existing budget.
- All animation runs in one `useFrame` per component using simple math, no physics, no shadows.
- All critters use `depthWrite={false}` and `transparent`, like existing sprites.

## Out of scope

- No new hover/click interactions, no story panels, no DB changes.
- No changes to tree, coupons, plants, sky, lighting, fireflies.
- No 3D models (gltf) — keep canvas-sprite approach for bundle size and mobile perf.
- The existing single `Bird` (canopy-hold trigger) and `Squirrel` (trunk peek) remain exactly as today.
