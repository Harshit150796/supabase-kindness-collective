## Plan: Refine Mobile 3D Coupon Landing & Donor Label Visibility

### Goal
Make the falling coupons in the hero tree land with a slightly wider, more natural spread on mobile, and increase the fallen donor-name labels by ~20% so they are easier to read, without clipping the screen edges or overlapping UI.

### Current state
- `CouponFruit.tsx` line 215: mobile scatter radius is `1.3 + unit * 1.3` (≈1.3–2.6 units). Users report coupons land too tightly under the tree.
- Donor label (lines 449–508) uses `fontSize: 11px` on mobile and `13px` on desktop; avatar is `22px` mobile / `28px` desktop. Users say it is hard to read.
- The label is vertically offset `+0.7` units on mobile and pulled `30%` toward the scene center to prevent edge clipping.

### Changes to make

1. **Slightly widen mobile scatter radius**
   - File: `src/components/landing/tree3d/CouponFruit.tsx`
   - Change the radius formula on mobile from `1.3 + unit * 1.3` to `1.6 + unit * 1.7` (≈1.6–3.3 units).
   - Keep desktop radius unchanged (`1.8 + unit * 3.7`).
   - Verify the `state.restPos.x * 0.7` clamp still keeps the label within the canvas after the wider spread; if test screenshots show clipping, nudge it to `0.62`.

2. **Increase donor label size by ~20%**
   - File: `src/components/landing/tree3d/CouponFruit.tsx`
   - Bump font sizes:
     - Mobile label text: `11px` → `13px`
     - Desktop label text: `13px` → `16px`
     - Mobile subtext: `10px` → `12px`
     - Desktop subtext: `11px` → `13px`
   - Bump avatars:
     - Mobile: `22px` → `26px`
     - Desktop: `28px` → `34px`
   - Bump amount/price text:
     - Mobile: `11px` → `13px`
     - Desktop: `13px` → `16px`
   - Adjust padding and maxWidth to keep the label comfortable:
     - Mobile padding: `7px 11px` → `8px 13px`
     - Mobile maxWidth: `150px` → `170px`
     - Name truncation: keep `12` mobile chars but widen the inner span so it uses the new maxWidth.
   - Raise the mobile label anchor slightly to avoid the "Ask Coupon" button:
     - Mobile Y offset: `+0.7` → `+0.85` units.

3. **Verify with mobile preview**
   - Check the user’s preview on a mobile viewport after the changes.
   - Confirm coupons no longer clump directly under the tree, labels are readable, and no label overlaps the bottom-right action button.

### No-go
- Do not change desktop scatter radius (already looks good).
- Do not re-enable multiple labels on mobile; keep single-label behavior to avoid stacking.
- Do not change the coupon mesh size, only the label overlay.

### Risk
The larger label + wider radius could reintroduce edge clipping on the smallest phones. I will watch the first preview screenshot and dial back radius or clamp if needed.