# Saved cards and payment history in the donor's account

## What donors get
1. **Past payments:** the existing "My giving" page (Dashboard → Giving) is checked so it lists every completed payment. That includes each monthly charge, marked "Monthly". Each row shows the date, gift, tip, fee, total, the card used (for example "Visa •••• 4242") and the retailers. Guest payments made with the same email show up once the donor signs in.
2. **New "Payment methods" section in Settings:**
   - Lists saved cards: brand, last 4 digits, expiry, and whether a monthly gift uses the card.
   - **Remove:** deletes the card after a confirmation. If a monthly gift uses that card, we warn the donor first. They can switch the gift to another card, or remove the card anyway, which pauses the gift.
   - **Add a card:** a secure Square card form opens right on the page. The card number goes straight to Square and never touches our servers.
   - **Use for monthly gift:** switches an active monthly gift to a different saved card.
3. **Saving a card while paying:** signed-in donors see a "Save this card for future gifts" box. It starts unticked. Ticking it saves the card to their account after a successful payment. Monthly gifts always save the card, as they do today.

## Safety
- Card details are stored only by Square (PCI-compliant). We keep only Square's card ID, brand, last 4 and expiry.
- Donors can only see and remove their own cards. Every action is checked on the server.
- Admins can see whether a donor has a saved card, but never the card details.

## One limitation to know
Square's hosted payment page can't save a card for a one-time gift. The "Save this card" box therefore only appears when a donor pays with a card using the card form on our own page, which already exists. Apple Pay, Google Pay and Cash App can't be saved this way.

## Technical details
- **Square Customers and Cards APIs:** every signed-in donor gets one Square customer (created when first needed). Save its ID in a new `donor_payment_profiles` table (user_id, square_customer_id), along with a `saved_cards` cache table. Both tables get GRANTs, owner-read RLS and server-only writes.
- **New `payment-methods` edge function** (signed in only, validated with zod). Actions:
  - `list`: calls ListCards with the customer ID.
  - `add`: takes a Web Payments SDK token and calls CreateCard, with a verifyBuyer step for 3-D Secure.
  - `remove`: calls DisableCard, after checking ownership and any monthly gift that uses the card.
  - `set_monthly_card`: calls UpdateSubscription with the new card_id.
- **create-square-payment:** add a `saveCard` flag. When it's on, create the payment with customer_id and then call CreateCard from the payment ID, which records the donor's consent.
- **Monthly gifts:** the webhook stores the subscription's card_id on recurring_donations (additive column) so the "used by monthly gift" warning works.
- **Settings page:** new PaymentMethods component that reuses the SDK loader from OnPagePayment.
- **DonorHistory:** add the card and Monthly label from donations.payment_method and recurring_charges. Owner-read RLS is already in place.
- **Needs:** the `SQUARE_APPLICATION_ID` secret (payment-config already reads it). I'll confirm it's set and ask you for it if it's missing.
- **Tests:**
  - Remove is refused for a card the donor doesn't own.
  - The save box starts unticked.
  - Saving the card's last 4 never stores the full number.
