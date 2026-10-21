# Sample donations for seven more campaigns

## Campaigns
- Urgent Help for Jesse's Homeless Family (goal $5,000)
- Help Nicole Avoid Homelessness ($5,000)
- Help Katie In Her Battle Against Cancer And Homelessness ($4,000)
- URGENT: Homeless Mother, Son, and Three Dogs Need Help ($2,000)
- Support Justin After a Severe Car Accident ($1,000)
- Help Feed My Family This Month, both copies ($1,000 active, $100 paused)

## What changes
1. Each campaign is marked as an example campaign, the same way as the earlier six. Donate is paused on each one, and the panel and cards show the same labels as the earlier six.
2. Each campaign gets between 12 and 30 sample supporters. Names are random, shown as a first name plus last initial or as "Anonymous". Gifts range from $10 to $250 and some include short messages. Dates are spread over recent weeks. Each campaign's total lands at about 40-80% of its goal. The $100 campaign lands at about $60-90.
3. Every sample gift gets sample coupons from random retailers on the site's list, such as Walmart, Target, Kroger, CVS and DoorDash. The coupons add up exactly to the gift, and about 95% are marked used.
4. All sample data stays in the separate sample tables. Real donations, coupons, receipts and emails are not touched.

## Totals read from the database
- Raised amounts, supporter counts, progress bars and "Coupons by store" are read live from the database. There are no typed-in numbers.
- When the testing switch in Admin → Settings is on, the homepage totals add these samples automatically.

## Things to know
- These campaigns belong to real organizers. Pausing giving stops real donations to them until you switch them back.
- The active "Help Feed My Family" campaign has one real $20 gift. While the campaign shows samples, that gift is hidden from its page. The gift itself stays safe in the database, and it comes back when the campaign is switched back.
- Turn the testing switch off before publishing. Nothing will be published.

## Verification
- For each campaign, check that the page total equals the sum of its sample gifts, and that each gift's coupons add up to the gift.
- Check that the homepage totals go up by the new sample amount when the switch is on, and stay at real-only numbers when it is off.
- Screenshot one campaign page.

## Technical details
- One data update: `update fundraisers set is_example = true` for the 7 ids. Insert rows into `example_donations` (fundraiser_id, donor_name, is_anonymous, amount, brand_name, message, created_at). Insert rows into `example_coupons` split into $10/$20/$50 values, with the last row covering any remainder. Set status `used` with `used_at`/`received_at` dates for about 95%.
- No schema or code changes. The existing read functions, `get_fundraiser_coupons_by_store`, `get_landing_stats` (trial flag) and the checkout example guard already handle `is_example`.
