# Slim the Live bar, slow its desktop marquee, refresh its copy

## What changes (all in `src/components/landing/LiveActivityBar.tsx`)

### 1. Desktop marquee is too fast
The `animate-marquee` utility runs at a global `10s` (tailwind.config.ts line 162). On desktop that feels too fast; on phones it feels right because phones reporting `prefers-reduced-motion` get the `60s` gentle override via `useMotionPreference`.

Fix without touching mobile:
- Add `lg:[animation-duration:40s]` to the marquee `<div>` className.
- Keep the existing `style={gentle ? { animationDuration: '60s' } : undefined}` so gentle mode stays `60s` on every device.
- Result: mobile full = `10s` (unchanged), mobile gentle = `60s` (unchanged), desktop full = `40s` (slower), desktop gentle = `60s` (unchanged). Inline style still wins over the `lg:` class for gentle mode.

### 2. New copy (selected: "Every dollar, redeemable at")
Replace the left text block:
- Eyebrow `Shop with choice` → remove it (one fewer line, less height).
- Heading `Redeemable at` → `Every dollar, redeemable at`.
- Sub `Choose familiar brands for every coupon.` → `Pick the familiar brands where your coupons are spent.`

### 3. Text is too big / bar too thick
Shrink the left block and the section padding so the strip reads as a slim transition band, not a heavy card:
- Section: `py-4 md:py-5` → `py-2.5 md:py-3`.
- Left block width: `md:w-[230px]` → `md:w-[200px]`.
- Heading: `text-lg font-bold md:text-xl` → `text-sm font-semibold md:text-base`.
- Sub line: `text-xs text-muted-foreground md:text-sm` → `text-[11px] text-muted-foreground md:text-xs`.
- Keep `text-center md:text-left` and the shrink-0 anchoring.

Nothing else in the bar changes — the logo tiles, marquee mask, reduced-motion behaviour, export, and homepage placement stay as-is. No hardcoded colours; existing semantic tokens only. No new packages.

## Verification
- Playwright desktop (1280x1800): marquee visibly slower than before; bar height notably slimmer; copy reads "Every dollar, redeemable at" + the new sub line.
- Playwright mobile (390x1800): marquee speed unchanged from current (still feels "perfect"); copy updated; no overflow.
- `tail -5 /tmp/observability/build-errors.log` → build OK.
