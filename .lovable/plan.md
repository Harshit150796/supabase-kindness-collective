# Make the tree logos clearer, bolder, and unique

## Goal
Show a calmer set of clearly readable brand-logo fruits that still feel attached to the tree, remain visible during 360° rotation, and never duplicate a brand at the same time.

## Changes

1. **Reduce the visible density from 20 to 15 logos**
   - Rebalance the existing lower, middle, and upper canopy slots to keep coverage across the whole tree without crowding.
   - Keep the logos close to their branches; do not restore the earlier large outward offset.
   - Prioritize Uber, Amazon, CVS, Walmart, Target, McDonald’s, Instacart, and other recognizable brands in the opening view.

2. **Create small leaf-clearance pockets around logo fruits**
   - Thin only the leaf pixels immediately around each hanging logo so foliage does not cover the artwork.
   - Keep the trunk, branches, overall canopy shape, leaf colors, lighting, camera, environment, and protected scene settings unchanged.
   - Apply the same localized clearing around the tree so logos become readable as the viewer rotates 360°, without making rear logos incorrectly show through the entire tree.

3. **Strengthen weak logos without adding boards**
   - Tune optical sizing for wide or dark marks such as Uber, Amazon, CVS, Uber Eats, and Walgreens.
   - Add a restrained logo-shaped contrast edge where needed, preserving original brand colors and transparent silhouettes.
   - Keep the same logo rendering for hanging, falling, landed, and regrowing phases.

4. **Guarantee no simultaneous duplicate brands**
   - Keep the opening 15 brands unique.
   - Change the replacement queue so a fallen logo is replaced only by a brand not currently visible.
   - Preserve the non-repeating rotation through all 27 brands and stable slot positions.

5. **Verify the result**
   - Confirm the active brand list contains 15 unique names before and after repeated fall/regrowth replacements.
   - Check desktop and mobile views for spacing, leaf coverage, and readability of Uber, Amazon, and CVS.
   - Rotate through front, side, and rear views to confirm logos remain attached and visible without exposing rear logos through the canopy.
   - Confirm all local SVGs load and the project builds cleanly. If WebGL screenshot capture remains unavailable, report that limitation plainly.

## Technical notes
- Rework the canopy slot counts for 15 balanced lower/middle/upper positions rather than truncating the current 20-slot sequence.
- Pass the active hanging positions into the existing leaf shader and use small world-space alpha clearings only around those positions.
- Make replacement selection exclude every index in the current visible-brand set before dequeuing.
- No new packages, runtime network requests, rectangular logo backgrounds, visible hanging threads, or changes to protected camera/lighting/environment settings.
