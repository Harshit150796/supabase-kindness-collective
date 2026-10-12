# Clear green coupon and evenly paced journey

## Changes
- Change the moving coupon from white to the site's logo green, using semantic colour tokens, with a clear light ticket detail.
- Keep the four Donation, Allocation, Coupon and Use icons crisp white throughout the journey. Prevent the moving ticket from visually filling or masking their outlines at checkpoints using a small blue clearance behind each icon.
- Preserve the blue background, wording, sizing and layout.

## Scroll behaviour
- Retain direct scroll-controlled movement: equal scrolling moves the coupon equal progress through 1 → 2 → 3 → 4, with each transition receiving one-third of the travel range.
- Keep movement continuous without autoplay, pauses or delayed catch-up. Stopping holds its position; scrolling back reverses it.
- The current timing helper already divides travel evenly. Verify its real screen behaviour rather than add another animation system; correct only any demonstrated alignment or timing discrepancy.

## Technical scope
- Limit presentation changes to the moving coupon, icon clearance and any required scoped semantic tokens in the global stylesheet.
- Keep cached geometry and transform-only scroll updates; no per-frame layout measurements.
- No payment, data, opening or other section changes.

## Verification
- Confirm the ticket is visibly green and each white icon remains recognizable when the ticket passes it.
- Check all four checkpoints, intermediate movement, stopping and reverse scrolling at the current 899×514 size, a wide screen and a stacked phone layout.
- Run focused timing tests and check the automatic build and browser errors.
- Do not publish or deploy.