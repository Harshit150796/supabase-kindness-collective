# Bold, accurate logo fruits

## Goal
Turn the tree’s brand fruit into prominent, crisp, correctly colored logo silhouettes—without rectangular boards or visible hanging threads—and expand the canopy beyond the current 12 brands.

## Brand set
Keep the current brands:
- Walmart, Uber, DoorDash, Target, Instacart, Lyft, Starbucks, Amazon, Grubhub, McDonald’s, eBay, Aldi

Add the selected groups:
- Grocery: Kroger, Whole Foods, Publix, Trader Joe’s
- Food delivery: Uber Eats, Postmates, Seamless
- Restaurants: Domino’s, Taco Bell, Subway, Chipotle
- Essentials: CVS, Walgreens, Costco, Home Depot

This produces a 27-brand set, subject to verifying that the tree exposes enough usable branch locations. If it exposes fewer, cycle brands across the available locations rather than crowding or changing the tree.

## Visual redesign
- Replace the current monochrome-white-and-recolor pipeline with local SVG artwork that preserves each company’s actual logo colors, including eBay’s multicolor letters.
- Use each logo’s true transparent silhouette and aspect ratio; no rectangular board, coupon card, plate, or generic color wash.
- Normalize by visible artwork bounds—not SVG canvas size—so narrow and circular logos have comparable optical prominence.
- Increase logo-fruit scale carefully and apply per-brand optical sizing so thin marks such as Walmart and detailed marks such as Aldi remain bold and readable without overwhelming the canopy.
- Preserve brand-specific details: multicolor logos remain multicolor; single-color marks use their correct official presentation; light marks receive only a subtle contour/back layer shaped to the logo itself when contrast requires it.
- Remove every visible stem/thread. Keep the invisible branch-relative pivot so wind sway, falling, landing, and regrowth continue naturally without a visible connector.

## Asset and rendering work
- Audit the current 12 SVGs and source or create local, transparent SVG assets for all 27 brands from official brand resources or trustworthy vector sources.
- Do not use runtime logo services or network requests; all assets ship locally.
- Preserve multicolor SVG paint instead of applying `source-in` recoloring.
- Decode and cache each logo once, crop to visible alpha bounds, rasterize at high resolution, and reuse the result for every animation phase.
- Keep a nonblank per-brand fallback if an asset cannot decode.
- Continue using the single WebGL silhouette path for hanging, falling, landed, and regrowing logos so no second visual implementation can drift.
- Keep donation interactions and falling behavior intact while expanding the fruit-state list safely for the larger brand set.

## Protected scene behavior
Do not change the tree, branches, leaves, camera, lighting, environment, fog, Sky, exposure, tone mapping, color tokens, fireflies, birds, plants, donation timing, wheel behavior, or any section outside the hero tree logo fruit.

## Verification
- Produce a local asset table for all 27 brands with filename, format, dimensions/viewBox, color mode, and load status.
- Confirm eBay renders with individually colored letters and spot-check several other multicolor logos against their source artwork.
- Capture a tight 1440px crop showing the larger hanging logos clearly across the canopy.
- Capture a mobile crop to ensure the increased prominence does not overlap excessively or leave the viewport.
- Capture two different sway frames and one mid-fall frame, confirming there are no visible stems and the same crisp logo remains through every phase.
- Check all local logo requests for failures, inspect browser console/runtime errors, and confirm the preview build is clean.
- If software WebGL still prevents reliable screenshots, report that limitation plainly rather than claiming visual verification.

## Technical notes
- Update the logo data model to support original multicolor artwork and per-brand optical scale/contrast treatment.
- Remove the current flat recoloring pass that forces every glyph into one color.
- Maintain transparent alpha-tested materials, anisotropy, mipmaps, sRGB handling, and the existing shared texture cache.
- Keep the current no-new-package constraint and mobile performance budget; measure impact after raising the visible fruit count and reduce duplicate instances—not logo quality—if performance regresses.
