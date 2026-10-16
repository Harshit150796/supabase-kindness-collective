# Remove the red apples and make small logos readable

## Result
The tree shows only its trunk, branches, leaves and the brand logos — no red apples tucked in the canopy. Grubhub (and any other logo that reads as tiny text) hangs as its recognisable emblem instead of a long brand name.

## Changes
1. **Remove the red apples**
   - The tree model holds a reddish part (separate from the trunk and leaves) that appears as apples inside the canopy. Remove that part from the model so it is never downloaded, drawn, shadowed or prepared at startup.
   - Confirm in a screenshot that the apples are gone and the trunk, leaves and colours are unchanged. If that part turns out to be trunk detail rather than apples, stop and report instead of removing it.

2. **Grubhub as an emblem**
   - Replace the long orange "GRUBHUB" wordmark with Grubhub's official emblem artwork (local file, original colours), sized like other emblems so it reads clearly.
   - Review the other wordmark logos on the tree (Uber, Lyft, Amazon, Publix, Uber Eats, Subway, CVS, Costco) at phone and laptop size; any that are still too small to read get the same emblem treatment, or a modest size increase where the brand is wordmark-led.

## Not changing
Tree shape, leaves, lighting, sky, camera, rotation, opening, falling/regrowth behaviour and the list of brands.

## Technical details
- Strip the primitive using `Material.004` from mesh `tree` in `public/models/tree.glb` (re-encode with Draco), shrinking the download; fall back to dropping it at load in `Tree.tsx` if re-encoding risks the geometry.
- Add `public/brand-logos/grubhub.svg` emblem; set Grubhub to `mark: 'emblem'` in `couponDesign.ts`.
- Verify with Playwright screenshots and existing tree tests.
