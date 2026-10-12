# Accurate card fee, faster Square page, no stuck Donate button

## 1. Card fee matches what Square really charges
- Today the page assumes Square takes 3.3% + 30¢ (Stripe 2.9% + 30¢) and adds enough on top that the gift and tip stay whole.
- First step: read the real fees Square recorded on recent completed payments (stored with each donation) and compare to our estimate. Set the Square rate to what Square actually charges this account, so donors are not over- or under-charged by even a cent.
- Keep the "pay the fee on the fee" math (fee is charged on the full total), rounded up to the cent, in the one shared calculation used by both the page and the server.
- Add tests with concrete amounts (e.g. $10, $25, $100, $1,000 gifts, with and without tip) proving that after Square's cut the families get the exact gift.

## 2. Compliance wording
- Covering the fee stays optional and clearly labelled as a voluntary contribution (not a surcharge), shown as its own line before paying and on the Square receipt (already a separate line).
- Show the exact fee amount next to the checkbox and in the total (already done) and make sure the total on our page equals the Square page total to the cent.
- Question for you below: card-network and some state rules discourage pre-ticked add-ons. Option to leave it ticked (current) or unticked by default.

## 3. Square page opens faster
- Show "Opening secure payment page…" immediately on click.
- Warm up the checkout service when the review step appears, so the first click doesn't wait for a cold start.
- Trim the server's extra work before calling Square (settings read runs alongside, not before).

## 4. Coming back without paying
- When the donor presses Back from Square (browser restores the old page), the green button is reset: not loading, all choices still filled in, and they can pay again.
- A fresh payment page is created on the next click (the old link isn't reused).
- Also add a "Back to donation" return link on the Square page so cancelling lands on the same review step.

## Checks
- Browser test: click Donate, leave to Square, press Back — button is active and works again.
- Fee tests pass; timing of click-to-redirect measured before and after.
- Nothing published.

## Technical details
- `DonationFlow.tsx`: `pageshow` listener (`event.persisted`) + `visibilitychange` reset `busy`/`checkoutUrl`; fire-and-forget warm-up invoke on review step.
- `_shared/checkout-total.ts` `CARD_RATES.square` updated from measured `processing_fee` vs `amount_paid` in donations; tests in `checkout-total_test.ts`.
- `create-donation-checkout`: parallelise settings fetch; set Square `checkout_options.redirect_url` / cancel return to the review step.
