# Replace coupon boards with floating logo silhouettes

## Result
The tree’s fruits will become compact, crisp brand-logo shapes rather than oversized rectangular coupon banners. Each mark will keep its exact SVG proportions and use its existing brand color.

## Changes
1. **Build transparent logo assets for the tree**
   - Continue using the twelve local SVG files already supplied.
   - Decode each SVG once, rasterize it at high resolution, detect its visible bounds, and crop away all transparent space.
   - Recolor the white SVG glyph to the existing brand color without altering its paths or proportions.
   - Keep a clean wordmark fallback for a failed decode so no fruit appears blank.

2. **Remove the coupon-board presentation**
   - Remove the rounded rectangle, white border, colored field, dark Amazon plate, glow box, back panel, and dollar amount from the tree fruit face.
   - Render only the tightly cropped logo silhouette on transparency.
   - Size each fruit from the logo’s true aspect ratio, with a restrained common maximum dimension so wide and circular marks feel balanced instead of oversized.
   - Use alpha-tested, double-sided WebGL materials so the transparent rectangle is never visible and the logo remains readable when it turns or falls.

3. **Unify hanging and falling fruits**
   - Replace the separate desktop HTML face and baked coupon face with one shared high-resolution WebGL logo treatment.
   - Use that same object through hanging, falling, landed, and regrowing states, preventing stale or mismatched faces.
   - Keep the existing twelve brands, count, branch assignments, stem attachment, sway, tilt, fall behavior, interactions, and donor labels unchanged.

4. **Preserve the protected scene**
   - Do not alter the tree, camera, lighting, exposure, tone mapping, environment, fog, Sky, color tokens, fireflies, birds, plants, page sections, or scroll behavior.
   - Add no packages and make no runtime network requests.

## Verification
- Confirm all twelve local SVGs load successfully with no failed requests.
- Capture a tight 1440px view showing the hanging logos as recognizable silhouettes with no visible rectangles.
- Capture a second frame with a logo mid-fall and confirm the same crisp treatment remains visible.
- Check circular, square, and wide marks individually for correct proportions, transparency, and balanced size.
- Check desktop and phone layouts for overlap or clipping.
- Confirm the current build is clean and report any remaining visual limitation plainly if the software-rendered browser cannot provide reliable 3D evidence.

## Technical details
- Generate one transparent high-resolution canvas texture per brand from the cached cropped SVG raster.
- Preserve anisotropy 16, mipmaps, linear mipmap minification, linear magnification, and sRGB color handling.
- Derive each plane’s width and height from the cropped logo bounds rather than forcing every mark into the former coupon aspect ratio.
- Use an alpha threshold for clean silhouettes and retain pointer interaction on the logo plane.
