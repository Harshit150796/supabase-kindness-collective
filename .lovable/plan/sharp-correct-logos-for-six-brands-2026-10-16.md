# Sharp, correct logos for six brands

## Problem
Subway, Costco, Publix, Postmates, Best Buy and Lowe's show tiny, low-resolution website icons (under 1.5 KB each). They look blurry wherever they appear: the retailer picker, the "Every dollar, redeemable at" strip, partner sections, donor and recipient coupon screens, and admin pages.

## Fix
- Get clean, official vector logos (SVG) for all six from each brand's own press or brand resources, or from trusted logo sources such as Wikimedia Commons. Check the colors and shape against the real brand.
  - Subway: yellow and green wordmark
  - Costco: red and blue Costco Wholesale mark
  - Publix: green wordmark
  - Postmates: black wordmark or mark
  - Best Buy: yellow tag with black text
  - Lowe's: blue house mark with white text
- Store them locally in the site's brand-logos folder. No live logo services.
- Point all six brands in the shared brand list to the new files, so every page that shows these logos updates at the same time.
- Crop out empty space so each logo sits at the same visual size as its neighbors, without distortion.
- Existing Subway, Costco and Publix vector files are checked first. They are reused only if they are correct and render cleanly; otherwise they are replaced.

## Not changing
- The 3D tree's logo set. Postmates stays removed from the tree. Subway, Costco and Publix in the tree are updated only if they use the same files.
- Other brands, colors, layout, prices or donation logic.

## Verification
- Screenshots of the retailer picker, the redeemable-at strip and a coupon view on desktop and phone, showing all six logos sharp.
- Confirm every logo file loads with no errors and no blank tiles.
