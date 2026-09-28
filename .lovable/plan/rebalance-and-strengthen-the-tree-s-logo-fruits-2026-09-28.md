# Rebalance and strengthen the tree’s logo fruits

## Result
The tree will open with a fuller, clearly readable spread of brand-logo fruits across its lower, middle, and upper canopy. Wide wordmarks such as CVS will receive enough visual area to read confidently, and every logo will sit close enough to the foliage to feel like fruit rather than a detached sign.

## Changes
1. **Make every brand readable at its displayed size**
   - Replace the single long-edge sizing rule with optical sizing that considers both the logo’s aspect ratio and visible area.
   - Give especially wide, narrow, or detailed marks targeted corrections so CVS, Walgreens, Costco, Subway, Uber Eats, and similar logos do not become tiny.
   - Keep each original vector’s proportions and colors; never stretch, recolor, add a board, or reintroduce a stem.
   - Preserve the existing high-resolution transparent texture path for hanging, falling, landed, and regrowing logos.

2. **Bring the fruits back into the tree**
   - Remove the large outward displacement currently applied to every hanging position.
   - Place logo centers just in front of nearby foliage, with a small depth allowance to prevent leaf clipping while keeping them visually attached to the canopy.
   - Keep positions stable while the tree rotates and while brands cycle into a slot.

3. **Fill the complete canopy**
   - Increase the visible slots from 16 to a restrained 20 so the first view feels populated without becoming crowded.
   - Rebuild the slot distribution as explicit lower, middle, and upper height bands around the full tree.
   - Bias more slots toward the camera-facing half for a strong initial view, while retaining enough side and rear slots that the tree remains populated through a full 360° rotation.
   - Use deterministic spacing and minimum separation to avoid logo collisions and preserve the existing falling/replacement behavior across all 27 brands.

4. **Preserve the protected scene**
   - Keep the tree model, branches, leaves, camera, FOV, orbit behavior, lighting, environment, fog, Sky, exposure, tone mapping, colors, ambient effects, donation timing, and page layout unchanged.
   - Add no packages and make no runtime network requests.

## Verification
- Check the initial desktop and phone views for a visibly fuller front canopy and readable wide logos.
- Inspect lower, middle, and upper canopy coverage and confirm logos sit within or immediately against the foliage rather than floating far outside it.
- Rotate through front, side, and rear views and confirm the tree remains populated without severe overlaps.
- Trigger a fall and regrowth to confirm the replacement brand inherits the same stable position and sizing treatment.
- Confirm all 27 local SVGs still load and the build remains clean.
- If software WebGL still prevents reliable screenshots, report that limitation plainly rather than claiming visual proof.

## Technical details
- Keep stable numeric slot keys and the current non-repeating replacement queue.
- Derive plane dimensions from cropped alpha bounds plus per-brand optical corrections, with sensible minimum rendered height/area for long wordmarks.
- Generate deterministic banded canopy coordinates without modifying the tree geometry itself.
