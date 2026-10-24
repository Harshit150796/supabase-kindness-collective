# /brag plan: the new coupondonation.com (launch film)

**Format:** landscape 1920×1080, 30 fps, **79.2 s** (33 bars at 100 BPM). This is a long-form cut on purpose: the brief is a long launch / PR film for the new website, so it runs past brag's usual 15–25 s and earns the length chapter by chapter.
**Tone:** cinematic and polished. Big serif type and slow camera on the real site, then confident product moments, all earnest. Tonal reference: the site's own opening lockup and the "Every dollar" band.
**Built from:** the updated site on `main` (merged at `780cf7a`). The live site and backend are blocked from this machine, so every scene reuses the repo's real code, CSS, fonts, captured markup and the homepage's own 3D tree, rendered locally.

## What it is
CouponDonation turns a gift into store coupons and gift cards for families who asked for help, never cash, and lets the donor follow the money from donation to use.

## Who it's for
- **Donors** who want the whole gift to arrive. The new site says so up front: "Every dollar you give reaches a family. All of it." They pick the stores, split the gift in whole dollars, and every coupon stays on the record.
- **People who need help.** They apply free, pick the stores that would help most, and receive coupons rather than cash.

## What sets it apart (and what's new in this launch)
- The promise: no platform fee comes out of the gift. Tips are optional and the card fee is covered on top.
- "We don't track the person. We track the money." Donation → Allocation → Coupon → Use.
- The rebuilt site:
  - the logo-to-navbar opening;
  - the live 3D tree with the "two halves meet" capsule (Donate now | Apply as Recipient);
  - the card-deal "Give what people need." steps;
  - the three-step donate card with the deep-green "Your gift" ledger;
  - the rebuilt apply flow with its live "Your request" panel.

## Angle
**A promise, then the proof.** The film opens on the site's boldest line over the live tree. Every chapter after that shows the real website keeping that promise, step by step, in the order a visitor meets it. It ends on the site's own two-way call to action.

## Hook (0–4.8 s)
Night sky with the real homepage tree, dimmed far back behind drifting stars. A huge serif line sets in word by word (already rising on the first frame): **"Every dollar you give reaches a family."** On the bar line comes **"All of it."**, and its hand-drawn underline draws, as on the site.

## Highlights
1. **The new site, opening for real.** The founder-approved opening lockup (logo, "Coupon Donation", "Transforming Giving", sheen) flies onto the navbar as the night hero fades in. Then the kicker word slides and the Donate now | Apply as Recipient halves meet around the heart.
2. **Give what people need.** The four steps deal out like cards: You donate · It becomes a coupon · They get what they needed · You get the receipt.
3. **The new donate card.**
   - Tap Walmart, Target and DoorDash, then $50.
   - The deep-green "Your gift" ledger slides open and splits it in whole dollars.
   - Review: "Gift for families (100%)", with "Square's fee is added on top, so nothing comes out of the gift."
4. **100%.** The outlined serif 100% fills, with "Nothing taken out" and "We take no platform fee."
5. **We track the money.** The line, then the journey with a coupon travelling Donation → Allocation → Coupon → Use: "The receipt closes the trail."
6. **For people who need help.**
   - The rebuilt apply flow: who it's for, the needs, the stores.
   - The deep-green "Your request" panel fills in live.
   - "Free to apply. Help arrives as store coupons, never cash."
7. **Security without shortcuts.** Encrypted connection · Coupons, never cash · Payments by Square.

## Punchline / outro (67.2–79.2 s)
An iris opens on the tree by daylight. The site's deep-green CTA wipes up over it: "Help someone this week. Or ask for help yourself." with **Start donating** and **Apply for support**. Then the logo lockup, the two-colour wordmark and coupondonation.com, with the site footer's full disclaimer as fine print (trademarks, no affiliation, "CouponDonation Inc. is not a registered charity, and gifts are not tax-deductible.").

## Copy rules for this cut (from the research pass)
- **Verbatim site copy only** for claims, each traced to a file (see `work/research/flows/` and `work/research/sections/`).
- **Never:**
  - coupon counts or sizes, any "$5 minimum", or 95% / fee splits (all outdated);
  - "charity" or "tax-deductible" (the footer says it is not a registered charity);
  - tip percentages (the site says 10% in one place and 15% in another);
  - timing promises ("about 3 minutes", "within a few minutes");
  - verification or approval promises;
  - any live numbers, fundraiser cards, testimonials or donor names. They are real user data or blocked here.
- **Illustrative UI values show the product in use, not claims:** the $50 demo gift split $17/$17/$16 (the same split on the ledger and the review), the chosen stores, and the apply example (My family; Food & groceries and Health & pharmacy; Walmart, Kroger, CVS). No story text, photos or people appear.
- **Review card:** the tip picker shows the site's default 15% selection, but its "Most donors leave about 15%" sentence is trimmed, and the "100%" band hides the tip column for the same reason.
- **Store logos** appear as the site shows them. The site footer's disclaimer goes in the end card, in full (Footer.tsx). The homepage marquee, which carries Postmates, is kept below the frame (tree rules).

