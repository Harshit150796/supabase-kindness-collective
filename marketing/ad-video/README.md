# "What do you put back?" (30 s video ad)

Built from receipts and coupons only: no people, stock photos, invented stories, testimonials or figures (AGENTS.md claims rules). The receipt is labelled "Illustration. Not a real receipt." The soundtrack is synthesised in `soundtrack.py`, so nothing needs licensing.

| Time | Scene | Emotion |
|---|---|---|
| 0–4.5 s | A grocery receipt prints: milk, bread, eggs, formula, diapers, apples. "Imagine you're at the register." | Familiar, everyday (hook) |
| 4.5–6.5 s | DECLINED stamp, buzz. "Your card is declined." | Shock, empathy |
| 6.5–12 s | Items struck off one by one under a heartbeat: "What do you put back? The apples? The milk? The eggs? The diapers?" | Loss, putting yourself in their place |
| 12–16 s | Forest green: "For some families, this is real. And they're asking for help." | Recognition |
| 16–23 s | Need chips (Groceries selected), $10 coupon flies in. "You choose what they need. Give from $10. 100% of your gift reaches them. No platform fee." | Agency, trust |
| 23–27.5 s | The items come back, COVERED stamp. "Everything stays in the cart." | Relief, the warm glow of helping |
| 27.5–30 s | Logo, wordmark, "Help someone today." coupondonation.com | Call to action |

Every claim is one AGENTS.md states as true: gifts start at $10 per store, 100% of a gift reaches families, and no platform fee is taken (the optional tip and card-fee cover are separate).

## Files
- `out/coupondonation-ad-9x16.mp4`: 1080×1920 for YouTube Shorts and other phone placements.
- `out/coupondonation-ad-16x9.mp4`: 1920×1080 for YouTube in-stream.

## Re-render (after editing ad.html)
```bash
python3 soundtrack.py out/soundtrack.wav
node render.mjs 1080 1920 out/coupondonation-ad-9x16.mp4 out/soundtrack.wav
node render.mjs 1920 1080 out/coupondonation-ad-16x9.mp4 out/soundtrack.wav
```
Stills for checking: `node render.mjs 540 960 --stills <dir> 3.5 10.9 21.5`.

## Optional voiceover (calm, close to the mic)
"Imagine you're at the register… and your card is declined. What do you put back? The apples? The milk? The diapers? For some families, this is real. And they're asking for help. On CouponDonation, you choose what they need, from ten dollars. A hundred percent of your gift reaches them. Help someone today, at coupondonation.com."

## Using it in Google Ads
Google Ads plays video from YouTube: upload both files to the CouponDonation YouTube channel (unlisted is fine), link the channel in Google Ads, then make a Video campaign (or add the videos to Performance Max) with the landing URL
`https://coupondonation.com/donate?utm_source=youtube&utm_medium=video&utm_campaign=put-back`.
Captions are burned in, so it works muted.
