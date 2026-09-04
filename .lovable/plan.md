# Replace the fake "Live" bar with a verifiable trust strip

## Why this needs to change

The strip under the hero currently invents activity: donor names, amounts, retailers and "10s ago" timestamps are generated in the browser every 3.5 seconds and are not real. It also shows a hardcoded "24 donations" and a "Live program" badge.

Real numbers in the database right now: 19 completed donations, $1,214 raised, 116 vouchers created, 10 live campaigns, 4 active retail partners.

Two problems: the fabricated feed is a material misrepresentation an underwriter can catch in one look (they can see the numbers don't match the ledger), and hardcoded counters drift from reality. Research on donor trust is consistent: social proof works when it is *verifiable* — real progress, real vouchers delivered, real retailers — and backfires when visitors sense it is staged.

## What replaces it

Keep the strip (it is valuable real estate directly under the hero), but change what it says. New section: **Platform Activity strip** — one row, same height and rhythm as today, three parts:

1. **Left — status, not theatre.** A small live dot with the label "Vouchers issued today" plus the real count, or when the count is zero, "Voucher engine active — issuing daily". No names, no amounts, no timestamps.
2. **Center — three real, live metrics** pulled from the database, not constants:
   - `$1,214` funds converted to vouchers
   - `116` retail vouchers created
   - `10` live campaigns
   Numbers count up once on load and refresh silently; each has a plain label, no growth simulation. Tabular numerals so widths don't jump.
3. **Right — retailer proof.** The existing logo marquee stays, but gets an explicit label: "Redeemable at" — turning decoration into a factual statement about where vouchers can be spent.

Removed entirely: the donor-name pill, the "Live program" item, the hardcoded "24 donations", and the random-donation generator.

On mobile the row stacks exactly as it does now: metrics in one compact row, retailer marquee beneath.

## Compliance framing

Copy stays inside the approved language: funds converted into restricted digital retail vouchers, US-only, no cash disbursement, no tax-deductibility claim, no "beta". Every displayed number is traceable to a database row, so a reviewer comparing the site to the ledger sees a match.

## Alternative considered

Deleting the strip outright and letting the hero run straight into the stories section. Rejected: it removes the only above-the-fold proof that the platform actually delivers vouchers, and leaves a visual gap between hero and content. The truthful version is stronger than nothing.

## Technical notes

- Rewrite `src/components/landing/LiveActivityBar.tsx` as a data-driven strip; drop `generateDonation`, `DonationPill`, and the 3.5s interval. Rename the export to `PlatformActivityStrip` and update the import in `src/pages/Index.tsx`.
- Source metrics from the existing `get_impact_stats` RPC (already returns total raised, donations, coupons, active fundraisers, and today's figures) via a small `useImpactStats` hook with a 60s poll — no new tables, no new database functions.
- Graceful states: skeleton shimmer while loading, and if the RPC fails the strip renders labels with the last known values rather than zeros or fake data.
- Retailer marquee keeps `popularBrands` and the existing `animate-marquee` + mask treatment; only the label is added.
- Design tokens only (primary/accent/muted/foreground) — no hardcoded colors, and reduced-motion respected for the count-up and marquee.
