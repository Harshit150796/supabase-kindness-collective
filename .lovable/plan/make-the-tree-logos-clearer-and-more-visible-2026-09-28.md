# Make the tree logos clearer and more visible

## Result
The logo fruits will remain clean, transparent brand silhouettes, but each visible logo will separate clearly from nearby leaves and the opening arrangement will feel deliberate rather than crowded. The same treatment will remain effective as the tree rotates.

## Changes
1. **Separate logos from leaves without making them float**
   - Move each hanging position only slightly forward from its branch-relative slot, enough to prevent common leaf intersections while keeping the logo visually attached to the canopy.
   - Preserve every stable slot, all lower/middle/upper canopy bands, full-orbit coverage, and the existing fall/regrowth behavior.

2. **Give every brand a clean visibility edge**
   - Add a restrained, high-resolution light keyline around the actual transparent logo silhouette—not a rectangle, plaque, glow board, or thread.
   - Keep each company’s original colors and proportions intact, including multicolor marks such as eBay.
   - Retain stronger brand-specific separation only where artwork needs it, while avoiding fuzzy shadows.

3. **Refine the opening assembly**
   - Adjust the 20 deterministic canopy slots within their existing height bands to reduce front-view collisions and distribute visual weight across the lower, middle, and upper foliage.
   - Keep a strong opening-camera bias, with side and rear logos ready to become visible naturally during 360° rotation.
   - Preserve CVS and the current recognizable mix in the initial set; omitted brands continue entering through the non-repeating replacement queue.

4. **Preserve the protected scene**
   - Do not change the tree, branches, leaves, camera, FOV, orbit behavior, lighting, environment, fog, Sky, exposure, tone mapping, colors, ambient effects, donation timing, or page layout.
   - Add no packages, runtime requests, fixed boards, or visible hanging threads.

## Verification
- Check desktop and phone opening views for readable logos with minimal leaf clipping and no severe logo-to-logo overlap.
- Rotate through front, side, and rear views to confirm nearby logos become clear without rear logos incorrectly showing through the tree.
- Trigger a fall and regrowth to confirm the replacement logo inherits the same clean silhouette, stable slot, and visibility treatment.
- Confirm all 27 local SVGs load and the build remains clean.
- If software WebGL again prevents reliable screenshots, report that limitation rather than claiming visual proof.

## Technical details
- Keep the shared transparent WebGL logo path for hanging, falling, landed, and regrowing phases.
- Generate the keyline from the cached alpha silhouette before texture upload so it follows the logo exactly and remains crisp with mipmaps and anisotropy.
- Use modest deterministic slot-coordinate adjustments and minimum projected spacing rather than changing the tree geometry or increasing the logo count.
