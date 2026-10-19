# Nudge hero buttons down and move the moon further right

## What changes
1. **Buttons about 1mm lower.** 1mm is about 4px on screen, so the gap above the tree goes from 40px to 36px on laptops and from 32px to 28px on phones. Nothing else about the buttons changes.
2. **Moon (and daytime sun) further right on laptops and wider screens.** The space kept clear between the buttons and the moon goes from 168px to about 260px. The moon still stays fully inside the picture on narrow laptop windows, with a small margin from the right edge, so it is never cut off.
3. Phones keep the moon where it is now. There it already sits clear of the buttons and the header.

## Check
- Measure at 1280x800, 1440x900 and 1920x1080, plus a 390x844 phone. Confirm the buttons are evenly spaced above the tree and the moon sits clearly to the right of them without touching the edge.

## Technical details
- `src/index.css`: `.hero-cta` offsets `+ 32px` → `+ 28px` and `+ 40px` (min-width 768px) → `+ 36px`. Update the matching comment.
- `src/lib/heroBackdrop.ts`: `ORB_CLEARANCE_PX` 168 → 260. `orbX` already limits the moon to the frame (12px edge margin), so the sun and moon in the painted fallback and in the live tree (`Sky.tsx`) both follow.
- Update `src/components/landing/AGENTS.md` (gap values). Run `hero-handoff_test.ts` and adjust any expected values in it that depend on the clearance.
