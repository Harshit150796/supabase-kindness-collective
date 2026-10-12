# Add outside coupons with any brand and any donor to a fundraiser

## What you'll get
In **Admin > Fundraisers > (a fundraiser) > Coupons**, a new **Add outside coupon** button opens a form:

1. **Brand** — pick any brand from the list or type any brand name. This does not have to match a donation.
2. **Coupon** — pick a code already in stock, or type a new code, PIN, link, amount and expiry.
3. **Donor** — choose one:
   - **Existing donor** — search people who already gave to this fundraiser, or any site account.
   - **New donor** — enter a name and email. You can also mark them as anonymous on the page.
   - **No donor** — for coupons from a source you don't want to name.
4. **Send email** — checkboxes for "Email the donor a confirmation" and "Email the organizer that a coupon is ready". Both are on by default when there is an email address. You see a preview before sending.

Outside coupons appear in the Coupons tab under **From other sources**, with the source and donor shown. The organizer reveals and uses them exactly as they do now. You can also **Resend confirmation** to the donor from that list.

## Rules
- Outside coupons **do not change the fundraiser's raised amount or donor count**, because those figures only come from real paid donations. They are listed separately so the totals stay accurate.
- Codes stay hidden and are never put in emails.
- Each donor confirmation is sent once per coupon, unless you click Resend. Every add, send and resend is recorded in the admin history.
- Only admins and staff can add outside coupons. Viewers can only see them.

## Not changing
Payments, checkout, coupons created from paid donations, how totals are calculated, the homepage.

## Checks
- Add an outside Target coupon to this fundraiser with a new donor, then confirm the organizer sees it and the totals stay the same.
- Test emails go only to haagrawa123@gmail.com.
- Viewers and signed-out visitors get refused. The build is clean.

## Technical details
- Additive migration: new `coupon_sources` table (`id, fundraiser_id, source_label, donor_name, donor_email, donor_user_id, is_anonymous, confirmation_sent_at, created_by, created_at`) with grants, RLS for staff read, no client writes. Add a nullable `coupons.source_id` column that references it. Coupons keep `donation_id` null.
- New security-definer RPC `admin_add_outside_coupon(_fundraiser, _brand, _stock_id | code fields, _donor jsonb, _source_label)`. It checks the staff role, either assigns the stock row or inserts a coupon (`claimed`, `reserved_by` set to the owner), and writes the audit log.
- Extend `get_my_fundraiser_coupons` / `admin_fundraiser_coupons` to include source rows. The totals functions are not touched.
- `coupon-secrets` adds an `admin_add_outside` action. It calls the RPC, then sends the donor confirmation through `claim_account_email` (new kind `outside_coupon_confirmation`, deduped by source id) and the organizer alert through the existing `notify_coupon_ready`.
- UI: a new `OutsideCouponDialog` component plus a "From other sources" group in `FundraiserCouponsTab.tsx`. Brand uses a combobox (`issuableBrandNames` plus free text).
- Tests: role refusal, totals unchanged after an outside add, email dedupe, no code in the email body.
