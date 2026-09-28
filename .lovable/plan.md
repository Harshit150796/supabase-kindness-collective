# Make every tree logo complete and clearly visible

## Result
Every fruit will use a complete, authentic brand mark with its original colors and proportions. Logos will remain attached to the canopy and partly nestled among leaves, but none should disappear completely from its intended viewing side.

## Confirmed findings
- The same `0.28` outward offset is currently applied to all 18 slots, even though lower, middle, upper, front, side, and rear slots have different foliage depth.
- Aldi opens in an upper rear slot; Instacart, Walgreens, Lyft, Kroger, and Domino’s also open behind the canopy. They can remain buried until the tree rotates.
- Several opening-view slot pairs nearly occupy the same screen position, including Publix/Instacart, Walgreens/Kroger, Subway/Aldi, and Amazon/Subway.
- The logo material still uses normal depth testing, so leaves correctly hide artwork that sits behind them; a render-order change alone cannot solve the placement problem.
- The current CVS SVG contains only one path from the wordmark and is not a complete CVS mark. The other 26 files contain usable vector artwork, but each still needs an individual rendered inspection.

## Changes

### 1. Validate and repair all 27 logo assets individually
- Render each local SVG alone on transparent light, dark, and leaf-green backgrounds.
- Check full bounds, path completeness, viewBox behavior, transforms, strokes, gradients, original colors, and whether any edge is clipped after rasterization.
- Replace the incomplete CVS vector with a complete authentic CVS mark from a reputable vector source.
- Keep authentic compact emblems where they are recognizable: Walmart spark, Instacart emblem, Target, Starbucks, McDonald’s, Aldi, Kroger, Postmates, Domino’s, Taco Bell, Chipotle, Walgreens, and Home Depot.
- Keep complete wordmarks where the name is essential: Uber, DoorDash, Lyft, Amazon, Grubhub, eBay, Whole Foods, Publix, Trader Joe’s, Uber Eats, Seamless, Subway, CVS, and Costco.
- Preserve every mark’s original vector colors and proportions. Do not recolor black Uber or black/orange Amazon, flatten multicolor marks, stretch artwork, or substitute text.

### 2. Give every brand an explicit optical profile
Audit and tune these individually: Walmart, Uber, DoorDash, Target, Instacart, Lyft, Starbucks, Amazon, Grubhub, McDonald’s, eBay, Aldi, Kroger, Whole Foods, Publix, Trader Joe’s, Uber Eats, Postmates, Seamless, Domino’s, Taco Bell, Subway, Chipotle, CVS, Walgreens, Costco, and Home Depot.

For each brand, record:
- mark class and authentic asset variant;
- visible aspect ratio and alpha coverage;
- optical scale correction;
- minimum readable height for wide wordmarks;
- silhouette edge color and thickness based on the artwork’s actual light/dark regions;
- crop inset needed to prevent fine strokes or outer rings from being cut.

Use these measurements instead of broad emblem/wordmark assumptions. Keep the recent overall 15–20% reduction as the baseline; only correct brands whose real visible area is unusually sparse or dense.

### 3. Rebuild the 18 slots around actual visibility
- Keep 18 stable lower/middle/upper canopy anchors and the existing brand replacement queue.
- Replace the single global face offset with a small per-slot visibility profile: radial clearance, vertical correction, and safe logo footprint.
- Move each anchor only far enough to clear its local leaf layer. Keep the pivot branch-relative so every fruit still reads as growing from the tree rather than floating outside it.
- Separate the confirmed collision pairs in projected screen space without changing tree geometry or reducing the brand count again.
- Keep an intentional front bias on load, but distribute rear and side slots over the outer canopy shell so they become fully readable when rotated into view.
- Reorder the initial 18-brand assignment so Aldi and other currently buried brands start in slots suited to their shape; future replacements inherit the slot’s safe placement without duplicating a hanging brand.

### 4. Add a restrained leaf-occlusion safety rule
- Keep normal depth testing so rear logos do not show through the trunk or entire tree.
- Allow realistic partial leaf overlap around a fruit’s edge, but calibrate each slot so a protected central recognition area remains unobstructed from that slot’s outward viewing arc.
- Do not use `depthTest={false}`, X-ray rendering, rectangular plates, glow boxes, threads, or fake backgrounds.
- Keep camera-facing hanging/regrowing artwork, free tumbling while falling, and the same authentic texture through hanging, falling, landed, and regrowing phases.

### 5. Preserve the protected tree experience
Do not change lighting, exposure, tone mapping, environment, fog, Sky, tree/leaf/branch geometry, camera, FOV, orbit limits, color tokens, fireflies, birds, plants, donation timing, wheel/touch behavior, or page sections. Add no packages and make no runtime network requests.

## Verification
- Produce a 27-row audit showing asset completeness, original colors, proportions, optical size, and final result for every brand.
- Capture isolated before/after logo sheets to prove no SVG is partial or clipped.
- Verify the opening view plus approximately 90°, 180°, and 270° rotations at desktop width; every slot must be readable when it reaches its outward-facing arc.
- Verify phone width separately for leaf overlap, logo-to-logo collisions, and edge clipping.
- Capture two sway frames for a front, side, and rear slot to confirm the fruit stays attached and does not pass back through leaves.
- Trigger falls from emblem and wordmark slots, then confirm the complete logo remains visible while falling and the replacement brand appears in the same safe slot.
- Confirm all 27 local assets load without failed requests, the build is clean, and no protected scene values changed.
- If software WebGL still prevents reliable screenshots, provide the isolated render evidence and numeric slot checks, and state the missing live-tree verification plainly.

## Technical details
- Extend branch-tip metadata with deterministic per-slot visibility corrections rather than altering the tree model.
- Keep brand-specific optical metadata in the existing logo data source; keep slot-specific placement metadata in the canopy layout source.
- Measure projected logo rectangles and enforce spacing between neighboring slots at the opening camera, while retaining complete orbit coverage.
- Keep the current shared high-resolution canvas texture path, anisotropy, mipmaps, sRGB handling, transparent silhouette, alpha test, and fallback behavior.
