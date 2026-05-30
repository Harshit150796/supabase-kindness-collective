## Goal

Right now fallen coupons and the plants that sprout from them pile up under the tree because they fall straight down from their branch tip with only tiny horizontal velocity. The ground disc is radius 12, so there's a lot of unused grass. Spread the landings (and the resulting plants) across that wider area while keeping the existing look of the fall animation.

## Changes

### 1. `src/components/landing/tree3d/CouponFruit.tsx` — randomize landing spot

- Add a stable per-coupon "scatter target" computed once (using `index` as seed) with:
  - angle: full `0..2π`
  - radius: ~`1.8` to `5.5` (outside the trunk, inside the ground disc, avoiding the very edge)
- When the coupon enters the `falling` phase, set initial horizontal velocity so it drifts toward that target by the time it reaches `groundY` (simple ballistic estimate from current height and gravity), instead of the current small random `x/z` velocity. Keep gravity, rotation tumble, and air drag as-is so the fall still feels natural.
- On ground contact, snap the final `restPos.x/z` to the scatter target (plus a tiny jitter) so coupons end up cleanly distributed even if the integration drifts.
- Pass that same `restPos` into `spawnPlant` (already does) — no API change needed.

This keeps `onClickHanging → falling → landed` flow identical; only the trajectory endpoint changes.

### 2. `src/components/landing/Tree3DScene.tsx` — verify branch coverage (read-only check, no behavior change expected)

Confirm coupons use their `index` consistently so the scatter seed is stable per fruit slot. No code change unless `index` isn't stable.

### 3. `src/components/landing/tree3d/PlantsLayer.tsx` — widen jitter

- Current `jitter()` adds ±0.09 units around the coupon's land position. Since coupons will now already be spread, leave the core position alone but bump jitter slightly (±0.25) so multiple plants from the same scatter target don't perfectly overlap.
- Keep dedupe-by-donation-id and FIFO cap (`cap=40`) untouched.

### 4. Avoid overlap with tree trunk / roots

- Enforce a minimum radius of `~1.6` from origin for both the scatter target and any jitter result, so nothing spawns inside the trunk base.

## Out of scope

- No visual restyling of coupons, plants, ground, lighting, or tree.
- No changes to spawn rate, dedupe, FIFO cap, mobile perf settings, fireflies, bird, squirrel, or Ground geometry.
- No DB / hook changes.

## Technical notes

- Scatter target formula (deterministic from `index`):
  ```
  ang = (index * 2.3998) % (2π)        // golden-angle for even spread
  rad = 1.8 + ((index * 0.6180339) % 1) * 3.7
  target = (cos(ang)*rad, sin(ang)*rad)
  ```
- Horizontal velocity seed at fall start:
  ```
  dx = target.x - branchTip.x
  dz = target.z - branchTip.z
  tFall ≈ sqrt(2 * (branchTip.y - HANG_DROP - groundY) / 9.8)
  vx = dx / tFall ; vz = dz / tFall
  ```
  Add small random tumble as today.
- Files touched: `CouponFruit.tsx`, `PlantsLayer.tsx`. `Ground.tsx`, `Tree3DScene.tsx`, `useFallingDonations.ts`, `InteractionContext.tsx` unchanged.
