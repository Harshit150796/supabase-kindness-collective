# Square fees and wallet buttons — plan

## What the screenshots confirm

- Your Square dashboard has Apple Pay, Google Pay and Cash App all switched on.
- Square's published online fee is 3.3% + 30¢. Our fee-cover box already uses exactly 3.3% + 30¢ for Square (checked in `supabase/functions/_shared/checkout-total.ts`), so the fee amount donors see is correct and needs no change.

## Why only Cash App shows on the payment page

Our checkout already asks Square for Apple Pay, Google Pay and Cash App on every payment link (verified in `square-payment-methods.ts` and `create-donation-checkout`). Square then decides per-visitor what to show:

- **Apple Pay** appears only in Safari on an iPhone, iPad or Mac that has a card in Apple Wallet.
- **Google Pay** appears only in Chrome (or Android) where the visitor is signed into Google with a saved card.
- **Cash App** shows to everyone, which is why you always see it.

So on your own test browser, the wallets are hidden by the device/browser, not by our setup. Nothing is broken — but we can't prove that from the outside, and there is no setting left to enable.

## What I will change

1. **Add a small note on the donate review step** (near the fee row): "Apple Pay and Google Pay appear automatically on phones and browsers that support them." Sets donor expectations so nobody thinks the options are missing.
2. **Lock the fee rate with a test**: a check that the Square fee calculation stays at 3.3% + 30¢ (matching your Square pricing screenshot), so a future edit can't silently change what donors are charged.
3. **Verify in a browser**: open the donate flow, confirm the fee row math on a sample gift (e.g. $100 gift → $3.60 fee), and confirm the note renders.

## What I will not do

- No change to the fee percentage or formula (it already matches Square).
- No change to payment-method settings (Apple Pay, Google Pay, Cash App are already all requested).
- No publishing, no live test payments.

## To see Apple Pay / Google Pay yourself

- Apple Pay: open the Square payment page in Safari on an iPhone/Mac with a card in Wallet.
- Google Pay: open it in Chrome while signed into a Google account with a saved card.
