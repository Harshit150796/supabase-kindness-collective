# Scroll-timed coupon journey

## What will change
- Keep the blue band, four icons, text and layout unchanged.
- Make the small coupon glide continuously through Donation → Allocation → Coupon → Use as you scroll, with no timed autoplay or pauses.
- Give each of the three transitions an equal share of scroll progress, so Allocation and Coupon are meaningful checkpoints rather than points the coupon rushes past.
- Scrolling back reverses the same movement; stopping scrolling holds the coupon in place.

## Timing and technical details
- The current movement uses the journey container's midpoint and a fixed half-viewport scroll range. Replace that with a range anchored to the actual four icons.
- On horizontal layouts, begin when the icon row reaches roughly 72% of the visible screen height and finish around 32%, keeping the entire trip visible. On stacked layouts, begin when Donation reaches that entry line and finish when Use reaches the finish line.
- Map progress 0, ⅓, ⅔ and 1 to the centres of the four icons; interpolate continuously between them using cached coordinates.
- Keep movement directly tied to scroll position, without a spring or delayed catch-up. Refresh geometry on layout/resize changes, not during scroll frames; update only the coupon transform, with no recurring work when off-screen or the tab is hidden.
- Update the scoped journey rule and add focused tests for checkpoints, clamping and reverse movement. No changes to other animations, payments or data.

## Verification
- Check slow scrolling, ordinary scrolling, fast passes, direction reversals, stopping between points and returning to the section.
- Verify all four checkpoints on phones, tablets and short/wide laptop screens, including the current 899×514 window; check resizing and upstream section loading for jumps.
- Confirm the coupon stays on the icon path, tests pass, the automatic build succeeds and there are no browser errors.
- Do not publish or deploy anything.