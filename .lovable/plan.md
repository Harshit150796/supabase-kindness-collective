# Pay on the Same Page (No New Tabs)

## What is happening now
The donate step asks Square or Stripe for a checkout link, then opens it in a new browser tab (confirmed in the donation flow code: it opens a new window, and only falls back to the same tab if the popup is blocked). This was an older rule we set on purpose; it is now being replaced.

## How GoFundMe and similar sites do it
GoFundMe, Givebutter and most modern donation sites keep the donor on their own page. The card, Apple Pay and Google Pay fields are drawn by the payment company right inside the donate form, so card details never touch the site but the donor never leaves. Stripe and Square both offer this officially (Stripe "Embedded Checkout", Square "Web Payments").

## What donors will see
- On the last donate step, after picking Square or Stripe, the secure payment form appears right there on the page, inside our design.
- They enter card details (or tap Apple Pay / Google Pay) and press Donate.
- The same tab moves to the existing "Thank you" page. No new tab, no leaving the site.

## What I build
1. **Stripe on-page form**: Stripe's embedded checkout shown inside the donate step. Same donation details, so the existing Stripe webhook keeps recording donations and creating coupons.
2. **Square on-page form**: Square's card, Apple Pay and Google Pay fields inside the donate step. When the donor presses Donate, our server charges the card with Square and carries the same donation details, so the existing Square webhook records it.
3. **Remove all new-tab behavior** from the donate flow (both places it happens), and update the saved project rule so it is not brought back.
4. The Admin on/off switches for each processor keep working as they do now.

## What I need from you
- **Square Application ID** (Production) from the Square Developer page. It is public, safe to paste in chat.
- **Stripe publishable key** (starts with `pk_live_`). Also public.
- For Apple Pay on Square: a one-time domain verification in Square (I will give exact steps).

## Checks before calling it done
- Screenshots at 390px and 1280px showing each payment form inside the page.
- Confirm no new tab opens (tab count stays at one) for both processors.
- Create a real payment session with each processor from the page.
- Recommended: one real $5 donation through each, confirming the donation and coupons appear. I will say plainly if something could not be confirmed.

## Technical details
- Stripe: `create-stripe-checkout` switches to `ui_mode: 'embedded'` with `return_url`, returns `client_secret`; frontend loads Stripe.js from js.stripe.com via script tag and mounts `initEmbeddedCheckout` (no npm packages). CSP updated for js.stripe.com / checkout frames.
- Square: load Web Payments SDK script (web.squarecdn.com), tokenize card/wallet; new edge function `create-square-payment` calls `POST /v2/payments` with source_id, idempotency key, location, and an order carrying the same metadata so `square-webhook` handles it unchanged. Respects `payment_settings`.
- Remove `window.open(..., '_blank')` at DonationFlow lines ~273 and ~339; update memory Core "Checkout" rule.
