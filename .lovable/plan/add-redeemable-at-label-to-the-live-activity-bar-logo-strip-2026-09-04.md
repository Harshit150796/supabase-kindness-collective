# Add "Redeemable at" label to the Live Activity bar logo strip

Bring back a small "Redeemable at" label immediately before the revolving brand logos on the right of the Live Activity bar (matching the reference image), keep the logos at their current size, drop one logo from the loop so the new label fits, and re-tighten the center stats so the whole row still fits cleanly on desktop.

## What changes (all in `src/components/landing/LiveActivityBar.tsx`)

Desktop logo strip (the `hidden lg:flex` block):
- Add a static label `<span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground whitespace-nowrap flex-shrink-0">Redeemable at</span>` as the first child, before the marquee window.
- Remove the `max-w-xs` cap on the strip container so the label + logos don't clip; let `justify-between` handle spacing.
- Reduce the loop from `popularBrands.slice(0, 6)` to `popularBrands.slice(0, 5)` (both the originals and the duplicated set), so one fewer logo offsets the added label width. Logo circles stay `w-8 h-8` with `w-5 h-5` images — no shrinking.

Center stats (the Quick Stats block):
- Tighten the two stats so the new right section has room: change the wrapper gap from `gap-4 md:gap-6` to `gap-3 md:gap-4`, and drop the `hidden sm:inline` qualifier text to keep each stat as icon + bold number + short word (`donations`, `raised`) so the block stays compact at all widths.

Nothing else changes — the donation pill on the left, the real donation data, the donations count (24) and raised figure ($1,250), and the mobile marquee row all stay as-is. No hardcoded colours; existing semantic tokens only.

## Verification
- Playwright desktop (1280x1800) screenshot of the bar: "Redeemable at" visible left of the logos, all three sections on one row with no overflow/clipping, bar height ~64px.
- `tail -5 /tmp/observability/build-errors.log` → build OK.
