Revert the recent mobile hero height increase to lift the live activity bar back up.

## Change
In `src/components/landing/HeroSection.tsx`:
- Mobile height: `h-[58svh]` → `h-[50svh]` (about 1cm shorter on a typical phone)
- Desktop height: unchanged (`md:h-[74vh]`)

## Out of scope
- No changes to the 3D scene, overlays, or LiveActivityBar itself.
