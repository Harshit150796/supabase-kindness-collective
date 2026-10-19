# Correct Grubhub logo on the tree

## Problem
The tree currently hangs a home-made stand-in for Grubhub: an orange square with a white "G" that was drawn by hand, not Grubhub's real artwork. The older full "GRUBHUB" capital-letter file is also an outdated version of the logo.

## Changes
1. Find Grubhub's current official logo from trustworthy sources (Grubhub's own site and brand pages, Wikimedia Commons), and check it against what Grubhub's website and app show today.
2. Save it locally as a clean, transparent vector file in its true colours and proportions. No hand-drawn letters, no added boxes.
3. Use it on the tree:
   - If Grubhub's official app icon or emblem is available as genuine artwork, use that, because it stays readable at fruit size.
   - Otherwise use the official current wordmark, made slightly larger so it can be read.
4. Delete the hand-made "G" file. Use the same correct logo in the store picker and on coupon screens, so Grubhub looks the same everywhere.

## Not changing
The tree, the other logos, lighting, motion, falling and regrowing, and the list of brands.

## Verification
- Compare the new file side by side with Grubhub's live website logo.
- Check the logo loads, the build is clean, and the existing tree tests pass.
- Screenshot it in the store picker. The test browser can't draw the 3D tree, so you'll need to check the logo on the tree yourself.

## Technical details
- Replace `public/brand-logos/grubhub-mark.svg` / `grubhub.svg` with the sourced official SVG.
- Update the Grubhub entry in `src/components/landing/tree3d/couponDesign.ts`: set mark type and optical scale to match the artwork.
- Point `brandLogos.ts` Grubhub at the new SVG instead of the favicon PNG.
