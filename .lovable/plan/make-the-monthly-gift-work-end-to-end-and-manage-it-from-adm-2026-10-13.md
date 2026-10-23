# Make the monthly gift work end to end, and manage it from Admin

## What is going wrong
Our records show no monthly checkout was ever started: every recent attempt was a guest (not signed in). For guests, ticking "monthly" silently greys out the Donate button, so nothing happens. That matches what you saw.

## How other sites handle monthly giving (GoFundMe, GiveDirectly, Patreon, Netflix-style)
- The donor can start without logging in. The email they pay with becomes their account.
- The payment page says clearly that the card is saved for monthly charges, and the donor must agree.
- A receipt goes out every month. Each receipt has a link to manage or cancel.
- Cancelling takes one click and works right away.
- If a charge fails, the system tries again a few times. Then it pauses the gift and emails the donor to update their card.
- The team can see every monthly donor, their next charge date, past charges and failures, and can pause or cancel a gift for them.

## Changes
1. **Donate button always works.** With "monthly" ticked, guests go straight to Square. Square's subscription page asks for their email and saves the card with their consent ("This amount will be charged every month until you cancel"). Square then charges the saved card automatically each month.
2. **Linking to an account.** We tie the monthly gift to the email used on Square. If that person already has an account, or signs up later with the same email, the gift shows on their dashboard with a Cancel button.
3. **Cancel any time.** Donors can cancel from their dashboard. Square's own monthly receipt email also includes a link to manage the gift.
4. **Failed charges.** Square retries the card. If it still fails, we mark the gift "payment problem" and the team sees it in Admin. We don't add a new donor email for this; Square already sends its own.
5. **New Admin page: "Monthly gifts".** It's a paged table you can search, showing:
   - each donor's name and email, monthly amount, retailers and fundraiser
   - status (pending, active, payment problem, cancelled), start date and next charge
   - number of charges and total given
   - a detail panel listing every charge, with Pause, Resume and Cancel buttons
   Every action is recorded in the audit log. There's also a CSV export.
6. **Each monthly charge is recorded as a normal completed donation,** with the same retailers. Coupon slots and totals work exactly as they do today.

## Not changing
The tip default, how the fee is calculated, the $10-per-retailer minimum, one-time donations, and the coupon process.

## Technical details
- ReviewStep: remove the `monthly && !signedIn` disable. Update the helper copy.
- create-donation-checkout: when the donor is a guest, create the `recurring_donations` row with a null user_id and the donor's email. If the call carries a valid sign-in, use it to fill in user_id.
- Additive migration on `recurring_donations`: user_id becomes nullable. Add new columns: square_customer_id, last_charge_at, next_charge_on, charges_count, total_charged_cents, failure_reason, paused_at. Add a `recurring_charges` history table (with GRANTs, RLS, staff and owner read access, server-only writes). Add an admin-only paged list RPC and an admin action RPC (pause, resume or cancel, which calls Square through recurring-actions) that writes to admin_audit_log.
- square-webhook:
  - `subscription.created/updated`: save the subscription and customer IDs, then attach user_id by matching the buyer email to profiles.
  - `invoice.payment_made`: record a charge row and a donation.
  - `invoice.scheduled_charge_failed`: set status to payment_problem.
- recurring-actions: add `pause` and `resume` (Square subscription pause/resume) for owners and staff. Staff access is checked on the server.
- Tests:
  - With monthly ticked, the button is enabled for guests.
  - A guest monthly checkout stores the email.
  - Charges count and total add up.
- Verify by creating a real monthly payment link and opening it in a browser. I can't run a real card charge, so you'll need to do one small test.
