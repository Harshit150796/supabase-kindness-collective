# Fix Square Location ID and finish go-live

## What the screenshot revealed

Your Square Locations page shows the Location ID as `LW7JNKWS9×9E7` — but Square location IDs only contain capital letters and digits. The character that looks like "×" is almost certainly a capital **X** rendered in a font where it looks like a multiplication sign. So the real ID is very likely:

`LW7JNKWS9X9E7`

## Steps

1. **Save the corrected ID** — set `SQUARE_LOCATION_ID` to `LW7JNKWS9X9E7` directly (no form needed since I can supply the value).
2. **Retest the checkout function** with a $5 test payload:
   - If it returns a Square checkout URL → the ID is correct, checkout is live.
   - If Square still rejects it → the character is something else; I'll then ask you to click the location in the dashboard and copy the ID from the location detail page (or read it from the browser address bar), which gives the exact text.
3. **Confirm the webhook events** — in the payment-update subscription, verify `payment.updated` is checked (optionally `refund.updated`). Your earlier screenshot was cut off before the event list.
4. **Run one real $5 end-to-end donation** — you click through the live donate flow with a real card; I verify the donation is recorded, coupons are created, and the webhook fired.
5. **Declare go-live** only after step 4 passes. Stripe stays dormant as fallback until then.

## Notes

- No code changes are needed — the checkout function, webhook, secrets, and frontend are all in place and tested up to the location-ID failure.
- If the corrected ID works, the only remaining work is the real-donation test.
