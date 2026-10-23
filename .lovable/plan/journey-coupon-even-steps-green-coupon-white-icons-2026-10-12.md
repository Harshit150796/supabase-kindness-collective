# Journey coupon: even steps, green coupon, white icons

## What will change
- The small moving coupon is no longer white: it becomes logo green with a thin white outline so it still stands out on the blue band.
- The four step icons (Donation, Allocation, Coupon, Use) are drawn in solid, full-strength white, with no faded or see-through look, so they read clearly as fixed stops.
- The coupon keeps moving 1 → 2 → 3 → 4 in equal steps as you scroll: each scroll distance moves it the same amount, it reverses when you scroll back, and it stays put when you stop. The scroll range will be checked again so the coupon reaches point 4 while the row is still comfortably on screen, even in the current 899×514 window.
- Text, layout, blue background and other animations stay the same.

## Technical details
- `CouponScrollPath.tsx`: marker rect fill becomes `hsl(var(--primary))` with a `hsl(var(--background))` stroke; the dotted guide stays light.
- `TrustTransparency.tsx`: icon class becomes full-opacity white (the band's light foreground token); remove any reduced opacity on the icons.
- Keep the even-segment mapping in `journeyScrollTiming.ts`; adjust the start and end lines only if checks on short windows show point 4 being reached off screen. Update the tests if the range changes.

## Verification
- Use the browser to scroll slowly, normally and in reverse at 899×514, a laptop size and a phone size; confirm equal spacing at all four points, a green coupon and solid white icons.
- Tests pass and the build succeeds. Nothing is published.
