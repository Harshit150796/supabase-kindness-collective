## Plan to fix blurry hanging coupon text

### Goal
Make the brand names, amount, labels, and coupon visuals on the tree readable and crisp at the current preview size, not just higher-resolution but still blurred by 3D perspective, mipmaps, lighting, and post-processing.

### What I found
- The coupon artwork is currently drawn into a canvas texture in `couponDesign.ts`, then mapped onto a small 3D extruded mesh in `CouponFruit.tsx`.
- Even at 4× texture size, text still gets softened because it is minified on a tiny angled 3D object, affected by mipmap filtering, material lighting/emissive maps, bloom/vignette post-processing, and leaf occlusion.
- This is a rendering approach issue, not only an image-resolution issue.

### Implementation
1. **Keep the 3D coupon card shape**, but simplify its material so it no longer reuses the full coupon texture for emissive lighting that can wash out the text.
2. **Render the readable coupon content as crisp vector/UI overlay on the front face** using Drei `Html` anchored to each coupon, so text and logos remain browser-rendered instead of rasterized into a shrinking texture.
3. **Create a compact coupon face component** matching the reference: brand color stripe, sharp brand text/logo area, pill label, amount, and coupon label.
4. **Hide or reduce text in the canvas texture fallback**, leaving the 3D base/background as the card surface while the overlay carries the legible content.
5. **Adjust occlusion/scale/positioning** so the overlay sits just above the coupon face, follows the hanging/falling/landed coupon transform, and does not get buried by tree leaves.
6. **Reduce blur contributors** for coupons: avoid mipmap-softened text, keep texture filtering appropriate for the base card, and ensure post-processing bloom does not bloom over the coupon typography.
7. **Verify visually on the home route** at the current viewport and make any sizing tweaks so Costco/CVS/amount text is noticeably sharper.

### Expected result
The coupons will still feel attached to the 3D tree, but their visible text/logo/amount will be much clearer because it will be rendered as sharp vector/browser text instead of a tiny rasterized texture on a moving 3D mesh.