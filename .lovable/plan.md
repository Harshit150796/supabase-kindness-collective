# Complete Instacart and tighten the logo fruit canopy

## Goal
Make Instacart unmistakably complete, reduce the visible logo fruits by about 10%, and bring the outer fruits back to the tree so the composition feels attached, balanced, and fruit-like from the opening view and through a full rotation.

## Confirmed current state
- The current Instacart artwork is a two-part compact symbol: green leaves above an orange semicircle. Its SVG is complete as authored, but that orange geometry is why it reads visually as “half a carrot” rather than the familiar full carrot.
- The tree currently shows 18 logo fruits. Reducing this to 16 removes two fruits, an 11.1% reduction, which is the closest whole-fruit match to the requested 10%.
- The largest current outward placements are in the middle canopy: several logo centers reach roughly 2.66–2.76 tree units from the trunk because broad branch radii and up to 0.52 units of additional outward clearance are combined.
- The build is currently clean and no runtime errors are recorded.

## Changes
1. **Use the complete Instacart carrot**
   - Replace the current abbreviated carrot symbol with a reputable, complete original-color Instacart carrot vector stored locally.
   - Preserve its native green/orange colors and proportions; do not stretch, crop, recolor, add a board, or add a visible thread.
   - Recheck its transparent bounds after rasterization so the carrot tip, leaves, and sides all remain visible in hanging, falling, landed, and regrowing states.

2. **Reduce visible fruit count from 18 to 16**
   - Rebuild the deterministic canopy as 4 lower, 6 middle, and 6 upper positions rather than merely truncating the old 18-position list.
   - Keep a strong front-view presence while retaining side and rear positions for 360° rotation.
   - Keep all 27 brands in the replacement rotation; only 16 are visible simultaneously, with no duplicate brand hanging at once.

3. **Pull edge fruits back into the foliage shell**
   - Narrow the broad middle-band horizontal radius and reduce the largest per-position outward clearances.
   - Use restrained position-specific clearance so logos sit just outside nearby leaves, not far beyond the crown.
   - Rebalance vertical spacing after the count reduction to avoid collisions without making edge fruits float away.
   - Keep natural partial leaf overlap, but protect the central recognizable area of each logo from complete burial.

4. **Preserve the existing experience**
   - Keep every logo’s authentic color, proportions, shared transparent rendering path, size treatment, sway, camera-facing behavior, fall motion, and non-repeating replacement behavior.
   - Do not change the tree model, leaves, branches, lighting, camera, environment, exposure, tone mapping, fog, sky, scene colors, orbit behavior, or ambient effects.

## Verification
- Render the replacement Instacart vector by itself and confirm the complete carrot is visible with transparent bounds.
- Confirm exactly 16 distinct logos appear and all 27 brands remain available in the replacement queue.
- Measure the revised outermost logo-center radius against the current 2.76-unit maximum and confirm it is materially closer to the canopy.
- Check opening, approximately 90°, 180°, and 270° views plus phone width when WebGL capture works; verify Instacart in hanging and falling states.
- Confirm all local logo files load, no runtime errors are introduced, and the build remains clean. If sandbox WebGL blocks a view, report that limitation plainly rather than claiming visual verification.
