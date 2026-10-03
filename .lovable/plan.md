# Flexible coupon amounts ($5, $20, or any amount) and code entry in the Donations tab

## What happens today
- Each donation is automatically split into $5 coupons (or $10 when a brand gets $50+). The $20 DoorDash donation became four $5 DoorDash coupons.
- The donor cannot choose the coupon size, and the admin cannot change it.
- Codes are entered in the separate Coupons tab, not in Donations.

## What you'll get

### Part 1 — Admin picks the coupon amounts (no payment changes)
In the admin portal, fundraiser drawer, **Donations** tab, every donation becomes expandable and shows its coupons:
- **Change amounts:** for coupons still waiting for a code, the admin chooses how to split that brand's money, for example one $20 coupon, two $10, or a custom mix like $15 + $5. The amounts must add up to exactly what that brand received, so no money appears or disappears. Coupons that already have a code are never re-split.
- **Enter / edit codes right there:** each coupon has a code box and an optional redemption link, plus **Replace** for saved codes. Same rules and email as now: the owner gets one email ("You received a $20 DoorDash coupon") and sees the code on their fundraiser page.
- If the donor chose an amount (Part 2), it's shown as "Donor asked for: 1 × $20" and pre-filled; the admin can still adjust it.
- Viewers can look but not edit. Every change goes in the admin history.
- The Coupons tab stays as a quick list of all coupons.

### Part 2 — Donor picks the coupon size while donating (needs your OK)
On the brand step of donating, an optional choice per brand: "One coupon for the full amount" (e.g. one $20) or "Split into smaller coupons" (default, today's behaviour). The choice is saved with the donation and the admin sees it as a request in Part 1.

This touches the checkout and the Stripe and Square payment confirmations, which have been off-limits until now. I'll only build Part 2 if you approve it here. The change only records the donor's choice, and amounts and charging stay exactly the same. Otherwise I'll build Part 1 alone, and the admin sets every amount.

## Not changing
How much is charged, the payment providers, stored totals, the homepage, the tree. No automatic triggers on donation or coupon tables.

## Checks before I say it's done
- Splitting $20 into 1 × $20 works, and a split that doesn't add up to $20 is refused.
- Coupons that already have codes can't be re-split.
- Signed-out visitors, ordinary users and viewers can't re-split or enter codes.
- Build is clean. I'll mark admin and owner screens I can't sign into as unchecked.

## Technical details
- New security-definer RPC `admin_resplit_coupons(_donation_id, _brand, _values numeric[])`: `is_admin_staff`. It requires every coupon for that donation and brand to have no code and status `pending_procurement`/`procurement_failed`, and sum(_values) must equal the current sum of those slots (each 1–500, max 50). In one transaction it deletes those slots and inserts new ones with the same donation, donor, brand and expiry. It writes `admin_audit_log`. Data changes go through the RPC only. No schema change is needed for Part 1.
- `admin_fundraiser_coupons` is reused, grouped by donation in a new `DonationCouponsEditor` used inside the Donations `TabsContent` of `AdminFundraisers.tsx`, and it reuses the save + `notify_coupon_ready` logic pulled out of `FundraiserCouponsTab`.
- Part 2 (only if approved): additive nullable `donations.coupon_preference jsonb` ({brand: "single"|"split"}). DonationFlow sends it in checkout metadata, and the webhooks store it without changing how slots are created. The admin editor reads it to pre-fill.
- Tests: RPC sum-mismatch refusal, coded-coupon refusal, and role checks (anon, user, viewer, staff).
