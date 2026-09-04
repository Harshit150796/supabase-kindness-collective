# Campaign Spotlight bar — replace the simulated "Live" strip

## What goes away

The strip under the hero currently simulates activity: donor names, amounts, retailers and "10s ago" timestamps are generated in the browser every 3.5 seconds, next to a "Live program" badge and a hardcoded "24 donations". All of it is removed — the generator, the pill, the badge, the fake counter.

## What takes its place

A single-row **Campaign Spotlight** bar: one community goal with real progress, one spotlighted campaign, one action. Distance-to-goal is the frame, so small real numbers read as momentum rather than weakness — the pattern GoFundMe, Kickstarter and Wikipedia's fundraiser banner all rely on.

Three zones in one row, same height rhythm as today (no taller than the current strip, so nothing below shifts):

**1. Goal + progress (left, widest)**
- Eyebrow: `COMMUNITY GOAL`
- Line: `Fund 1,000 grocery vouchers for US families`
- A slim 6px progress rail, filled to the real voucher count (116 today), with a soft gradient fill and a subtle shimmer that runs once when it enters view.
- Under the rail, one line of real figures: `116 of 1,000 funded · 884 to go`. Both numbers come from the database, so the bar moves on its own as vouchers are created.

**2. Spotlighted campaign (center)**
- A compact card-in-a-row: small square photo, campaign title truncated to one line, and its own tiny progress readout (`$60 of $200`).
- The whole zone is a link to `/f/:slug`.
- Which campaign shows is admin-controlled, not random — see technical notes. If none is set, the bar falls back to the active campaign with the most raised, and if there are no active campaigns the zone collapses and the goal zone expands to fill it.

**3. Action (right)**
- One primary button: `Fund the next voucher` → `/donate`.
- Beneath it, small: `$5 = one grocery voucher`.

Removed for good: donor-name pill and generator, "Live program", hardcoded "24 donations".

## Why this shape

At 19 donations and $1,214 raised, a crowd-size claim is a losing argument and a fake one is a liability. A goal bar reframes the same facts as progress. Pairing it with one real spotlighted campaign does what a bare counter can't — it puts a face and a specific need next to the number, which is the actual conversion driver. And one button, one price anchor (`$5 = one voucher`), removes the "how much should I give?" hesitation that kills strip CTAs.

## Layout and overlap safety

```text
desktop (>=1024px)
┌──────────────────────────────────────────────────────────────────────────────┐
│ COMMUNITY GOAL                        │ [img] Warm Meals for a Man… │        │
│ Fund 1,000 grocery vouchers           │       $60 of $200           │ [Fund  │
│ ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │                             │  the   │
│ 116 of 1,000 funded · 884 to go       │                             │  next] │
└──────────────────────────────────────────────────────────────────────────────┘

tablet (768–1023px)
  goal + progress on row one, spotlight and button share row two

mobile (<768px)
  goal line, progress rail, figures, then spotlight card full width, then
  full-width button; single column, nothing side-by-side
```

Overlap discipline: CSS grid with explicit column tracks (`minmax(0,1fr) minmax(0,auto) auto`) rather than flex guesswork, `min-w-0` on every text track, single-line truncation on the campaign title, and `tabular-nums` on all figures so widths never jitter as numbers change. A vertical divider separates zones on desktop only.

## Compliance framing

"Vouchers", "grocery vouchers for US families", no cash-transfer wording, no tax-deductibility claim, no "beta", every number traceable to a database row.

## Technical notes

- New `src/components/landing/CampaignSpotlightBar.tsx` replaces `LiveActivityBar.tsx` (file deleted); import updated in `src/pages/Index.tsx`. It renders eagerly like today's strip, not lazily.
- **Voucher progress**: from the existing `get_impact_stats` RPC (`total_coupons`), via a small `useImpactStats` hook. No new tables or functions.
- **Goal number**: 1,000 vouchers, stored as an editable `cms_content` row (`section: 'spotlight'`, key `spotlight_goal_vouchers`) so it can be raised later without a code change; hardcoded default of 1,000 if the row is absent.
- **Spotlight selection**: a second `cms_content` row (`spotlight_fundraiser_slug`) names the campaign. The bar reads it, fetches that fundraiser plus its primary image, and falls back to top-raised active if unset or not found. Both rows get seeded by migration; the value is a plain text field, so it is editable from the existing admin content screen.
- Loading state: a skeleton with the goal line already visible and a muted rail — never a flash of zero, never a fake number.
- Motion: rail fill and shimmer animate once on first view via IntersectionObserver; fully suppressed under `prefers-reduced-motion`.
- Semantic tokens only (primary / accent / muted / foreground), verified in light and dark; button uses the existing primary variant.
- Retailer logo marquee: dropped from this bar. Retailer proof still appears in the Partner Brands section further down, so nothing is lost and the bar stays uncluttered.

## Verification

- Build clean, no `Beta`/`Live program`/fake-donor strings left in `src/`.
- Headless screenshots at 1440, 1024, 834 (current viewport) and 390 px: single row on desktop, clean stacking on mobile, no overlap or clipped text, no layout shift against the hero above or the section below.
- Confirm displayed figures match a direct database read.
