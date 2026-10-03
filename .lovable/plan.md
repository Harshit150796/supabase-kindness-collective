# Restore the original fundraiser showcase with one balanced addition

## Build
- Restore the original desktop 1.3fr / 1fr arrangement and spacing from commit `3978a95524433924e9ef286b242a07071468613a`.
- Keep the lead card at natural height, add the conditional second desktop lead, and keep mobile unique and unchanged.
- Keep “Be the first to give” and display-only organizer capitalization while restoring the original `text-3xl` compact titles.
- Make the Start fundraiser tile span both compact columns and absorb only the remaining vertical space so both desktop columns align.

## Verify
- Check signed-out screenshots at 1024, 1271, 1280, 1440, and 390 pixels.
- Measure both lead-image heights and both desktop column bottoms; confirm four compact campaigns, one Start tile, visible photos, and no blank region.
- Confirm the preview builds and runs without page errors. Do not publish.

## Technical details
- Changes stay limited to the homepage fundraiser presentation and its shared card rendering.
- No fundraiser records, payment behavior, mobile ordering, hero, or tree code changes.
