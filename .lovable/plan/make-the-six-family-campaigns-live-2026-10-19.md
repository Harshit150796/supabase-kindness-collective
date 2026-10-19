# Make the six family campaigns live

## What changes
- The six campaigns (Steve & Rosine, Mancuso Jolevski, Katie, Julie, Ella, Miller) become normal live campaigns. The "Example campaign" note and "Giving is closed" message go away, and the Donate button comes back.
- Each campaign starts at **$0 raised, no supporters**. Its progress bar, supporter list and coupon list fill in only from real gifts. If a family really received money elsewhere and you want it shown, send the amounts and I'll display them as "raised offline" (labeled), not as coupons.
- Real gifts to these campaigns go through Square checkout, create coupon slots, and count in the homepage numbers, like any other campaign.

## The sample coupons
- The made-up supporters and coupons stay in their own separate place in the database. I'll mark 95% of them as redeemed there, as you asked.
- They will **not** appear on the live campaign pages and will **not** be added to the homepage numbers. Showing invented gifts and redemptions as real on a page that takes real money would mislead donors.
- If you want them visible, they can go on a separate "See how it works" walkthrough page, clearly labeled as a demonstration. This part is optional, so tell me if you want it.

## Before going live (your side)
- Keep each family's written consent on file.
- Confirm Katie is okay being shown as "Kate S."
- Decide who receives each family's coupons (a real organizer account or your team acting for them). Right now the campaigns belong to a placeholder account.

## Technical details
- Set `is_example = false` on the six fundraisers and reassign `user_id` to the chosen organizer account (it needs a profile so the organizer name shows).
- With the flag off, the read functions return only the real branch, so the example rows get hidden automatically. The checkout guard and webhook allow the campaigns again.
- Update `example_coupons` so about 95% are status `used`. Leave them out of `get_landing_stats` and the totals functions.
- Re-check the campaign pages and the homepage totals in a test browser. Nothing is published.
