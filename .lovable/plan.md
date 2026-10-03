# Fully flexible coupon editor in the Donations tab

## What you'll get
In the admin portal, fundraiser drawer, **Donations** tab, each brand on a donation (for example "DoorDash — $20") gets one editable list of coupons:

```text
DoorDash — $20 total                     Allocated: $20 of $20
  [$ 5 ]  [code ............]  [link ..........]  [Remove]
  [$ 15]  [code ............]  [link ..........]  [Remove]
  [+ Add coupon]                                  [Save]
```

- **Pick any amounts, any time:** 1 x $20, $5 + $15, 4 x $5, $12.50 + $7.50, any mix. Add a row, change an amount, or remove a row. The counter shows how much is allocated; **Save** works only when it equals the brand's total, so no money appears or disappears.
- **Code and link per coupon:** type the code and optional redemption link right next to the amount. You can leave a code empty and add it later.
- **Edit or delete codes/links:** saved codes show partly hidden with **Edit**. Clearing a code or link and saving removes it; that coupon goes back to "being prepared" for the organizer.
- **Re-size after codes are entered:** you can change amounts even when codes already exist. Rows you change or remove lose their code (you'll see a warning first).
- **Used coupons are locked:** a coupon the organizer already redeemed can't be changed or removed, and its amount counts toward the total.
- **Email:** the organizer gets one email only when a new or changed code is saved (not when you only re-size or delete), same as today. The code itself is never emailed.
- Viewers can look but not edit. Every save goes in the admin history.

## Not changing
Payments, checkout, webhooks, the amount charged, how coupons are first created, stored totals, the homepage, the tree. The donor-chooses-size option stays on hold until you approve it.

## Checks before I say it's done
- $20 saved as $5 + $15 works; a list adding up to $18 or $22 is refused by the server, not just the page.
- Removing a code makes it disappear from the organizer's page.
- Redeemed coupons can't be changed.
- Signed-out visitors, ordinary users and viewers are refused.
- Build is clean. Admin screens I can't sign into are reported as unchecked.

## Technical details
- New security-definer RPC `admin_save_coupon_group(_donation_id uuid, _brand text, _items jsonb)` where items are `[{id?, value, code?, redemption_url?}]`. Requires `is_admin_staff`. In one transaction: redeemed coupons for that donation+brand are kept and must be included unchanged; sum(items) must equal the current sum for the group (to the cent); each value 1–500, max 50 items; code 3–200 chars or empty; link must be https://. Existing ids are updated (amount change clears code unless a code is supplied), missing ids are deleted, new rows inserted copying donation, donor, brand and expiry. Coupons with a code get status `claimed` and `reserved_by` = owner; coupons without get `pending_procurement`, code and link null. Returns ids whose code was newly set or changed, for the email. Writes `admin_audit_log` (before/after with codes masked). Revoke from PUBLIC/anon, grant to authenticated.
- Existing `admin_set_coupon_code` and `admin_resplit_coupons` stay for compatibility; the UI moves to the new RPC.
- `admin_fundraiser_coupons` is reused for display (codes masked); the Edit action fetches the full code via the existing staff path only when editing.
- UI: replace `ResplitControl` and the per-row inputs in `FundraiserCouponsTab.tsx` with a `CouponGroupEditor` per donation+brand; the standalone Coupons tab uses the same editor.
- Tests: sum mismatch refusal, redeemed lock, code clear, and role checks (anon, user, viewer, staff).
