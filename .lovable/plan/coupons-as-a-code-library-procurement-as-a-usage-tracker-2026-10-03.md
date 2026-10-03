# Coupons as a code library, Procurement as a usage tracker

## What you'll get

**Coupons page = your code library (archive/directory)**
- **Add codes in bulk, any amount:** pick a brand, type any amount ($5, $15, $20, $12.50…), paste one or many codes, and add an optional redemption link and expiry. They're saved as "In stock", not yet given to anyone.
- **Bundles:** each upload is saved as a named bundle (for example "DoorDash $20 — Oct batch"), with vendor and cost. You can open a bundle and see every code in it.
- **Browse by brand and amount:** a summary at the top shows, per brand, how many codes are in stock at each amount and their total value.
- **Edit or remove:** fix a code, link, amount or expiry on any code that hasn't been given out. Codes already given to a fundraiser or used are locked. Removing an unused stock code is allowed. Coupons created from donations are never deleted.
- Codes stay partly hidden in lists, with a **Show** button that is recorded in the admin history.

**Procurement page = what's needed and what's used**
- **Needed now:** brands and amounts that donations are waiting for, next to how many matching codes you have in stock. One click, **Fill from stock**, hands the oldest matching stock codes to the waiting coupons and emails each organizer once.
- **Status of every code:** In stock, Given to a fundraiser (not used yet), Used, Expired. Filter by brand, amount, bundle or fundraiser, and see which fundraiser each code went to.
- **Mark as used:** the organizer's own "used" confirmation keeps working; admins can also mark a code used or unused from here.
- Top figures: codes in stock, given but not used, used, and value of each.

**Fundraiser Donations tab (the editor from last time)** gets a **Pick from stock** button on each coupon line, so you can choose a matching code from the library instead of typing it.

## Problems fixed along the way
- The Coupons edit popup writes codes directly and lets anyone change a status to anything, which can show a code to the wrong person. It will go through the same checked, recorded save as the fundraiser editor.
- Procurement only matches codes to an exact amount and can't keep codes for later; extra pasted codes are thrown away. Extras now go into stock.
- I'll first check the live coupons to confirm which statuses are in use and that nothing currently "available" belongs to a fundraiser, and report what I find before changing anything.

## Not changing
Payments, checkout, webhooks, how coupons are first created from donations, stored totals, homepage and tree. The donor-chooses-size option stays on hold.

## Checks before I say it's done
- Add 3 codes of mixed amounts, see them in stock, fill a waiting $20 DoorDash coupon from stock, see it as "Given", mark it used, see it as "Used".
- Stock codes can't be seen by organizers or ordinary signed-in users; signed-out visitors, ordinary users and viewers can't add, fill or edit.
- Build is clean. Screens I can't sign into as admin are reported as unchecked.

## Technical details
- Additive schema: new `coupon_status` value `in_stock`; `coupons.batch_id` (nullable, references `coupon_procurement_batches`); `coupon_procurement_batches.name`. No triggers on coupons.
- New security-definer RPCs (staff check, audit log, revoke anon): `admin_add_stock_codes(_brand, _value, _codes[], _url, _expiry, _batch jsonb)`, `admin_fill_from_stock(_brand, _value, _limit)` (FIFO, sets `claimed` + `reserved_by` owner, returns ids for the one email via existing `notify_coupon_ready`), `admin_assign_stock_code(_target_coupon, _stock_coupon)`, `admin_edit_stock_code`, `admin_delete_stock_code` (only `in_stock`, no donation), `admin_mark_coupon_used(_id, _used)`, `admin_inventory_summary()`, `admin_reveal_code(_id)` (audited).
- Stock rows have no donation/donor, status `in_stock`, so existing owner reads and the "available" policy don't expose them; verify that policy against `in_stock`.
- Rebuild `AdminCoupons.tsx` (library + bundles, paged DataTable) and `AdminProcurement.tsx` (needs vs stock, usage tracker); add Pick from stock to `FundraiserCouponsTab.tsx`. Old `attach_procured_codes` kept for compatibility.
- Tests: role refusals, stock not visible to non-staff, fill-from-stock FIFO and amount match, locked used codes.
