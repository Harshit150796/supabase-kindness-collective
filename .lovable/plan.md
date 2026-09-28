# Rebuild the hero tree’s logo fruits with authentic brand marks

## Goal
Make every logo fruit feel deliberate, recognizable, and premium: authentic company artwork, correct original colors, balanced visual size, clear separation from leaves, and convincing hanging/falling motion without turning logos into boards or oversized banners.

## What the audit confirmed
- The tree currently uses 18 stable logo slots across lower, middle, and upper canopy bands, with a front-loaded opening view and full-orbit coverage.
- All 27 brands rotate through a non-repeating queue; a fallen logo is replaced by a different available brand when the same slot regrows.
- Hanging, falling, landed, and regrowing states already share one transparent WebGL plane and one cached texture source, so there is no separate mobile or falling face to keep synchronized.
- Several supplied assets are the wrong presentation for this scene: Walmart and Instacart are full horizontal lockups rather than compact emblem marks, while Uber and Amazon use inverse white artwork.
- Current geometry scales by broad aspect-ratio tiers. This produces approximately 0.98 scene-unit height for square emblems but only 0.19–0.38 for wide marks such as DoorDash, CVS, Instacart, Walmart, Uber, and Amazon. Additional per-brand multipliers then make some wide logos larger without solving their very low visible height.
- Every successful logo currently receives a thick alpha-shaped contrast outline. It improves separation but can make small artwork look sticker-like and can visually alter delicate brand details.
- The latest build is clean. Reliable live 3D screenshot evidence is not currently available from the sandbox because its browser capture did not produce a WebGL canvas; visual claims will be rechecked if the preview renderer exposes one during implementation.

## Brand-authentic asset pass
1. Inventory all 27 hero-tree SVGs by brand, mark type, viewBox, visible bounds, embedded colors, and suitability at tree-fruit size.
2. Prefer the official standalone emblem or compact primary mark when it is recognizable without text:
   - Walmart spark rather than the complete Walmart wordmark.
   - Instacart carrot rather than the complete Instacart wordmark.
   - Compact marks for brands such as Target, McDonald’s, Starbucks, Domino’s, Home Depot, Taco Bell, and Postmates where the emblem is the stronger fruit silhouette.
3. Keep a wordmark or combined lockup only where removing the name would make the brand unclear. Do not invent symbols, redraw letterforms, stretch artwork, or combine unrelated versions.
4. Restore each asset’s authentic presentation colors. In particular, use black Uber artwork and black Amazon lettering with its orange smile, rather than recoloring them white. Preserve multicolor artwork such as eBay, Aldi, Instacart, Domino’s, Costco, and Subway exactly.
5. Keep every asset local. Use no runtime logo service, external image request, new package, or raster substitute when a suitable vector is available.

## Optical sizing system
1. Replace the coarse aspect-ratio tiers with measurements based on each cropped mark’s visible width, visible height, and occupied alpha area.
2. Define one target perceived area range for emblem marks and another for legitimate wordmarks, with minimum and maximum height limits so:
   - very wide marks remain readable rather than becoming thin strips;
   - circular and square emblems do not become oversized;
   - no logo is stretched or squeezed;
   - no per-brand scale can exceed a safe canopy footprint.
3. Retain small per-brand optical corrections only for genuine visual-density differences, document their purpose, and remove compensating multipliers made unnecessary by the new sizing model.
4. Keep all 18 fruit slots, but assign larger or wider marks to roomier deterministic slots and compact emblems to tighter slots. Preserve slot stability, the front bias, lower/middle/upper coverage, and complete 360° population.

## Visibility without changing the logo
- Preserve each original logo’s pixels and colors.
- Replace the uniform heavy outline with a restrained, alpha-derived contrast treatment chosen from measured logo luminance: a thin light edge around dark marks and a thin dark edge around light marks. The treatment follows only the transparent silhouette—never a rectangle, plate, card, glow cloud, or banner.
- Keep the logo immediately in front of its local leaf layer so foliage does not cut through the mark, while preserving the impression that it belongs to the canopy rather than floating away from it.
- Confirm black Uber and Amazon marks remain visibly black; improve their separation through the outside keyline and placement, not by recoloring the artwork.

## Fruit-like motion and lifecycle
- Preserve the invisible branch-relative pivot, individual tilt, gentle pendulum sway, camera-facing behavior while hanging, and free tumble while falling.
- Keep visible threads and rectangular backings absent.
- Add no second rendering path: the same authentic cropped texture, proportions, size calculation, and material must remain in use while hanging, falling, landed, and regrowing.
- Keep the current replacement queue so old logos fall and new brands regrow without duplicate brands hanging simultaneously.
- Tune only logo-fruit presentation where needed; do not alter donation timing, physics intent, tree geometry, branches, leaves, camera, FOV, orbit limits, lighting, environment, fog, Sky, exposure, tone mapping, ambient effects, page scrolling, or site color tokens.

## Verification
- Produce a final 27-brand audit table showing chosen mark type, source file, embedded colors, visible aspect ratio, rendered dimensions, and load result.
- Programmatically confirm all SVGs decode, contain no external references, preserve aspect ratio, and map one-to-one with the 27 configured brands.
- Confirm Uber remains black; Amazon remains black/orange; eBay remains multicolor; Walmart uses its blue/yellow emblem; Instacart uses its original-color carrot.
- Measure every rendered logo and report the smallest/largest visible height and area before and after, checking that no mark is stretched or disproportionately dominant.
- Inspect front, side, and rear tree views at 1440px plus the current phone viewport for overlap, leaf occlusion, distribution, and recognizability.
- Capture hanging, mid-fall, landed, and regrowing frames for representative compact, wide, dark, light, and multicolor marks; verify the same artwork and proportions persist through every phase.
- Exercise enough replacements to confirm no duplicate hanging brands and that omitted brands enter through the queue.
- Check build, browser console, runtime errors, local asset requests, and representative performance. If WebGL capture remains unavailable, report the unverified visual checks plainly instead of claiming success.

## Technical constraints
- No new npm packages.
- No runtime network requests for logos.
- Keep the single cached transparent texture pipeline, anisotropy, mipmaps, alpha testing, and sRGB handling.
- Preserve all protected hero-tree scene settings and all non-tree page behavior.