## Visual identity (from the codebase)
- **Colours:**
  - Logo green `hsl(123 46% 34%)` is primary.
  - Logo blue `hsl(212 80% 42%)` is the single accent: the Apply half, the "Every dollar" band, verification.
  - Neutrals: ink `hsl(123 20% 7%)`, deep forest bands, paper `hsl(120 8% 98.5%)`. No warm UI colours outside brand logos and the 3D tree.
- **Type:**
  - Instrument Serif 400 for headlines, Instrument Sans for UI, zero negative tracking.
  - The wordmark is exactly `#2e7d32` / `#1565c0`.
- **Forbidden:** eyebrow pills, gradient text, glow, card-on-card. The hero kicker is the approved exception.
- **Motion:** bold translate, scale, clip and parallax, as the site's full-motion mode does. Scenes stagger out → in (no muddy cross-dissolves), on beat lines.

## Storyboard (100 BPM: beat 0.6 s, bar 2.4 s; every cut on a bar line)

| # | Time | Bars | Scene | On screen | Sound |
|---|---|---|---|---|---|
| 1 | 0.0–4.8 | 1–2 | **Hook** | Dimmed night tree under drifting stars. Serif "Every dollar you give reaches a family." word by word, then "All of it." with the underline drawing at 2.4 s. | Low piano and a pad. Bell on "All of it.", shimmer on the underline, riser into the paper wipe. |
| 2 | 4.8–9.6 | 3–4 | **The new site** | Real opening: paper cover, logo mark, wordmark, "Transforming Giving", sheen, with "Introducing the new coupondonation.com" under it. Slow push while it reads, then the lockup flies onto the navbar as the night hero opens. | Sheen shimmer, a whoosh into the nav, a tick on landing. |
| 3 | 9.6–14.4 | 5–6 | **The tree** | Night hero (real capture), punched in past the navbar: the kicker word slides, the coupon drops, the dandelion grows. Slow push onto the tree. | Mallets on the drop and the kicker, riser. |
| 4 | 14.4–24.0 | 7–10 | **Give what people need.** | Page scroll to the soft-green band. Heading and subhead ("…so it arrives as food, medicine or transport, never as cash."), then the four cards deal and flip on beats: You donate · It becomes a coupon · They get what they needed · You get the receipt. | Groove enters, a paper flip on each deal. |
| 5 | 24.0–36.0 | 11–15 | **Donate** | "Choose where your help can be used." Taps on Walmart, Target and DoorDash ("3 of 5 chosen"), "Choose amount", $50. The "Your gift" ledger slides open and splits it $17/$17/$16. Review gift, then a lean-in on the fee box and the summary: "Gift for families (100%)", with a marker drawn under it. | UI ticks in key on each tap, bells as the ledger opens. |
| 6 | 36.0–43.2 | 16–18 | **100%** | Blue band wipes up: "Every dollar you give / reaches a family. All of it." The outlined 100% fills. "100% of your gift goes to the family as store coupons and gift cards. We take no platform fee." (FAQ), then "Nothing taken out" and "The card fee is covered". | Riser on the fill, a bell as it lands, ticks on the two promises. |
| 7 | 43.2–52.8 | 19–22 | **We track the money.** | Scroll to "We don't track the person. / We track the money." The line lifts and the journey draws: Donation · Allocation · Coupon · Use, with a green coupon riding the line from stop to stop. | Boom on the bar, a mallet and paper on each stop. |
| 8 | 52.8–62.4 | 23–26 | **For people who need help** | The apply page slides in: "Start your request", My family already chosen. Taps on Food & groceries and Health & pharmacy, a scroll, then Walmart, Kroger and CVS ("3 of 8 chosen"). The deep-green "Your request" panel fills row by row as each tap lands, then the camera leans in on it. The panel's own footer takes the frame: "Free to apply. Help arrives as store coupons, never cash." | Ticks on each tap, bells under "Free to apply." |
| 9 | 62.4–67.2 | 27–28 | **Security without shortcuts.** | Match cut on the same deep green: the words rise out, the security band's heading rises in. Three badges set in: Encrypted connection · Coupons, never cash · Payments by Square. | Ticks on the badges, a riser into the finale. |
| 10 | 67.2–69.6 | 29 | **Daylight** | An iris opens on the tree by day (real capture). | Swoosh on the iris, boom on the bar. |
| 11 | 69.6–74.4 | 30–31 | **Call to action** | The site's deep-green CTA wipes up: "Help someone this week. / Or ask for help yourself." Start donating · Apply for support, and the coupon card rises. | Ticks on the buttons, the final chord on bar 31. |
| 12 | 74.4–79.2 | 32–33 | **End card** | Paper wipe: the logo lockup, coupondonation.com, then the footer disclaimer as fine print. | A bell on the URL, the chord tail. |

## Music cue guidance
An original score, synthesized in `work/music.py` (piano, pads, plucks, bass, drums, bells, risers). It is in D major at 100 BPM, I–V–vi–IV with a lift on vi–IV–I–V in chapter 6. The sound effects share its key, reverb and beat grid: UI ticks on the taps, shimmer on the sheen, a whoosh into the nav, flips on the card deal, plucks on the journey stops. Scene cuts land on bar lines counted from frame 0.

## Share caption
See `share-copy.txt`. The poster (frame 0 and `brag.jpg`) is the hook at 4.3 s: "Every dollar you give reaches a family. All of it." over the night tree.
