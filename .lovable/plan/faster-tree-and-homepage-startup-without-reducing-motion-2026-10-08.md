# Faster tree and homepage startup without reducing motion

## Goal
Make the homepage and live tree appear sooner on phones, tablets, and laptops while preserving every animation and the approved live tree’s lighting, colors, materials, camera, geometry silhouette, exposure, and tone mapping.

## Confirmed findings
- The tree download is 1,268,364 bytes and contains 130,441 triangles; its separate baked leaf mesh accounts for 51,251 triangles.
- The current `leafCount: 7000` setting does not remove any leaves, so lowering that number alone would not improve loading or rendering.
- Five of the 18 opening logo-fruit positions are rear-facing. The current logo module also starts loading all 26 brand textures before they are needed.
- The opening poster is only 1440×616 and uses one crop for every screen shape, which explains why its framing and apparent tree size differ from the responsive live cameras.
- The live retailer rail marks every logo copy as eager, adding avoidable image work during tree startup.

## Changes
1. **Reduce the real leaf geometry safely**
   - Create a lighter copy of the existing tree model by removing a conservative portion of fully obscured/interior leaf geometry from the separate leaf mesh—not by lowering the ineffective setting.
   - Keep the trunk, visible canopy silhouette, textures, materials, wind shader, shadows, lighting, camera, exposure, and tone mapping unchanged.
   - Compare the original and optimized live tree at the opening view and during orbit. Keep the original model if the silhouette or finish changes noticeably.

2. **Remove hidden logo fruit and defer unused brands**
   - Remove the five rear/occluded opening fruit positions rather than mounting invisible apples inside the canopy.
   - Load only the visible opening logos at startup. Load later replacement logos on demand before their existing drop/regrow animation uses them.
   - Preserve the current logo sizing, interaction, drop timing, regrowth, shake, plant, bird, firefly, wind, and orbit motion.

3. **Replace the mismatched opening poster**
   - Capture clean poster frames from the actual rendered tree after its approved materials and camera settle.
   - Produce separate optimized desktop and phone WebP posters so each matches the live tree’s size and framing at transition time.
   - Keep the poster first and high priority for slow connections; crossfade it only after the live canvas has produced a ready frame, avoiding a flash or size jump.

4. **Reduce competing homepage startup work**
   - Make duplicate/offscreen retailer logos decode lazily while keeping the rail’s universal 48-second animation and all touch/hover motion unchanged.
   - Confirm no below-the-fold chart, image, or request is pulled into the critical tree-loading window unnecessarily; retain the existing section animations and reserved layout heights.

## Verification
- Record model bytes, triangle counts, initial logo requests, initial transferred bytes, poster dimensions, and time to first poster/live-tree frame before and after.
- Visually compare poster-to-tree transition and tree silhouette at 390×844, 844×390, 768×1024, 1024×768, and 1440×900, including DPR 2/3 phone simulations.
- Exercise orbit, logo drops/regrowth, wind, plants, birds, fireflies, all four giving steps, 95¢ animation, reveals, count-ups, story motion, testimonials, and the retailer rail.
- Check top-to-bottom-to-top scrolling, no horizontal overflow, no layout-height drops, console/runtime errors, and slow-network poster behavior.
- Add focused regression checks for no rear opening fruit, startup-only logo preloading, preserved motion settings, and poster readiness; run the existing tests, TypeScript check, and automatic build.

## Limits
- No new npm packages, payment/data changes, cookie-bar changes, animation removal, or publishing.
- Physical-device timing remains unverified unless tested on real hardware; browser network/device simulations will be reported separately.
