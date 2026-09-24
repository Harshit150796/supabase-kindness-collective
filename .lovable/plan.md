# One source of truth for every number on the home page

## What the database actually says today
- 19 completed donations, $1,214 raised
- 116 coupons created, 0 claimed/redeemed yet
- 10 active fundraisers
- Brand totals: DoorDash $640, Walmart $226, Amazon $78 (no others)

The page currently shows three contradicting sets (24 / $1,250, $3,300 with made-up brand bars and fake "2 min ago" donors, and $10,000 / 20 families / 50+). All of these are typed-in, not real.

## Do we need numbers in three places? No.
Show headline totals **once**, and give the other two sections a different job:

| Section | Keeps | Changes to |
| --- | --- | --- |
| Live bar (under hero) | Latest real donation + total donations + total raised | Numbers now live from the database |
| Brand Leaderboard | Bar chart + top 3 | Real per-brand totals, **all-time** instead of "this month" (monthly is too thin to look good). Fake recent-donations list replaced with real recent donations. The "$3,300 total" badge is removed (already shown in the live bar). Brands with $0 are hidden. |
| See the Real Impact (bottom) | Four cards, same design | No repeated dollar total. Cards become: **Coupons Created** (116), **Active Fundraisers** (10), **Retailers Available** (count of brands you support), **US** Communities Served. "Families Helped" is dropped until coupons are actually claimed, then it can come back automatically. |

Result: dollars appear once, every figure agrees, and nothing is invented. Numbers only go up as real activity happens.

## Loading and empty states
- While loading, show a small placeholder shimmer instead of a number (never a fake fallback value).
- If a brand or figure has no data, hide it rather than showing 0.

## Verification
- Compare each on-screen number against a direct database query.
- Screenshot desktop and 390px; confirm no remaining hard-coded amounts (`$3,300`, `$10,000`, `1250`, `24`, fake donor names) in these files.

## Technical details
- New security-definer function `get_landing_stats()` returning: completed donations count, total raised, coupons created, coupons claimed, active fundraisers, and per-brand totals (from `donation_brands` joined to completed donations). Granted to anon.
- Shared hook `useLandingStats` used by `LiveActivityBar.tsx`, `BrandLeaderboard.tsx`, `ImpactDashboard.tsx`, cached once per page load so all three show identical numbers.
- Leaderboard recent list uses existing `get_recent_public_donations(5)`.
- Also remove the unused `ImpactSection.tsx` hard-coded stats (98% satisfaction etc.) if it isn't rendered anywhere, so they can't resurface.
- No layout, color, or font changes.
