# Homepage fundraiser row layout

## Goal
Replace the desktop's independent columns with two natural rows while leaving the mobile carousel unchanged.

## Changes
- Show the first two sorted fundraisers as equal-width featured cards with 16:10 images; show one full-width featured card when only one exists.
- Place every remaining fundraiser plus the start card in a 2-column tablet grid and 4-column large-desktop grid.
- Give titles consistent two-line space within each card size so details align without stretching cards or creating internal gaps.
- Preserve live totals, zero-donation copy, organizer capitalization, sorting, filtering, and image resolution.

## Verification
- Check the signed-out homepage at 390, 1024, 1280, and 1440 pixels wide.
- Confirm all five fundraisers and the start card occur once, campaign photos load, and no blank card region appears.
- Measure both featured image heights at 1280 and 1440 pixels and confirm the 1440-pixel images exceed 350 pixels.
- Check preview diagnostics after the change. Do not publish.
