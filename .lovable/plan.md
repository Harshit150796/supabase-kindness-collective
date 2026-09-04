# Rebuild the strip under the hero: real last donation + progress-to-goal

## What changes

Three decisions, now locked:

1. **"Live program" box: gone.** It said nothing and it read as filler.
2. **The donation pill becomes real.** One donation — the most recent completed one in the database — with its real donor display name, real amount, real retailer and a real timestamp. No rotation every 3.5s, no generated names, no fake "10s ago".
3. **The hardcoded counters are replaced by a progress-to-goal bar** promoting one goal, with a "Fund the next voucher" call to action.

## The reality check that shapes this

Live database values:

- Most recent completed donation: `Harshit A. · $10 · DoorDash · Jun 12, 2026` — that is ~3 months old.
- 19 completed donations, $1,214 converted, 116 vouchers created, 10 live campaigns.
- Biggest live campaign: "Warm Meals for a Man and His Best Friend" — $60 of $200, 4 donors.

So a literal "3 months ago" under the hero would be honest but self-defeating. The standard solution used by GoFundMe and Kickstarter on quiet campaigns: **stop framing it as recency, frame it as the ledger.** Label the pill "Latest donation" and show an absolute date (`Jun 12`) instead of a relative age. Relative time only appears when the donation is genuinely recent — under 7 days it renders "2h ago", "3d ago", and only then does the live dot pulse. Older than that, the dot goes calm and the date shows. Nothing is fabricated, nothing draws attention to a gap.

## New layout — one row, three zones

```text
desktop (single row, aligned baselines, no wrapping)
┌──────────────────────────────┬───────────────────────────────────────────┬──────────────┐
│ LATEST DONATION              │  Fund 1,000 grocery vouchers              │ Redeemable   │
│ ♥ Harshit A. · $10 DoorDash  │  ███████░░░░░░░░░░  116 of 1,000 funded   │ at [logos]   │
│   Jun 12                     │  [ Fund the next voucher → ]              │              │
└──────────────────────────────┴───────────────────────────────────────────┴──────────────┘

mobile / tablet
  LATEST DONATION pill (full width, one line, truncating)
  goal label + progress bar + count
  full-width "Fund the next voucher" button
  retailer marquee
```

Overlap is prevented structurally: the row is a three-column grid with a fixed-width left pill, a flexible center that owns the extra space, and a fixed-width right rail — not a `justify-between` flex row where a long donor name can push the stats into the logos. The pill truncates with ellipsis; the goal label truncates; the bar never shrinks below a legible width. Below `lg`, the grid collapses to stacked rows.

## Making the goal bar compelling

The bar is the emotional center of the strip, so it gets the craft:

- **Frame is distance, not size.** Headline reads "884 vouchers to go" with "116 of 1,000 funded" as the quiet sub-line — the deficit is the motivator, the achievement is the proof.
- **Fill animates once** from 0 to 11.6% on first view, easing over ~900ms, with a soft gradient in the brand emerald and a subtle sheen that sweeps once and stops. No looping shimmer — looping reads as decoration, one sweep reads as progress.
- **Real texture:** small tick marks at 25 / 50 / 75% so 11.6% still reads as "started" rather than "empty", the way Kickstarter's segmented bars do.
- **The CTA is the only filled button in the strip**, sized small, and it links to `/donate` — one click from proof to action, which is the entire point of this real estate.
- The whole center zone is one focusable link target on mobile, so a thumb can't miss it.

## The goal number

"Fund 1,000 grocery vouchers" against the real 116 already created. It is round, publishable, and grounded in a real count that grows on its own as vouchers are issued — no manual bookkeeping, and never a number that contradicts the ledger. If you'd prefer 500 (a nearer, more credible first milestone at current volume) say so and I'll swap it; 1,000 is the default I'll build.

Promoting one *specific* campaign here was considered and set aside: the largest live campaign is at $60 of $200 with 4 donors, and headlining a single small campaign under the hero invites the "is anyone actually using this?" read. A platform-wide voucher goal aggregates all the real activity into one number that looks like momentum, and individual campaigns still get their spotlight in the Stories section below.

## Compliance

Every element is factual and traceable to a row: the donation is a real ledger entry, the voucher count is a real count, the retailer rail states where vouchers can be spent. Language stays inside the approved frame — restricted digital retail vouchers, US only, zero cash disbursement, no tax-deductibility claim, no "beta".

## Technical notes

- Rewrite `src/components/landing/LiveActivityBar.tsx` → `src/components/landing/HeroActivityStrip.tsx`; update the import in `src/pages/Index.tsx`. Delete `generateDonation`, the 3.5s interval, and the mobile scroll-pause logic that only existed to hide the flicker.
- Latest donation comes from the existing `get_recent_public_donations(1)` RPC (already returns a privacy-safe "First L." display name, amount, retailer and timestamp — anonymous donors render as "Anonymous"). Voucher count and totals come from the existing `get_impact_stats()` RPC. No schema changes, no new functions.
- One combined fetch on mount plus a 60s refresh; a realtime `INSERT` subscription on `donations` updates the pill and the bar in place (subscribed inside `useEffect`, cleaned up with `removeChannel`).
- Loading state renders skeleton blocks at the exact final dimensions so nothing shifts; on RPC failure the strip renders the goal bar with the voucher count omitted rather than showing zeros.
- Relative-vs-absolute timestamp helper lives in the component: `< 7 days` → relative, otherwise `MMM d`.
- Retailer rail keeps `popularBrands` and the existing `animate-marquee` + mask treatment, now labelled "Redeemable at".
- Semantic tokens only; count-up, bar fill and marquee all respect `prefers-reduced-motion`.
- Verified after build with desktop (1280), tablet (834) and mobile (390) screenshots, checking the three zones for overlap and truncation, plus a clean build log.
