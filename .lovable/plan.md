# Retailer allocations include sample coupons

## Why
While the testing switch is on, the homepage retailer bars still count only real gifts, about $530 across three stores. The totals above them, $25,649, already include the samples, so the bars and the totals don't match.

## Change
- While the testing switch is on, each retailer bar shows the sum of three things for that store: real issued coupons, trial coupons and sample-campaign coupons. All three are read live from the database.
- The bars then add up exactly to the "All-time retailer allocations" figure ($25,649), so every number on the homepage agrees.
- When the switch is off, the bars go back to real gifts only, exactly as they work today.

## Verification
- Read the homepage figures as a visitor and confirm that the retailer totals add up to the allocations figure when the switch is on.
- Check the retailer section in a test browser.

## Technical details
- In `get_landing_stats()`, when `include_trial_stats` is on, `brand_totals` = issued real `coupons` (non-void, completed donation, has credential) + `trial_coupons` + `example_coupons` of example campaigns, grouped by `brand_name`. Otherwise it keeps today's `donation_brands` query.
- One migration that replaces the function. No frontend changes, because BrandLeaderboard already renders `brands`.
