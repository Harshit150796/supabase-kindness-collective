# Replace mobile sticky playback with in-view steps

## Diagnosis
- Confirm which branch mounts below 1024px and whether `useReducedMotion()` selects the static fallback on the tested browser profile.
- Remove the possibility of an incorrect reduced-motion default; only an explicit `prefers-reduced-motion: reduce` match may select static content.
- Preserve the existing desktop four-column clock, copy, receipt, transparency band, dignity line, doorways, and closing line.

## Mobile and tablet implementation
- Delete the sticky stage, `240svh` container, shared mobile scroll progress, band math, continuous morph component, and stage navigation calculations.
- Render four ordinary flow blocks below `lg`, each approximately `min-h-[80svh]`, with one existing illustration and its original internal choreography.
- Give every illustration a responsive 60vw container constrained to 200–260px, with a subtle token-colored aura.
- Trigger each scene with an intersection observer at about 45% visibility; replay from the beginning whenever it re-enters view and hold its completed state while visible.
- Animate step number, title, and body with staggered spring entrance after the illustration begins.
- Add a quiet four-step marker with non-blocking 44px touch targets that scroll to each normal-flow step.
- Keep reduced-motion steps stacked and complete, with no playback.

## Verification
- At 390px, capture every step and two distinct frames of one active animation; measure the illustration container and require at least 200px.
- Confirm the section has no sticky positioning, tall stage, mobile scroll-range math, or `svh` stage sizing.
- Verify replay when scrolling down and back up, explicit normal/reduced-motion branch behavior, no `preventDefault`, and no console errors.
- Check horizontal overflow at 320, 360, 390, 430, 768, 1024, and 1440px; compare the 1440px desktop grid with the baseline.
- Finish with a clean project build and provide the requested screenshots and measured findings.