# Faster card dealing in "Give what people need" (laptops)

## What changes
- The four cards (You donate, It becomes a coupon, They get what they needed, You get the receipt) flip in faster, with less waiting between each card.
- Design, wording, order, when the cards start, and the phone/tablet layout stay the same. Nothing gets published.

## New timing
- Each card's flip: 750ms becomes about 520ms.
- Gap between card starts: 500ms becomes about 300ms.
- Short wait before the first card: 180ms becomes 120ms.
- All four cards finish in about 1.5s instead of about 2.4s.

## Technical details
- Change only `CARD_DEAL_TIMING` in `src/lib/cardDealTiming.ts` to `{ hold: 120, duration: 520, stagger: 300 }`.
- Update the expected values in `supabase/functions/_shared/card-deal-timing_test.ts` and run that test.
- Check the deal on a laptop-size screen in the browser for smoothness, and make sure there are no build errors.
