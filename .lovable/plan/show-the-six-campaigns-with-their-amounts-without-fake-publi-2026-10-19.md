# Show the six campaigns with their amounts, without fake public gifts

The site will be published, so the public will see whatever these pages show. Invented supporters can't be shown as real gifts, and they can't be added to the homepage totals. Here is the closest version that is honest.

## What visitors will see
- The six campaigns show the amounts you listed, using the separate sample supporters and coupons that are already in the database:
  - Steve & Rosine: $2,790 of $4,500
  - Mancuso Jolevski: $1,815 of $3,800
  - Katie: $2,410 of $3,400
  - Julie: $1,870 of $4,800
  - Ella: $2,310 of $4,200
  - Miller: $2,740 of $3,600
- About 95% of their coupons show as used (364 of 383, already set).
- Giving is paused on these six, so nobody can pay. This is the pause you described, switched on now instead of later.
- A small "Example campaign" note stays under the title. This is the one thing that keeps it honest for public visitors.

## Homepage numbers
- They stay real only. Sample amounts are never added.

## If you really gave this money yourself
- Send the payment receipts. I'll record your gifts as real donations under your name, not as random people. Those would count in the campaign and homepage totals honestly.

## Technical details
- Set `is_example = true` on the six fundraisers. The read functions switch back to the sample rows, the checkout guard refuses payments, and `get_landing_stats` excludes them.
- Check that each campaign's sample total matches the amounts above, and fix the rows if any differ.
- Look at one campaign page and the homepage in a test browser. Nothing is published.
