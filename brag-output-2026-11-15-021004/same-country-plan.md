# "Same Country": a 30-second donation ask (vertical)

**File:** `same-country-30s-9x16.mp4` (1080×1920, 30 fps, -14 LUFS), with poster `same-country-30s-9x16.jpg`. It is built for Reels, TikTok, Shorts and Stories.
**Source:** `kitchens/` (composition, score, render and delivery scripts).

## Why the WhatsApp clip is not in it
The clip that was sent ("Same planet, different worlds") is a compilation of other creators' TikToks. It shows identifiable children in hunger and distress, in other countries. It can't become a CouponDonation donation ad, for four reasons:
1. The footage belongs to other people.
2. The children shown have not consented to appear in a fundraising ad.
3. CouponDonation helps U.S. residents. Asking for donations over those images would suggest the money reaches the people shown, and it doesn't. The FTC treats that kind of ask as misleading, and AGENTS.md says claims must be true.
4. The source is 368×608, too small to upscale to good quality.

What this film keeps is the **format**: a contrast that stops the scroll, then a turn. It uses our own drawings, true U.S. figures and the real product.

## Storyboard (120 BPM; every cut on a beat)
| Time | Picture | Coupon says |
|---|---|---|
| 0–4.0 | **Hook**, readable from frame 0: "Same country. Different kitchens." *One kitchen*: a full fridge, with good food going into the bin. *Another kitchen*: the same fridge, nearly empty, its light flickering. | — |
| 4.0–7.0 | **18 million** U.S. households were food insecure in 2023 · USDA Economic Research Service (13.5% of all households) | "Not far away. Right here." |
| 7.0–10.0 | **30–40%** of the U.S. food supply is wasted · USDA estimate (built on its 31% figure, 2010 data) | "Meanwhile, 30–40% of the food supply goes to waste." |
| 10.0–12.5 | "The shelves are full. The budget isn't." | "So here's how you can help." |
| 12.5–15.0 | Groceries. Medicine. Rides. | "Your donation becomes gift cards… for what families asked for." |
| 15.0–20.75 | The real donate flow (phone captures): pick the stores, choose an amount, pay by card | "Pick the stores they need, choose what to give, and get a receipt for every gift." |
| 20.75–23.0 | **100%** of your gift goes to families as store coupons and gift cards. No platform fee. Optional tips keep us running. | "100% of your gift reaches families." |
| 23.0–26.5 | **Payoff**: both kitchens again. "Different" is struck out and becomes "**Full** kitchens." Coupon cheers. | — |
| 26.5–30.0 | End card: "Help fill a kitchen." · logo · **Donate at coupondonation.com** · the footer's full disclaimer | (waves) |

From 4 s to 23 s, a small fridge sits beside Coupon. Every step of the donation puts something on its shelves, so the viewer sees each action fill a kitchen.

## Claims check
- **Figures** were checked against USDA's own pages:
  - ERS, *Household Food Security in the United States in 2023*: "13.5 percent (18.0 million households) were food insecure" at some time during 2023.
  - USDA's *Food Waste FAQs*: food waste is "estimated at between 30-40 percent of the food supply", based on ERS's 31% loss estimate (2010 data). The plate says so.
  - A widely quoted "47.4 million people" figure did not verify against the sources available here, so it is not used.
- **Product lines** use the site's own words:
  - "gift cards for the groceries, medicine and rides they asked for" and "a receipt for every gift" (Index.tsx);
  - "100% of your gift goes to the family as store coupons and gift cards. We take no platform fee" (FAQ.tsx, Terms.tsx);
  - "Tips keep us running" (TrustTransparency.tsx).
- **What the film doesn't do:**
  - It never says charity, tax-deductible or verified families.
  - It promises no coupon counts or sizes and claims no retailer partnership. The two stores are the donate flow's own catalogue.
  - The end card carries the footer's disclaimer in full.
- **No people.** The kitchens are drawn in brand colours, following AGENTS.md: without people-photo consent, use coupon, receipt and trace visuals.
- **Coupon** comes from `video-kit/mascot`, reused and never redrawn.

## Sound
Original and synthesized: B minor turning to D major, 120 BPM.
- **Hook:** a fridge hum that cuts out when the light flickers, and a lid clack and thud for each item binned.
- **Figures:** a sparse piano question over a heartbeat.
- **Donate flow:** the groove switches on at "Groceries. Medicine. Rides.", and each item landing in the fridge plays the next note of a rising scale.
- **Payoff:** a beat of near-silence holds the struck-out "Different", then "Full kitchens." lands on a resolved D chord with bells.

Loudness is -14 LUFS, true peak -1.5 dBTP.
