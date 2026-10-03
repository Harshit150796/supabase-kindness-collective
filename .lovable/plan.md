# Admin enters coupon codes per fundraiser; organizer sees them and gets an email

## What I found
- The $20 DoorDash donation on this fundraiser is completed and already created four $5 DoorDash coupons, all "waiting for a code" (no code yet).
- The fundraiser owner currently cannot see any coupons for their fundraiser, and there is no admin screen to type a code into a specific fundraiser's coupons.

## What you'll get
1. **Admin portal, fundraiser drawer, new "Coupons" tab** (every fundraiser). It lists each coupon from that fundraiser's completed donations: brand, value, donation date, status. For each one waiting for a code, admin types the code (and optional redemption link) and presses **Save code**. Saved codes show masked, with a "Replace" option. Viewers can look but not edit. Every save goes in the audit log.
2. **Email to the fundraiser owner** when a code is saved, sent from notifications@coupondonation.com: "You received a $5 DoorDash coupon from a donation to <fundraiser>", with a button to their fundraiser page. The code itself is not put in the email, so it can't leak from an inbox; it shows only after sign-in. If an admin saves several codes at once, the owner gets one email listing them.
3. **Owner's fundraiser page (the Donations section you're on)**: each donation shows its coupons underneath. Ready ones show the code with a **Copy** button and the redemption link. Ones still waiting show "Coupon being prepared." Only the owner and their co-organizers can see these codes, enforced on the server.
4. An in-app notification is added at the same time as the email.

## Not changing
Payments, checkout, payment webhooks, how coupons get created from donations, the tree, the homepage. No triggers on donation or coupon tables. Stored totals untouched.

## Checks before I say it's done
- Admin save works on a real pending coupon from this $20 donation (I'll use a clearly labelled test only if you agree. Otherwise I'll test the function's permission rules without saving a real code).
- A signed-out visitor, a random signed-in user and a donor cannot read the owner's codes. The owner can.
- The email is sent to the owner and Resend reports it **delivered**, or I report it as unverified.
- Build is clean. Signed-in screens I can't open are reported as unverified.

## Technical details
- New security-definer RPC `admin_set_coupon_code(_coupon_id, _code, _redemption_url)`: requires admin/staff (`is_admin_staff`), coupon must belong to a donation with `fundraiser_id`. It sets `code`, `redemption_url`, status `pending_procurement|procurement_failed → available`, and stays `reserved_by = fundraiser owner` so the existing `get_coupon_code` works. It writes `admin_audit_log` and inserts into `notifications` plus `admin_email_events(kind='coupon_ready', source_id=coupon_id)` (unique dedupe). No triggers.
- Status note: I'll mark the coupon reserved for the owner, not plain "available", because the existing "Users can view available coupons" policy would otherwise expose it to any recipient. That existing broad policy will be listed for your security review, not changed.
- New RPC `admin_fundraiser_coupons(_fundraiser_id)` (team read, codes masked) and `get_my_fundraiser_coupons(_fundraiser_id)` (organizer/team via `is_fundraiser_team`, returns codes).
- Email: the immediate send goes through `fundraiser-actions` (`action: 'notify_coupon_ready'`, admin-verified JWT, Resend, owner email looked up server-side). The 5-minute `admin-dispatch` retries any unsent `coupon_ready` events (`sent_at` null), so a failed send still goes out.
- UI: `CouponsTab` in `AdminFundraisers.tsx` drawer; coupon list under each donation in `FundraiserDashboard.tsx` `#donations` card.
- Tests: role checks for both RPCs (anon, random user, donor, owner, staff, viewer).
