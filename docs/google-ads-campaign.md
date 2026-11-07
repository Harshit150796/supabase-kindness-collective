# Google Ads: first campaign (Nov 2026)

Search only, United States, about $10/day for 14 days (under $200), Maximize clicks with a $1.50 max CPC.
Landing page: `/donate` with UTM tags, e.g.
`https://coupondonation.com/donate?utm_source=google&utm_medium=cpc&utm_campaign=first-test&utm_content=<ad>`
(PostHog records UTM values after Okay on the cookie bar; the canonical URL ignores the query string.)

## Before launch
- Read Google's fundraising/donation ad policy for a for-profit company; extra verification may apply.
- Set `VITE_GOOGLE_ADS_ID` (AW-…) and, once a "Donation" conversion action exists, `VITE_GOOGLE_ADS_DONATION_LABEL`. Unset = no Google tag loads (src/lib/adsTracking.ts).
- Disclosure text in Cookies/Privacy already covers the tag (LEGAL_VERSION 2026-11-03).

## Claims rules (AGENTS.md)
No "tax-deductible", "nonprofit", "charity", "verified families", retailer partnerships/endorsements, coupon counts or sizes, invented stories or reviews. Allowed facts: no platform fee on your gift (a tip and card-fee box are optional at checkout), you choose the stores, $10 minimum per store, a receipt for every gift.

## Ad group 1: Help a family (donate gift cards / groceries)
Keywords (phrase/exact): "donate groceries to a family", "help a family in need", "donate gift cards to families", "give grocery gift cards", "buy groceries for a family in need".
Negatives: free, loan, grant, apply, jobs, tax deduction, tax deductible, nonprofit, 501c3, charity near me, reddit.

Headlines (max 30 chars; the ad uses 3 to 15):
1. Give Coupons to Families
2. Pick the Stores They Use
3. No Platform Fee on Gifts
4. Donate Starting at $10
5. Help a Family This Month
6. Gift Cards for Real Needs
7. Get a Receipt for Each Gift
8. Give Groceries, Gas & More
9. Choose Where Your Gift Goes
10. Support a Family's Request
11. Give in Under a Minute
12. See Open Fundraisers

Descriptions (max 90 chars; 2 to 4):
1. Choose retailers and give. We take no platform fee from your gift.
2. Browse open fundraisers and give toward what a family asked for.
3. Pick stores, give from $10 per store, and get a receipt for your gift.
4. Help with groceries, gas and more. You choose the stores.

Pin nothing at first; let Google rotate. Add sitelinks: Open fundraisers (the homepage "Fundraisers open now" section), How it works (`/how-it-works`), FAQ (`/faq`).

## Ad group 2 (after ~5 days): Donate a gift card
Keywords: "donate unused gift card", "donate gift card to family", "donate store coupon". Landing `/donate-a-card`.
Headlines: Donate an Unused Gift Card / Give Cards to a Family / No Cards? Give From $10 / Never Pay to Donate a Card.
Descriptions: "Have an unused digital gift card? Give it to a family who asked for help." / "Digital cards and codes only. We never buy cards, and we never ask you to pay."

## Review after 14 days
Clicks, CTR, search terms (add negatives), donations during the test (admin dashboard), cost per donation. Then scale, point at a specific `/f/` fundraiser, or try Meta.

## Video ads
Illustrated, voiced dramatizations in 9:16, 16:9 and 1:1 (marketing/ad-video/README.md, script in SCRIPT.md):
"Checkout" (30 s hero), "The List" (20 s), "One Pencil" (15 s, School & learning) and "Milk or Diapers?"
(6 s bumper), plus the earlier receipt-only "What do you put back?". Start a Video campaign with the 30 s and
15 s in-stream and the bumper, about $5/day each for a week, and keep the one with the lowest cost per donation.
