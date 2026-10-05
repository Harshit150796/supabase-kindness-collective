# /brag plan: CouponDonation

**Format:** landscape 1920×1080, 30 fps, 25.0 s
**Tone:** cinematic, polished. A premium launch film for a charity: big serif type, slow camera, then confident product moments. It's earnest, with no jokes.
**Goal:** more donors and more recipients. Both audiences get a clear way in.

## What it is
CouponDonation turns a monetary donation into real retail and grocery coupons for verified families, and keeps every dollar traceable from donation to coupon use.

## Who it's for
- **Donors** who want to know their money actually reached someone. They choose the stores and see the exact coupons their gift creates.
- **Recipients** (individuals, families, community orgs) who need help with groceries and essentials. Applying is free, takes about 3 minutes, and pays out in coupons only, never cash.

## What sets it apart
The donation never becomes untraceable cash. It becomes store coupons, and the trail is visible: Donation received → Coupon issued → Coupon redeemed → Receipt recorded. 95¢ of every $1 goes to purchasing coupons.

## Angle
Lead with a question most people ask about charity, *"Where does your donation actually go?"*, and answer it with the product's real output. The real `/donate` flow turns **$50** into **9 coupons** (Walmart, Target, Amazon at 3 × $5 each). The video shows that result first, then shows how a donor made it.

## Hook (0–3 s)
On a deep ink screen, a huge serif **$50** slowly pushes in under the line "Where does your donation actually go?" On the musical drop, the $50 bursts into nine real brand coupons.

## Highlights
1. **$50 → 9 coupons**, using the app's real impact math.
2. **The homepage tree**: the homepage's real 3D tree with brand-coupon fruit, captured from the running app.
3. **Choose where your help can be used**: the real donate UI, with Walmart, Target and Amazon selected, ending on "9 Coupons Created".
4. **See where every dollar goes**: the 95¢ ring and the coupon trace.
5. **Recipients**: the real apply screen, "Who are we helping?" Two quick taps.

## Punchline / outro
"Help someone this week. Or ask for help yourself." (the site's own CTA line), then the logo, the two-colour wordmark, coupondonation.com, and both buttons: **Donate now** and **Apply as Recipient**.

## Visual identity (from the codebase)
- Logo green `hsl(123 46% 34%)` is primary; logo blue `hsl(212 80% 42%)` is the only accent (verification). No warm UI colours (brand logos are protected artwork).
- Ink `hsl(123 20% 7%)` and deep forest `hsl(123 46% 20%)` bands; background `hsl(120 8% 98.5%)`.
- Instrument Serif 400 for headlines, Instrument Sans for body/UI, zero negative tracking.
- Wordmark exactly `#2e7d32` Coupon + `#1565c0` Donation.
- The "COUPONDONATION IS TRANSPARENT / TRACKABLE / REAL-TIME" kicker is the founder-approved exception and appears over the tree.
- No people photos (no verified consent), so the visuals are coupons, receipts, traces and the tree.
- No gradient text, glow, eyebrow pills or card-on-card.

## Storyboard (music 120 BPM, bars land on 1, 3, 5 … s)

| # | Time | Scene | On screen | Motion / sound |
|---|---|---|---|---|
| 1 | 0.0–3.0 | **Hook** | Ink. Giant serif "$50". "Where does your donation actually go?" | Slow push-in, words rise in one by one. Low pad and a ticking pulse, with a riser into the drop. |
| 2 | 3.0–7.0 | **Burst** | $50 shatters into 9 coupon cards (3 Walmart, 3 Target, 3 Amazon, $5 each) that fan into a grid. "Here, $50 became 9 real coupons." / "For verified families. Never cash." | Impact plus a full beat on 3.0, and the coupons land on 16ths. |
| 3 | 7.0–11.0 | **Reveal** | The real 3D homepage tree slowly orbits and pushes in. Logo badge plus wordmark, and the rotating kicker TRANSPARENT → TRACKABLE → REAL-TIME. | Big chord swell, shimmer. |
| 4 | 11.0–15.0 | **Donor flow** | Real donate UI: "Choose where your help can be used." A cursor taps Walmart, Target and Amazon (chips fill in), then a wipe to the impact card: $50 · 9 Coupons Created plus the breakdown. | Soft UI ticks in key, synced to the taps. |
| 5 | 15.0–18.5 | **Trust** | Deep-forest band. The ring draws to 95%: "95¢ of every $1". "See where every dollar goes." The trace steps tick in. | Rising arpeggio, with a tick on each step. |
| 6 | 18.5–21.5 | **Recipients** | Real apply UI: "Who are we helping?" Taps on My Family and Food & Groceries. Caption: "Need help? Apply in about 3 minutes." with "Free to apply." | Groove continues, lighter. |
| 7 | 21.5–25.0 | **Outro** | Ink. "Help someone this week. Or ask for help yourself." Logo, wordmark, coupondonation.com, then the Donate now and Apply as Recipient buttons. | Final chord, beat drops out, logo hit, tail. |

## Share caption
Ever wonder where your donation actually goes? On CouponDonation, $50 becomes real grocery coupons for verified families, and you can trace every dollar. Give, or ask for help: coupondonation.com

## Rebuild / re-roll
Everything is regenerable from `work/` (run with the repo's Vite dev server on :5173, `npm run dev -- --port 5173`):
1. `node work/capture-tree.mjs 150 work/tree`: deterministic capture of the real homepage 3D tree (fake clock, scripted orbit, local Draco decoder).
2. `python3 work/music.py`: original score and sound design → `work/score.wav`.
3. `node work/render.mjs stills 4.6,9.4`: check frames; `node work/render.mjs video 60 work/video-60.mp4` renders the 60 fps master.
4. `work/deliver.sh`: motion blur to 30 fps, −14 LUFS loudness, poster baked in as frame 0, writes `brag.mp4` and `brag.jpg`.

Timeline lives in `work/composition/comp.js` (the `T` table holds every cue). The donate and apply scenes use the app's own rendered markup (`work/markup/*.frag`) styled by the compiled `/src/index.css`.
