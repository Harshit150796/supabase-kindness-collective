# Fix falling donor name cards on desktop and tablet

The mobile fix already solved this problem. The plan is to port exactly those mobile rules to desktop and tablet, in the same file, without touching the tree, leaves, coupons, or rendering quality.

## What the mobile fix actually did (found in the code)

In `src/components/landing/tree3d/CouponFruit.tsx` and `src/components/landing/Tree3DScene.tsx`, mobile got five changes:

1. Only one label at a time — `Tree3DScene` tracks `lastLandedIdx` and passes `labelSuppressed={isMobile && lastLandedIdx !== i}`, so overlapping cards can never stack.
2. Tighter landing ring — scatter radius `1.6 + unit * 1.7` on mobile vs `1.8 + unit * 3.7` on desktop (desktop cards drift almost to the viewport edge).
3. Less horizontal jitter on the fall — `0.06` vs `0.2`.
4. Label anchor pulled toward scene centre — `restPos.x/z * 0.7` on mobile, `* 1` on desktop.
5. Smaller badge lifted higher — `distanceFactor 5.5` vs `8`, `+0.85` vertical offset vs `+0.55`, plus reduced padding, radius, font sizes, avatar size, and `maxWidth` (170 vs 260).

The uploaded screenshots show exactly the desktop symptoms this fixes: stacked overlapping cards and cards clipped at the bottom of the canvas.

## Changes to make

All in `src/components/landing/tree3d/CouponFruit.tsx` plus one line in `src/components/landing/Tree3DScene.tsx`:

- Show only the most recently landed label on every viewport: change `labelSuppressed={isMobile && lastLandedIdx !== i}` to `labelSuppressed={lastLandedIdx !== i}`. This removes the stacking seen in the screenshots.
- Bring the desktop/tablet scatter ring in: `1.8 + unit * 3.2` (still wider than mobile, so coupons stay spread over the grass, but clear of the edges).
- Reduce desktop fall jitter from `0.2` to `0.12`.
- Pull the desktop label anchor toward centre with a `0.8` factor (mobile keeps `0.7`), and raise the vertical offset from `+0.55` to `+0.75` so the card is not clipped by the canvas bottom edge.
- Shrink the desktop badge toward the mobile proportions: `distanceFactor` 8 -> 6.5, padding `12px 19px` -> `10px 15px`, radius 14 -> 13, font 16 -> 14, avatar 34 -> 29, gap 12 -> 10, `maxWidth` 260 -> 210, name `maxWidth` 190 -> 150, amount font 16 -> 14, sub-line 13 -> 12, and name truncation 18 -> 14 characters.

Tablets use the same non-mobile branch, so they inherit these values automatically — no new breakpoint is introduced.

## Not changing

Tree geometry, leaf count, foliage, coupon mesh/texture, lights, camera, and all mobile values stay exactly as they are.

## Verification

Load the landing page at desktop (1280 wide) and tablet (~834 wide) widths with Playwright, wait for coupons to drop and land, and screenshot to confirm: one label at a time, fully inside the canvas, not clipped at the bottom, and not overlapping the Top Donors panel or the chat launcher.
