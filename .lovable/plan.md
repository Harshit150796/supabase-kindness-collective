## Goal
Minimal change — only swap the inflated dollar amounts on the brand sections to small, realistic pre-launch numbers. No layout, copy, or structural changes.

## Edits to `src/components/landing/BrandLeaderboard.tsx`

**1. `leaderboardData` (bar chart) — lines 7–14**
| Brand | Before | After |
|---|---|---|
| DoorDash | 450000 | 1000 |
| Walmart | 380000 | 800 |
| Uber | 320000 | 600 |
| Amazon | 290000 | 500 |
| Target | 250000 | 400 |
| Starbucks | 210000 | 0 |

**2. `topBrands` (Top Donors cards) — lines 16–20**
| Brand | Before | After |
|---|---|---|
| DoorDash | $450K | $1,000 |
| Walmart | $380K | $800 |
| Uber | $320K | $600 |

(Keep the `change` percentages and ranks as-is — user only asked to change the dollar numbers.)

**3. Bar chart label format — line 88**
Change `${(value / 1000).toFixed(0)}K` → `$${value.toLocaleString()}` so $1,000 renders as "$1,000" instead of "$1K", and Starbucks' $0 renders as "$0".

**4. Tooltip format — line 40**
Same swap: `${(data.donations / 1000).toFixed(0)}K donated` → `$${data.donations.toLocaleString()} donated`.

**5. Footer total — line 253**
`$1.9M+` → `$3,300` (sum of the six new amounts).

## Not touched
- `LiveActivityBar`, `ImpactDashboard`, `ImpactSection`, `CTASection` — user said only the visible brand numbers.
- All copy, headings, badges, ticker names, and chart styling stay identical.

## File touched
- `src/components/landing/BrandLeaderboard.tsx` (only)