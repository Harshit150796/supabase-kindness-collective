## Goal
Shrink the hero landscape so the LiveActivityBar sits higher on both desktop and mobile.

## Change
In `src/components/landing/HeroSection.tsx`, reduce the section height:

- Mobile: `h-[62svh]` → `h-[52svh]` (~1 inch shorter on phones)
- Desktop: `md:h-[88vh]` → `md:h-[74vh]` (frees ~14vh on 16:9 laptops so the live tracking bar shows above the fold)

No other layout, camera, or tree-scene changes — the 3D scene already scales to its container, so it simply renders inside the smaller frame and the LiveActivityBar naturally moves up.

## Out of scope
- Camera/FOV tweaks inside `Tree3DScene` (current framing remains).
- Any changes to LiveActivityBar itself.
