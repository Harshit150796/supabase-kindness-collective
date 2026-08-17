# Fix donor "name fall-off" labels on desktop and tablet

## What is actually wrong

The donor badge ("A generous donor donated $100") is rendered inside the 3D canvas as a Drei `<Html>` overlay anchored to the coupon's landing position, with `distanceFactor={8}` on desktop. Three separate defects combine:

1. **Scale is camera-distance driven, not viewport driven.** `distanceFactor` makes the badge grow as the camera gets closer (scroll zoom, orbit) and the hero is only `58svh / 74vh` tall, so the badge easily becomes 40-60% of hero height. This is the "extremely imbalanced size" seen in the screenshots.
2. **No edge containment on desktop/tablet.** The anchor is the raw landing point (`restPos`), pulled toward the scene centre only when `isMobile`. Coupons scatter on a radius up to 5.5 world units, so badges anchored near the ring edge are cut off by the hero's `overflow: hidden`, and the bottom ones are clipped by the section edge.
3. **Every landed coupon shows a badge at once on desktop.** `labelSuppressed` is `isMobile && lastLandedIdx !== i`, so on desktop 5-8 badges stack into the pile in the second screenshot. Mobile already got the "only the newest one" treatment — desktop never did.

There is also no tablet tier: `useIsMobile()` is a single 768px cut, so a 900px-wide tablet gets full desktop badge sizing in a much shorter canvas.

## The fix (recommended: Solution A)

Move the donor badge from a distance-scaled in-scene element to a **screen-space overlay with fixed pixel size and a safe-area clamp**, and show one badge at a time on every breakpoint.

1. **Fixed pixel size.** Drop `distanceFactor` for the label `<Html>` and render it unscaled (screen-space). The badge then has one predictable size at every zoom level and camera distance. Size tiers: mobile ~13px text / 26px avatar (unchanged), tablet ~14px / 30px, desktop ~15px / 32px — deliberately modest so it reads as a notification chip, not a billboard.
2. **Safe-area clamp so nothing is ever cut off.** Keep the world anchor (so the badge visually belongs to the coupon), but clamp the projected position into a padded rect of the canvas: pull the anchor toward the scene centre on all breakpoints (factor ~0.55 tablet, ~0.7 desktop) and add a CSS `translate` clamp using the canvas size, with 16-24px insets. Lift the anchor above the coupon and cap it below the hero headline zone so the badge never collides with the headline, the "Top Donors" panel, or the "Talk to Coupon" button.
3. **One badge at a time everywhere.** Change suppression to `lastLandedIdx !== i` regardless of breakpoint, with the existing 2.8s lifetime. Result: a single clean chip per landing, matching the first screenshot (which looks correct) and eliminating the pile-up in the second.
4. **Text fitting.** Keep the name truncation but tie it to the tier (12 chars mobile, 16 tablet, 20 desktop) and keep `text-overflow: ellipsis` with an explicit `max-width` on the name span, so a long donor name shortens gracefully instead of forcing the chip wider than the clamp.
5. **Tablet tier.** Add a small breakpoint helper (`mobile | tablet | desktop` from 768/1280) used only for these presentation values — no change to camera, leaves, foliage, lighting, or any 3D quality setting.

## Alternative solutions

**Solution B — keep in-scene scaling, just tame it.** Retain `distanceFactor` but lower it (≈14-16 desktop) and clamp the resulting scale each frame to a min/max pixel band, plus items 3 and 4 above. Smallest diff, keeps the badge feeling planted in the world, but size still drifts with zoom and edge clipping needs a separate guard — so it fixes "too big" more than "cut off".

**Solution C — full DOM notification layer outside the canvas.** Remove the badge from `CouponFruit` entirely; publish landing events to the interaction context and render a single React overlay in `HeroSection` that projects the world point to screen coordinates itself, with a stacking queue. Cleanest separation and the most control (animations, queueing, accessibility), but it is the largest refactor and touches the interaction context and hero layout.

**Solution D — bake the label into the 3D scene as a sprite.** Render the donor text as a canvas texture on a billboard sprite instead of CSS3D. Perfectly consistent with the coupon art and never escapes the canvas, but text stays raster (softer), and it re-introduces the same world-scale problem it is meant to solve.

Recommendation: Solution A. It fixes all three root causes with a contained change to one component plus a breakpoint helper, and preserves the mobile behaviour that already works.

## Technical scope

- `src/components/landing/tree3d/CouponFruit.tsx` — label `<Html>`: remove `distanceFactor`, add tiered fixed sizing, centre-pull + clamped offsets, tier-aware name truncation.
- `src/components/landing/Tree3DScene.tsx` — `labelSuppressed={lastLandedIdx !== i}` for all breakpoints; pass the device tier down.
- `src/hooks/use-mobile.tsx` (or a sibling helper) — add a `useDeviceTier()` returning `mobile | tablet | desktop`.
- No changes to tree geometry, leaf counts, textures, lighting, post-processing, camera rig, or coupon mesh/face rendering.

## Verification

- Playwright at 1440x900, 1024x768, 834x1112 and 390x844: trigger landings, screenshot the hero, confirm exactly one badge visible, fully inside the hero bounds, with consistent chip size across zoom states.
- Confirm badge never overlaps the headline, Top Donors panel, or chat launcher at any of those widths.
