# Shrink the Live Activity bar back to its previous height

The latest-donation pill (two lines: "LATEST DONATION" label + donor line) made the whole Live bar grow to ~99px tall — nearly double its previous ~52px. Shrink it so the bar returns to roughly its old height, keeping the two-line pill design and all other bar contents (donations count, raised-to-date, retailer logos) unchanged.

## What changes (all in `src/components/landing/LiveActivityBar.tsx`)

Container / section:
- Outer section padding `py-3 md:py-4` → `py-1.5 md:py-2`.
- Row `min-h-[44px]` → `min-h-[40px]`.

`DonationPill`:
- Pill padding `pl-4 pr-5 md:pl-5 md:pr-7 py-2.5 md:py-3` → `pl-3.5 pr-4 md:pl-4 md:pr-5 py-1 md:py-1.5`.
- Heart icon `w-5 h-5 md:w-[22px] md:h-[22px]` → `w-4 h-4 md:w-[18px] md:h-[18px]`.
- Label `text-[10px] md:text-[11px] ... mb-1` → `text-[9px] md:text-[10px] ... mb-0.5`.
- Donor line `text-sm md:text-base` → `text-xs md:text-sm`.

Nothing else in the bar changes — donations count, raised-to-date figure, and retailer logo strips stay as-is. No hardcoded colours; existing semantic tokens only.

## Verification
- Playwright measure: bar height ~52–58px, pill ~40–46px (was 99/65).
- `tail -5 /tmp/observability/build-errors.log` → build OK.
