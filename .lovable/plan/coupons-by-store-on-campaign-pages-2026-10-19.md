# Coupons by store on campaign pages

## What visitors will see
- A new "Coupons by store" list on each campaign page, just under the line that shows how much was converted and redeemed.
- One row per store, with the store's logo and name, the dollar value of its coupons, how many coupons there are, and how many have been used. For example: "Walmart · $1,120 · 24 coupons · 23 used".
- On the six family campaigns, the rows come from their sample coupons, and the "Example campaign" note stays. Real campaigns show their real coupons the same way.
- Coupon codes, PINs and supporter names never appear in the list.
- If a campaign has no coupons yet, the list stays hidden.

## Technical details
- New public read function `get_fundraiser_coupons_by_store(_fundraiser_id)`, security definer, granted to anon and authenticated. It returns brand_name, total_value, coupons_count and used_count, using the same real/example union as `get_fundraiser_coupon_trail`. The real branch reads coupons and leaves out 'void'; the example branch reads `example_coupons` joined to `example_donations`. It returns no codes.
- Add the call to `useFundraiserLive`, exposed as `byStore`.
- In `PublicFundraiser.tsx`, render a hairline-divided list with the brand logo from `brandLogos.ts`, sans text and the module-level `usd` formatter. No cards, pills or icon circles.
- Check the Steve & Rosine page in a test browser: the rows should add up to $2,790.
