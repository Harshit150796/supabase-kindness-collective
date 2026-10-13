# Wallet buttons, 15% tip default, and an optional monthly gift

## 1. Apple Pay and Google Pay not showing (find the cause first)
The cause isn't confirmed yet. Square only shows these buttons when the device supports them:
- **Apple Pay:** Safari on an iPhone, iPad or Mac, with a card already in Apple Wallet.
- **Google Pay:** Chrome or Android, with a card saved in Google Pay.

Cash App Pay shows on every device, which may be why it's the only one you see. Steps:
1. Create one test payment page and ask Square which payment options it says are allowed on it.
2. Then open that page in Safari and in Chrome on supported devices.
3. If Square reports Apple Pay or Google Pay as off for your account, I'll tell you exactly which switch to turn on in Square. Square needs no website setup on its own hosted page.

## 2. 15% tip selected by default
- 15% starts selected, with its box highlighted in green. Donors can still change it to 5%, 10%, Other or No tip.
- The "most donors leave about 10%" line changes to match 15%.
- **Warning:** a tip that's already selected can lead donors to tip without meaning to. US consumer-protection rules (FTC) and some card networks see pre-selected add-ons as risky, and you will likely get more refund requests. Approving this plan means you accept that risk.

## 3. "Make this a monthly gift" box
- A new box at the end, just above the Donate button: "Give this amount every month". It starts unticked, so donors must tick it themselves. When it's ticked, the button reads "Donate $X monthly" and a clear line explains that they can cancel any time.
- **First month:** goes through Square checkout as it does today, with the same gift split, tip and fee.
- **Later months:** Square charges the saved card on the same day each month. Each charge is recorded as a new completed donation with the same retailers, and the team prepares coupons as usual.
- **Cancelling:** the donor's Dashboard gets a "Monthly gift" card with a Cancel button. The receipt email from Square also lets them manage the gift.

## Not changing
- The $10 minimum per retailer
- How the card fee is calculated
- How donations become coupons
- Everything else on the donate page

## Technical details
- **Wallets:** Call Square's payment-link API and log `checkout_options.accepted_payment_methods` from its response. Confirm the location's capabilities through `GET /v2/locations`. The function already sends `apple_pay` and `google_pay`, so no code change is expected unless Square ignores the field.
- **Tip:** In `DonationFlow.tsx`, the starting tip becomes `15`. Update `TYPICAL_TIP_PERCENT` and the tip helper text. The green selected style uses the existing primary-tone treatment. Update the root AGENTS.md checkout rule so it doesn't name a specific default, and save "15% tip preselected (founder choice)" to memory.
- **Monthly:** Square payment links don't allow a different amount for each subscription, so recurring giving uses Square Cards on File:
  - Add a `recurring: boolean` field (default false) to the checkout body, validated by zod. The payment link stores the card for later charges with the buyer's agreement.
  - Run an additive migration that creates a `recurring_donations` table with these columns: user_id, square_customer_id, square_card_id, gift/tip/fee cents, encoded brand split, fundraiser_id, next_charge_on, status, consent_text, consent_at. It gets GRANTs, owner-read RLS, and server-only writes.
  - `square-webhook` saves the customer and card on the first `payment.updated` for a recurring checkout.
  - A new `recurring-charge` function runs daily on its own pg_cron job, separate from the 5-minute admin-dispatch job. It charges cards that are due through `CreatePayment` with an idempotency key per month, records the donation through the existing path, retries a failed charge up to two times, then pauses the gift and emails the donor from notifications@.
  - Cancelling goes through a `fundraiser-actions`-style edge function that only the owner can use. Clients have no direct write access.
  - Monthly donations require sign-in, so the donor can manage the gift.
- **Tests:**
  - The tip default is 15.
  - The monthly box starts unticked.
  - A recurring charge takes the same total as the first payment.
  - The monthly idempotency key never charges twice in the same month.
