# Voiceover script: the CouponDonation ending (after "Same planet, different worlds")

The ending runs 18 seconds and starts the moment the shared clip ends. There is no music, only the voice, with soft whooshes on the cuts. Each line starts on its cut and has to finish before the next one. The times below are seconds into the ending (add 50.5 s for the full video).

**Delivery:** quiet and close, like talking to one person. Slow, warm, never salesy. Let the pauses do the work: the "…" and the full stops are real breaths. Lift a little on line 5, then land line 6 gently and sincerely.

| Starts | On screen | Say | Direction |
|---|---|---|---|
| 0.35 | "Hunger isn't only far away." | **Hunger isn't only far away.** | Straight after the last clip. Soft, almost a thought. |
| 2.75 | **18 million** U.S. households were food insecure in 2023 (USDA) | **Eighteen million households… right here.** | Let "eighteen million" sit. Breathe, then "right here" lower and closer. |
| 5.6 | Groceries. Medicine. Rides. | **Your gift becomes groceries. Medicine. A ride.** | One beat per item; each word appears on screen as you say it. |
| 9.25 | The real "Pick the stores" page | **You choose where it goes.** | Reassuring, simple. |
| 11.25 | **100%** of your gift goes to families | **And every dollar reaches a family.** | The emotional lift of the piece. |
| 13.75 | End card: Help fill a kitchen · coupondonation.com | **Help fill a kitchen.** *(pause)* **At Coupon Donation dot com.** | The ask. Warm, not loud. |

29 words in all.

**Where the words come from**
- **Line 2:** USDA ERS, *Household Food Security in the United States in 2023*: 13.5% of households (18.0 million) were food insecure at some time in 2023.
- **Line 3:** the site's own words, "gift cards for the groceries, medicine and rides they asked for" (Index.tsx).
- **Line 5:** the site's "Every dollar you give reaches a family" (TrustTransparency.tsx). The FAQ says the same: 100% of the gift goes to the family as store coupons and gift cards, with no platform fee.
- **On screen, every time:** the end card says "Your gift helps families in the U.S." and that the people in the clips are not CouponDonation recipients.

**In the delivered video** the voice is Kokoro TTS (voice `af_heart`, speed 0.9), synthesized line by line by `endcap/voice.py`. Coupon's mouth and subtitles follow it. To swap in a recorded voice, record each line separately, keep each read within its row's time, and replace `endcap/ending-audio.wav` before running `assemble.sh`.
