# Make the allocations line match, and set used coupons to 45

## Changes
1. **All-time retailer allocations line.** While the trial switch is on, this line shows the same value as issued coupons, $1,484. The number still comes from the database, so it stays matched to donated and issued. When the switch is off, it goes back to the real allocations.
2. **Coupons marked used = 45.** There are 53 received coupons in total: 51 trial and 2 real. In the database, 16 more received trial coupons get a used date, so the used count is 2 real + 43 trial = 45. Their used dates fall a few days after each one was received. The "marked used this month" figure updates on its own.
3. The homepage keeps reading every figure live from the database; no numbers are typed into the page.

## Verification
- Read the live figures and confirm: donated $1,484, issued $1,484, allocations $1,484, received 53, used 45, prepared $0.

## Technical details
- Update `get_landing_stats()`: `allocated_total` returns the issued total (real + trial) when `include_trial_stats` is on; otherwise it keeps today's calculation.
- One-time data update on `trial_coupons`: set `used_at = received_at + 2 days` on 16 rows where `received_at` is set and `used_at` is null.
- Retailer leaderboard bars stay on real allocations. Adding trial coupons there would make retailer totals larger than the amount donated.
