## Goal

Make the sprouting plants feel like real flowering rose bushes growing around the tree, and make the falling coupon *become* the flower at the top of the plant — so the donor name visibly blooms on a stem. Keep the scene calm and uncluttered by limiting how often a plant is allowed to grow.

## What changes (visual & behavior)

### 1. Plant size, shape, and feel — "rose plant"
- Roughly **2× current size**. Target heights:
  - Sprout: ~0.45–0.55 m
  - Flowering rose: ~0.7–0.85 m
  - Mini bush: ~0.6–0.75 m, wider footprint
- Replace the flat petal shape with a **layered rose bloom**:
  - 3 concentric rings of curled petals (5 / 6 / 7 petals), each ring slightly rotated and tilted inward to suggest a real rose.
  - Petal color = brand accent, with a soft pastel highlight on inner petals and a deeper saturated tone on the outer ring (so the bloom reads as dimensional, not flat).
  - Tiny golden center (existing CENTER_COLOR), slightly raised.
- Stem upgrade:
  - Slightly thicker base, gentle taper, very subtle bend (not perfectly vertical).
  - 3–5 oval rose-style leaves with serrated silhouette (use a refined leaf shape — wider, with a small notch — keeping it cheap geometry).
  - 2–3 sparse "thorn" specks on the stem (tiny dark cones) — only on the rose archetype, optional and very subtle.
- Bush archetype becomes a **rose bush**: 3 stems, each topped with a smaller rose bloom (not buds). Same per-instance materials, just smaller blooms.

### 2. The falling coupon *becomes* the flower
This is the headline change. Right now the coupon lands on the ground and a separate plant grows next to it. Instead:

- When a coupon's fall reaches ground contact (or the catch-and-land path), it **does not lie on the grass**. It triggers a `spawnPlant` and is then *consumed* — the coupon mesh fades out over ~0.25s while the stem rises.
- The plant grows from the landing point, and at the top of the stem the **coupon card itself is re-attached as the bloom centerpiece**:
  - The coupon shrinks to a small "flower-card" size (~35–45% of falling size), tilts to face the camera, and sits nestled inside the rose petals.
  - The donor name + amount remain readable on the card — so the visual reads as "this person's donation literally bloomed into a rose."
- The petals form *around* the card (card sits flat, petals fan outward and slightly forward), so from the default camera angle the donor card is the focal point and the rose frames it.
- Sway: card sways with the stem as one unit (already handled by the group transform).

### 3. Spawn rate limit (calm scene)
- Hard cap: **at most 1 new plant every 3 seconds**, max **8 active plants** on desktop, **5 on mobile**.
- If donations land faster than the cooldown allows, the extra coupons skip the plant transformation and just fade out quietly at the landing point (no awkward pile-up, no queue buildup).
- Plants persist for the rest of the session (no auto-fade), but if the cap is exceeded the **oldest** plant fades out over 0.6s to make room (FIFO, same as today, just at the new lower cap).

### 4. Placement
- Plants spawn at the coupon's landing XZ with small jitter (±0.12m).
- Add a soft exclusion radius (~0.4m) around the tree trunk so plants never grow on top of roots.
- Add a minimum spacing (~0.35m) between active plants so the rose garden looks composed, not clumped — if the random landing spot is too close to an existing plant, nudge outward along the vector from that neighbor.

## Files

**Edit**
- `src/components/landing/tree3d/PlantSprout.tsx`
  - New rose-bloom geometry helper (3-ring layered petals, curled via rotation on each petal).
  - New rose-leaf shape geometry (replace generic teardrop).
  - Increase base height constants ~2×.
  - Add an optional `couponMesh` slot at the top of the stem (a positioned group the parent can fill).
- `src/components/landing/tree3d/PlantsLayer.tsx`
  - Lower default cap to 8 (desktop) / 5 (mobile).
  - Track `lastSpawnTime`; if `now - lastSpawnTime < 3s`, ignore the incoming `plantEvent` (and emit a flag the coupon can read to know it should just fade).
  - Min-spacing nudge logic before committing the new plant's position.
  - Pass full `FallingDonation` (or the subset needed: brand color, donor name, amount, design data) into `PlantSprout` so the bloom can render the same coupon card.
- `src/components/landing/tree3d/InteractionContext.tsx`
  - Extend `PlantEvent` with the donation payload needed to render the card-as-bloom (donor name, amount, brand, color, coupon design id).
  - Add `requestPlant(donation, position) → boolean` (returns whether the plant will actually spawn given the cooldown), so `CouponFruit` can decide to consume itself either way (fade) but only convert to a bloom when accepted.
- `src/components/landing/tree3d/CouponFruit.tsx`
  - On ground contact / catch-land:
    - Call `requestPlant(...)`.
    - Always fade the falling coupon out over ~0.25s (so the coupon never lies on the grass anymore).
    - If `requestPlant` was accepted, the plant takes over and re-renders the coupon card as its bloom.
  - Skip the existing "lie flat on grass" resting state.
- `src/components/landing/Tree3DScene.tsx`
  - Pass updated caps (8 / 5) to `<PlantsLayer />`.

**No new files.** `couponDesign.ts` already has the card geometry/material helpers; the plant will reuse them at smaller scale so the bloom-card looks identical to the falling card.

## Performance notes

- Cap of 8 plants keeps total extra meshes tiny.
- Rose bloom = ~18 petals + 1 center per plant. With cap 8 → ≤144 small meshes total, all reusing 1 cached petal geometry and 4 materials per plant.
- Coupon-as-bloom reuses the existing cached coupon geometry/material from `CouponFruit`, just at smaller scale — no new texture work.
- Cooldown gating means we never spawn more than ~20 plants per minute, well within budget.

## Out of scope

- No DB/schema changes, no donor-name logic changes, no admin UI.
- No new npm packages.
- Tree, fireflies, ground, sky, transparency popover — untouched.

## Verification

On `/`:
- A coupon falls → at ground contact it does **not** lie on the grass; instead a stem rises and the same coupon card becomes the rose's bloom at the top, framed by layered petals in the brand color.
- Plants are clearly ~2× larger than before and read as rose plants from the default camera.
- Trigger the shake cascade with many coupons → only 1 plant grows every ~3 seconds; extra coupons just fade quietly at landing.
- Total active plants never exceeds 8 (5 on mobile); when exceeded, the oldest fades out.
- Plants don't grow on the trunk and don't visibly overlap each other.
- Sway and wind still feel consistent with the tree.
