# Trial coupons so the homepage shows all donations converted

## What the database says today
- 21 completed donations, $1,484 donated
- $1,155 of coupons still being prepared (no code yet), $70 issued, 2 received, 2 used

## What we will build
1. **A separate table for trial coupons.** It is fully apart from real coupons, so nothing touches real donors, fundraisers, receipts or emails. Each trial row has brand, value ($50, $20 or $10), issued date, received date and used date, plus a "trial" label.
2. **Seed trial rows** so that real issued value + trial issued value = exactly $1,484. The mix is roughly a third $50, a third $20, a third $10 coupons. The last row covers any leftover amount so the sum matches to the cent. Most rows are marked received, and about half are marked used. Dates are spread over recent weeks.
3. **Homepage numbers combine real + trial**, still read live from the database:
   - Donated: $1,484
   - Coupons being prepared: $0
   - Issued coupon value: $1,484
   - Coupons received / marked used: real count + trial count
   - Copy line changes to "All donated money has been converted into coupons."
4. **One on/off switch** in Admin Settings ("Include trial coupons on the homepage"), on by default. Turning it off returns the homepage to real-only numbers immediately, and trial rows can be deleted in one step later.
5. Admin pages, organizer pages, donor impact and emails keep showing **real data only**.

## Important note
Showing trial coupons as delivered on the public site tells donors more was issued and used than actually was. Charity rules (the FTC and state charity regulators) treat that as a misleading claim. I recommend keeping this to preview/testing and switching it off before publishing, or at least until the real $1,155 has been issued. Nothing will be published.

## Verification
- A database check confirms trial issued value + real issued value = total donated.
- A test confirms the switch: on shows the combined numbers, off shows the real numbers only.
- Screenshot of the homepage numbers section.

## Technical details
- New table `trial_coupons` (id, brand_name, value numeric, issued_at, received_at, used_at, created_at). Grants to service_role only, with RLS turned on and no public policies.
- `admin_settings.include_trial_stats boolean default true` (additive).
- Update `get_landing_stats()` so that when the flag is on, trial values are added to issued_value_total, coupons_created, coupons_received, coupons_used, issued_value_month and used_month. In that case pending_value_total and coupons_pending are reported as 0. Brand totals stay as they are.
- Seed with a one-time insert. Toggle is added to AdminSettings.tsx through the existing `admin_update_settings`.
- Update the summary sentence in ImpactDashboard.tsx. No layout or style changes.
