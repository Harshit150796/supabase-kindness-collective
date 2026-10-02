# Fix homepage fundraiser card balance

## Build
- Stop desktop grid stretching and render the first two sorted fundraisers as stacked lead cards when at least four campaigns exist.
- Put remaining fundraisers and the start card in the right two-column grid without duplicates; use one lead for smaller result sets.
- Keep lead card metrics in normal document flow, add truthful zero-donation messaging, reduce small-card title sizing, and capitalize organizer names for display only.
- Tune image proportions and gaps at desktop breakpoints while leaving the mobile carousel unchanged.

## Verification
- Check the signed-out homepage section at 1024, 1280, 1440, and 390 pixels, including reduced motion.
- Confirm five distinct campaigns and visible photos, two desktop lead cards, the zero-donation treatment, and measure both desktop column heights.
- Check the preview build and record the work in the roadmap. Do not publish.
