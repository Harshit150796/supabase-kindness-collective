# Tree Logo Clarity and Opening Arrangement

## Goal
Make the opening tree feel polished, colorful, and immediately readable while preserving the existing 3D tree scene and interactions.

## Changes
- Replace the current CVS artwork with a tightly cropped, official red CVS heart/wordmark treatment and increase its optical size so it reads clearly without distortion.
- Refine the Instacart carrot into a clean, correctly proportioned full emblem with recognizable green leaves and orange carrot body.
- Remove Trader Joe's, eBay, and Postmates (the yellow bicycle) from the tree's complete rotation, including opening, replacement, falling, landed, and regrowth states.
- Rebuild the 18-brand opening selection with recognizable, colorful brands such as Walmart, CVS, Target, McDonald's, Instacart, Amazon, Starbucks, Domino's, Aldi, and complementary green/red/blue marks.
- Reorder the opening brands by the tree's existing front-facing slots so key logos occupy clear canopy positions, wide wordmarks do not crowd each other, and similar colors are distributed across the tree.
- Keep all remaining logos preloaded before fruit meshes appear, preserving their original colors and proportions with no blank placeholders.

## Validation
- Confirm the removed brands never appear in the tree or its replacement queue.
- Confirm CVS and Instacart remain sharp and correctly proportioned through hanging, falling, landed, and regrowth states.
- Check the opening composition at 390px and 1440px for overlap, clipping, visual balance, and instant logo readiness.
- Verify the existing tree lighting, materials, geometry, camera, exposure, tone mapping, orbit behavior, motion, and donation interactions remain unchanged.

## Technical Notes
- Limit edits to the tree's local logo assets and shared brand/slot configuration.
- Use the existing shared WebGL logo pipeline and 18 deterministic canopy slots; add no packages or runtime network requests.
- Update the project architecture note only if the tree's persistent brand-set rule changes.
