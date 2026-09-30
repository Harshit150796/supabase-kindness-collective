# Official Instacart and CVS logo correction

## Goal
Replace the improvised tree artwork with authentic, complete brand artwork and make both logos immediately clear in the opening view without disturbing the tree’s established look or motion.

## Verified findings
- Instacart publishes a current, downloadable full-color carrot SVG in its official logo package. The official mark uses the complete orange carrot and green arrow-shaped leaves; the current local SVG is a hand-drawn approximation.
- CVS publishes an official CVS Health vector whose red heart and CVS letterforms can supply the authentic compact tree mark. The current local heart-and-name SVG is also an approximation.
- CVS currently opens in slot 1, near the center/front but with only `0.42` leaf clearance. Instacart opens in slot 5 at the far-left edge, despite having strong leaf clearance.
- Both logos already use the shared preload, high-resolution texture, silhouette outline, and lifecycle path, so the correction can remain local and deterministic.

## Implementation
1. **Replace the Instacart source completely**
   - Use the unmodified official full-color carrot SVG from Instacart’s current downloadable logo package.
   - Keep its original proportions, orange/green colors, and transparent background.
   - Retain it as an emblem so it remains recognizable at fruit scale.

2. **Replace the CVS source with authentic artwork**
   - Build the compact tree asset from the official CVS vector’s original red heart and red CVS letterforms, without redrawing or recoloring them.
   - Crop transparent whitespace tightly while retaining the official spacing and proportions.
   - Keep the compact heart-plus-CVS treatment rather than the much wider CVS Health lockup, which would become too short at tree scale.

3. **Improve opening placement and clarity**
   - Move Instacart from the extreme side-facing opening position into a genuinely front-visible slot while preserving the 18 fixed slots and color balance.
   - Move the displaced brand to Instacart’s former slot so the brand set and fruit count do not change.
   - Increase CVS’s slot-specific leaf clearance from `0.42` to approximately `0.50`, then tune only its optical scale if necessary.
   - Use a dark silhouette edge for Instacart so its green leaves remain distinct against the canopy; preserve the original logo pixels.

4. **Keep all existing tree behavior intact**
   - Preserve lighting, colors, materials, exposure, tone mapping, camera, orbit, canopy geometry, fruit count, fall physics, sway, and regrowth.
   - Keep every logo local and preloaded; add no runtime network requests or packages.
   - Use the same corrected artwork for hanging, falling, landed, and regrowing states.

5. **Verify**
   - Validate the two SVGs for parseability, transparent bounds, official colors, and successful preload.
   - Confirm the opening brand list still contains 18 unique allowed brands.
   - Check CVS and Instacart visibility at desktop and phone widths, including opening, movement, fall, and regrowth when WebGL capture is available.
   - Confirm the project preview reports a clean build; document any remaining automated WebGL limitation honestly.

## Authoritative references
- Instacart’s current logo download: https://docs.instacart.com/developer_platform_api/guide/concepts/design/logos/
- Instacart’s identity explanation: https://company.instacart.com/updates/carrot-evolution-a-new-brand-identity
- CVS Health’s official media library: https://www.cvshealth.com/news/media-library.html
- CVS Health’s official public vector: https://www.cvshealth.com/content/dam/enterprise/cvs-enterprise/logos/CVS_Health_logo.svg
