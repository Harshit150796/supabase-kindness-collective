## Goal
When a coupon falls from the tree and hits the ground, the brand-coupon card should disappear immediately. Only the floating donor name pill (above the sprouting plant) should remain visible during the landed phase. After the pill fades, the coupon regrows on the branch as today.

## Changes — `src/components/landing/tree3d/CouponFruit.tsx`

1. In the `landed` phase render block, do not render the coupon group (rounded card mesh, gold glow, `<CouponFace>` HTML overlay, white back face). The plant sprout (spawned via `spawnPlant` on landing) and the donor name pill `<Html>` continue to render.
2. Keep the existing `landed`-phase timing (`elapsed > 5` triggers `onRegrown`) so the regrow cycle is unchanged.
3. Keep the `showLabel` donor pill exactly as is (visible for ~2.8s after land).
4. Skip the squash/settle frame work for the now-hidden group (cheap guard, no behavior change).

## Out of scope
- No changes to hanging sway, falling physics, sparkle burst, plant sprout, regrow animation, or any other scene element.
- No changes to `CouponFace`, `couponDesign.ts`, or texture generation.
