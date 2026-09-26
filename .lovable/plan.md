# Sharpen and Restore the Hero Tree

## Goal
Make coupon fruits instantly readable, visibly attached across the canopy, and restore ambient life on normal devices without changing lighting, exposure, tone mapping, environment, colors, geometry, or camera.

## Investigation findings
- Coupon textures are already 2048×1280; the blur comes from too many tiny details at the final display size.
- `/public/brands` contains 27 favicon-style square assets: 16×16, 32×32, 48×48, 64×64, 96×96, or 128×128. They are not full wordmark assets.
- `PartnerBrands.tsx` currently uses emojis, names, categories, and unsupported contribution figures. Its wording is: “Donations convert into digital vouchers redeemable across 50+ available retail networks.”
- The approved current phrase is: “Every dollar, redeemable at” in the live retailer bar.
- Using small favicons as dominant coupon marks would produce inconsistent quality; branded coupon artwork may also suggest endorsement. Use bold text wordmarks instead, preserving the existing brand colors.
- Existing tier gates: low has no fireflies/ripple, 1 ambient bird, 6 plants; medium has no fireflies/ripple, 3 birds, 20 plants; high has 40 fireflies, ripple, 6 birds, 40 plants.

## Changes
1. Rebuild each coupon face as a two-element icon: dominant brand-colored field with a large wordmark, plus a large high-contrast dollar amount. Remove the trait pill and “GROCERY COUPON” label from both the canvas texture and desktop face.
2. Keep card size, silhouette, proportions, count, and every `COUPON_FRUITS` brand color unchanged.
3. Spread the existing 12 coupons deterministically across lower, outer, and upper branch attachment points. Add varied resting tilt and rotation.
4. Attach each card with a subtle stem/string whose endpoint moves with the card’s existing sway, so stem and card remain connected in wind.
5. Make firefly count tier-aware: low remains off, medium uses about 24, high uses 40. Restore trunk ripple on medium, set ambient birds to 1/4/8, and raise medium plant capacity toward high while keeping low conservative.
6. Add nonvisual measurement hooks only where needed for reproducible coupon-width, tier, and FPS evidence.

## Verification
- Preserve a baseline 1440px crop and capture an after crop at the same viewport and camera state.
- Measure actual rendered coupon width before and after; report the distribution and representative value.
- Capture night mode with visible fireflies.
- Measure FPS at 1440px and under mobile CPU throttling; scale back only the specific restored effect if it causes a measured regression.
- Publish before/after tier tables, confirm no console errors, and read the automatic build result.
- Explicitly compare protected lighting, exposure, tone mapping, environment, geometry, camera, colors, lazy loading, canvas fade, blend, wheel safeguards, leaf depth material, and alpha-to-coverage to ensure they remain untouched.
