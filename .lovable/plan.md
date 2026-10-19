# Six labeled example campaigns

## What you'll see
- Six new campaigns appear on the public site, each based on one of the families you listed: Steve & Rosine (house fire), the Mancuso-Jolevski family, Katie and her toddler (safe home), Julie (Latitude 43 fire), Ella Sullivan (SDR surgery), and the Miller family (house fire).
- Each campaign uses its family's photos from GoFundMe and a shorter version of their story, rewritten so it asks for grocery, food-delivery and everyday-store coupons. The goals are realistic, between $1,500 and $5,000.
- Each campaign shows partial progress (about 25–80% of its goal), a short list of example supporters with first name and initial only, and the coupons they gave by store.
- A small, quiet "Example campaign" note sits near the title and the progress area. The Donate button is replaced with "Giving is closed on example campaigns". No real payments can be made.
- The example numbers stay separate from the homepage impact totals and admin reports, so real figures are never inflated.

## Before I start
- I'll download each family's main photo and up to two more. If a photo is too small or blocked, I'll tell you which family needs better images.
- Organizer names are first names only, under example accounts that can't sign in and get no emails.

## Not changing
Real donations, real coupons, payments, emails, homepage totals and admin money reports. Nothing is published.

## Checks before I say it's done
- All six show on the fundraisers section and on their own pages, each with its photos, story, progress and the example note.
- Trying to give on any of them is blocked, both from the page and by the payment system itself.
- The homepage impact numbers are the same before and after.
- Admin donation and coupon reports exclude the example data.

## Technical details
- Schema (additive): `fundraisers.is_example boolean default false`. New `example_donations` and `example_coupons` tables (fundraiser_id, display name, amount, brand, value, status, dates), service_role grants, RLS on, public read only through a security-definer reader.
- `get_fundraiser_totals` / `get_fundraiser_cards` / `get_fundraiser_donations`: when `is_example`, return totals and supporters from the example tables. Real campaigns are unchanged. `get_landing_stats` and the admin RPCs ignore example rows.
- Checkout edge functions (square/stripe create-checkout) refuse an `is_example` fundraiser. The webhook skips them too.
- Images: download them to /tmp, convert to bounded WebP, then upload to the fundraiser-images bucket and add `fundraiser_images` rows (primary first).
- UI: an "Example campaign" note in FundraiserCard and PublicFundraiser; DonationPanel shows the closed state when `is_example`.
- Seed through one insert script. Organizer profiles are placeholder emails on a reserved example domain with auth disabled. They're added to email_suppressions so they never get emails.
- Tests: a checkout refusal for example campaigns, and landing stats staying the same with the example rows present.
