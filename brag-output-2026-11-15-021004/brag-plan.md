# /brag plan: "Hope vs. Know" (vertical chat video)

**Format:** vertical 1080×1920, 30 fps. Two cuts from one composition: **56 s** (full, LinkedIn / YouTube / Facebook) and **30 s** (Reels / TikTok / Shorts).
**Source material:** the three files supplied (the "Hope vs. Know" script, the source dossier PDF and the DOCX caption sheet). Every number and quote comes from them, word for word, with outlet and year on screen.
**Idea:** fraud is rare, but not knowing what your donation did is common, and CouponDonation turns hoping into knowing. The film is built around that one swap: the viewer's phone is stuck on "Payment successful" until the product explains itself, and the score stays unresolved until "You'll know."

## Who speaks
The script has two people talking (JHK asks what viewers are thinking, MA has the answers). I can't film people, so the two speakers are:
- **The viewer's phone** (JHK's lines): a phone that shows "Payment successful" and never changes, until the receipt line at 40.6 s (full) / 16.6 s (short). Its bubbles are the viewer's questions.
- **Coupon, the AI tree** (MA's lines): the brand's mascot (`video-kit/mascot`). It hops in on its first line, points when it names a number, cringes at "Oof.", and cheers on "You'll know."

Every line is a burned-in subtitle bubble, so the film works with the sound off. There is no voiceover. The line timings follow the script's beats, so the two real voices can be laid over it later.

## Storyboard (full cut; 120 BPM, every plate cut on a beat)
| Time | Plate | On screen |
|---|---|---|
| 0–3.0 | **Hook** | "Where did your donation actually go?" from frame 0. A generic mock fundraiser (grey bars, no real platform, no story): scroll, tap Donate, "Payment successful"… then nothing else happens. |
| 3.0–6.0 | Stat | **Only 36%** of donors can easily see what their gift did · Zeffy donor survey, 2025 |
| 6.0–7.8 | Headlines | Global News, Apr 2025 · KPRC 2 Houston, Jul 2026 |
| 7.8–10.9 | Stat | **Under 0.1%** of campaigns, GoFundMe says · GoFundMe, via NPR, 2018 |
| 10.9–12.9 | Headline | NBC Nightly News, Nov 2018: "…Was A Hoax, Prosecutors Say" |
| 12.9–14.9 | Stat | **$400K**, 14,000+ donors, one fake story · U.S. Attorney, District of New Jersey, 2019. Small print: all donors were later refunded (GoFundMe, via NPR, 2018) |
| 14.9–18.5 | Quote | NPR, Nov 2018: "They splurged on a BMW, … and 'hit the casinos.'" The "Oof." jolt |
| 18.5–19.9 | Cash | Bills drift up and out of frame |
| 19.9–21.7 | Quote | FTC consumer alert, Sept 25, 2025: "Before you donate, find out where the money is going" |
| 21.7–24.4 | Stat | **Only 1 in 4** say disaster appeals are "very clear" · BBB Give.org, 2019 |
| 24.4–27.0 | Line | "Giving shouldn't mean guessing." |
| 27.0–32.4 | Phone | Tight on the phone, then the "Payment successful" screen that never changed |
| 32.4–35.5 | Stat | **Fewer than 1 in 5** first-time donors give again the next year · Fundraising Effectiveness Project, 2025 (18.9%) |
| 35.5–41.0 | The real site | Phone-width captures of coupondonation.com: pick stores, choose an amount ($25 + $25 for $50), pay by card (the review's own "We email you as your coupons are given out and used, with receipts" and "Your receipt lists the gift, tip and fee separately" highlighted) |
| 41.0–43.6 | Trail | The homepage's own journey: Donation, Allocation, Coupon, Use. "The receipt closes the trail." |
| 43.6–48.5 | Gag | A grocery gift card ≠ BMW |
| 48.5–52.5 | Hope → Know | "Hope." is struck through as "Know." fills in |
| 52.5–56.0 | End card | "Stop hoping. Start knowing." · logo · Give what people need. · coupondonation.com · the footer's full disclaimer |

The 30 s cut keeps the same hook and payoff with the scam story as the turn, as the script asks.

## Copy: what changed from the script, and why
| Script | Film | Why |
|---|---|---|
| "Honestly? Most people never find out." | "Honestly? Most donors can't easily find out." + the Zeffy stat | The dossier: no study says "never find out"; Zeffy's 36% supports "can't easily". |
| "You donate vouchers and gift cards for essentials, not cash." | "Your donation becomes gift cards for essentials, not cash." | The site's words (Index.tsx: "Your donation becomes gift cards for the groceries, medicine and rides they asked for"). "Voucher" is a recipient-dashboard term. |
| "When yours gets redeemed, you get the receipt." | "You get a receipt for every gift." | The dossier's own fix: the site promises a receipt for every gift (FAQ.tsx). The review step also says coupons are emailed "as they are given out and used, with receipts", which the screen highlights. |
| "Pledged → Voucher → Redeemed → Receipt" | The homepage journey on screen: Donation, Allocation, Coupon, Use | The script's own rule: record the real site, not mockups. "Pledged" is not a site word. |
| "A grocery voucher can't buy a BMW." | "A grocery gift card can't buy a BMW." | Same reason. |
| "$400K. 14,000 donors." | "14,000+ donors." | The U.S. Attorney's release says "more than 14,000 donors". |

## Claims check
- **Product claims** are traced to the site's own copy in the repo: Index.tsx, FAQ.tsx, the donate flow (receipt, email and Square lines, captured live) and the homepage journey. No coupon counts or sizes, no timing promises, no tip percentages (the review card's "Most donors leave about 15%" sits outside every view), no "verified", no retailer partnership claims. The two stores shown are the donate flow's own catalogue; the end card carries the footer's disclaimer in full (trademarks, no affiliation, "CouponDonation Inc. is not a registered charity, and gifts are not tax-deductible").
- **Outside facts** are quoted from the dossier exactly, each with outlet and year on screen. The dossier's cautions are applied: the GoFundMe figure is credited as "GoFundMe says" (company-reported, 2018); casino trips are credited to NPR; the Zeffy figure is credited by name (a vendor survey); the 18.9% retention figure is not put next to the partial-year 11.3%; GoFundMe's unauthorized-pages story is not used (it would need "unauthorized pages", not "fraud").
- **Not re-verified here:** this sandbox cannot reach the source sites, so the external figures are the dossier's, not independently re-checked. Screenshots of the source pages in the pinned comment are still worth taking before posting.
- **Footage:** no news clips or photos are used (they belong to the outlets). Headlines and quotes are typeset cards that credit the outlet and date.

## Look and sound
Brand tokens only: logo green and blue, forest, ink, paper; Instrument Serif and Sans. Outlined numerals that fill are the site's own 100% band device. Blue marks the credits (verification). All text stays out of the bottom fifth and the right edge.
Score: D major, 120 BPM, original and synthesized. While we hope: a dark pad, a clock ticking on every beat, sparse piano questions, a heartbeat under the stories. At the first product screen the clock stops and the groove switches on. After "Oof." and "You'll know." there is a beat of near-silence, then "You'll know." lands on a resolved D chord with bells. Loudness -14 LUFS, true peak -1.5 dBTP.
