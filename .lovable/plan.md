# Refine hero-tree logo fruit sizing and visibility

## Goal
Reduce every logo fruit by 15–20% so the canopy feels balanced and fruit-like, while improving separation from leaves and preserving each brand’s authentic artwork, colors, and proportions.

## What the audit confirmed
- Logo geometry is currently normalized by visible alpha area, with separate emblem and wordmark targets, then adjusted by a small per-brand optical scale.
- The current limits allow emblems up to 1.08 × 1.02 scene units and wordmarks up to 1.62 × 0.72 before their optical correction.
- The 27 assets vary substantially: compact emblems are close to square, while marks such as CVS, Uber Eats, Subway, Grubhub, Publix, Costco, Amazon, and Uber are substantially wider.
- Logos currently sit 0.28 scene units in front of their branch-relative canopy slots and use a thin alpha-shaped light or dark edge for leaf contrast.
- The current build is clean and no runtime error is recorded.

## Size update
1. Add one explicit optical reduction factor per brand class without changing native proportions or the visible-alpha sizing model:
   - **20% smaller:** dense compact emblems that currently carry the most visual mass—Walmart, DoorDash, Target, Instacart, Starbucks, McDonald’s, Aldi, Kroger, Whole Foods, Postmates, Domino’s, Taco Bell, Chipotle, Walgreens, and Home Depot.
   - **17.5% smaller:** medium-width or visually dense marks—Lyft, eBay, Seamless, and Costco.
   - **15% smaller:** wide/thin wordmarks that need more height retained for readability—Uber, Amazon, Grubhub, Publix, Trader Joe’s, Uber Eats, Subway, and CVS.
2. Apply the factor through the shared fruit scale so it remains identical while hanging, falling, landed, and regrowing.
3. Keep the existing 18 stable slots, brand rotation queue, logo assignments, motion, and all protected tree/camera/lighting settings unchanged.

## Visibility after reduction
- Increase the alpha-derived keyline slightly in texture space so reduced dark marks such as Uber and Amazon remain distinct from foliage, while light marks receive the corresponding dark edge.
- Keep the keyline restrained and attached only to the real transparent silhouette—no board, plate, glow, thread, recoloring, or fabricated shape.
- Move the shared logo face only a few hundredths of a scene unit farther toward the outside of its local canopy, enough to reduce leaf intersections without making logos look detached from branches.
- Preserve camera-facing behavior while hanging and regrowing, and preserve free tumbling while falling.

## Verification
- Calculate and report each brand’s old and new rendered width, height, and percentage reduction.
- Confirm all 27 SVGs still decode locally, preserve aspect ratio, and retain original colors.
- Confirm the same reduced dimensions and artwork are used through hanging, falling, landed, and regrowing states.
- Check opening, side, and rear views for collisions and leaf occlusion, plus the current phone viewport where rendering permits.
- Check build, browser console, runtime errors, and local logo requests. If WebGL capture remains unavailable, state that visual verification is incomplete rather than claiming it passed.

## Technical constraints
- No new packages or runtime network requests.
- Do not alter tree geometry, logo slot layout/count, branches, leaves, camera, FOV, orbit limits, lighting, environment, fog, Sky, exposure, tone mapping, page colors, donation timing, or non-tree behavior.
