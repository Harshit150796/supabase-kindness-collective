# Continuous testimonial motion

## Goal
Remove the testimonial pause control and make both testimonial rows and the featured account continue cycling without interruption.

## Changes
- Remove the Pause/Play button, its icons, pause state, and related control logic from the testimonial section.
- Keep both moving rows running continuously, including during hover, keyboard focus, press, and while the section is outside the viewport.
- Keep the featured testimonial rotating on its timer after a visitor selects a line, rather than permanently stopping on that choice.
- Rebalance the section heading area after removing the control: align the description cleanly with “In their own words.” and tighten the empty space before the moving rows across phone, tablet, and laptop layouts.
- Preserve line selection, the full-account panel, accessible duplicate handling, testimonial wording, colours, and all other page content.
- Update the landing-page rule and the focused testimonial test so they describe and enforce uninterrupted motion instead of pause behavior.

## Verification
- Run the focused testimonial test and the existing shared Deno test suite.
- Confirm the project build passes.
- Check the homepage testimonial section at phone and laptop widths: no pause control, balanced heading placement, both rows moving, and the featured account continuing to rotate after selection.
