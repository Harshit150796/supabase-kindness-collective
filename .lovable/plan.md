
## Goal
Spread the landed coupons and the small plants across the whole grass disc (radius ~10) instead of piling them right under the tree trunk.

## Why they cluster today
- The tree drops coupons almost straight down — `CouponFruit.tsx` gives them tiny horizontal velocity (`(Math.random()-0.5) * 0.5`), so they land within a metre or so of the branch tip.
- `PlantsLayer` plants spawn at the coupon's land position with only `±0.18` jitter, so they inherit the same clumping.
- Ground radius is 12 — there's plenty of empty grass going unused.

## Scope
Two files, no visual style changes — just better spatial distribution.

### 1. `src/components/landing/tree3d/CouponFruit.tsx`
When a coupon transitions to `falling`, give it a much larger horizontal kick so it travels outward as it falls, and add a final "scatter" of the rest position so coupons end up spread across a 3–9 metre ring around the trunk (not just under it).

- Initial horizontal velocity: `(Math.random() - 0.5) * 0.5` → multiply by ~6 (range ±1.5 m/s). Pick a random outward angle so the bias is *away* from centre, not random — i.e. compute `angle = Math.random() * 2π`, then `vx = cos(angle) * speed`, `vz = sin(angle) * speed`, with `speed = 1.0 + Math.random()*1.5`.
- Cap the final `restPos` distance from origin to `[2.0, 9.5]` — if the physics lands it closer than 2 (right under trunk), push it out along its angle. This guarantees visible spread even on slow drops.
- Air drag stays the same; gravity unchanged → fall feels the same, just lands wider.

### 2. `src/components/landing/tree3d/PlantsLayer.tsx`
Decouple plant placement from the coupon landing spot. Plants are decorative — they don't need to mark a specific coupon. Spawn each new plant at a random point in an annulus around the tree (radius 2.0–9.5), rather than `plantEvent.position + ±0.18`.

- Replace the jitter logic with: deterministic `angle` and `radius` from the donation id seed, so the same donation always picks the same spot (no flicker on re-render).
- Keep `y = plantEvent.position[1]` (ground y), keep the FIFO cap, keep the `accentColor` from the donation.

## Not changed
- Falling physics duration, gravity, rotation tumble, sparkle, label badge, regrow timing.
- Plant archetypes, growth animation, fade-out.
- Ground, lights, tree, coupon look.
- Mobile vs desktop counts.

## Verification
After the edit, watch the preview for ~30 seconds: landed coupons and sprouted plants should appear scattered around the trunk in a wide ring, not piled at the base. Confirm no coupons clip into the trunk (min radius 2).
