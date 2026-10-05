# Level 1: Your first donation (comic cut)

A 47s comic explainer that walks a new donor through one donation like a game level. Coupon, the homepage's AI tree, is the guide. A HUD tracks progress through eight checkpoints, and two quick quizzes make the viewer guess before the answer lands.

| Format | File | Use |
| --- | --- | --- |
| 16:9, 1920×1080 | `coupon-level1-16x9.mp4` | Website, YouTube, LinkedIn |
| 9:16, 1080×1920 | `coupon-level1-9x16.mp4` | Reels, TikTok, Shorts (text kept inside y 220–1600) |

## Beats

| # | Time | Scene | What the viewer learns |
| --- | --- | --- | --- |
| 1 | 0.0–3.5 | Hook | "Level 1!" and "Where does your $50 go?" Coupon says hello. |
| 2 | 3.5–8.0 | Find | Two ways in, Donate now or Start Donating, with the same three steps. |
| 3 | 8.0–12.5 | Stores | Pick up to five stores, $5 minimum each (real step-1 UI). |
| 4 | 12.5–18.5 | Amount quiz | 3 stores and $50: how many coupons? 9 (real step-2 counter). |
| 5 | 18.5–22.0 | Coupons | Nine coupons deal into three store decks: coupons, not cash. |
| 6 | 22.0–27.0 | Pay | Secure checkout, then the real "Thank you for giving." page. |
| 7 | 27.0–33.0 | Gold Coins quiz | $50 earns 500 Gold Coins (10 per $1). |
| 8 | 33.0–38.0 | Track | Confirmation email, then Donated → Coupon created → Received → Used. |
| 9 | 38.0–42.5 | Goal | One goal per fundraiser; only completed donations count. Level complete. |
| 10 | 42.5–47.0 | CTA | "Your turn." Find someone to help. Any amount from $5. |

## Review

A five-lens review (brand, facts, readability, craft, 9:16 safe zones) plus an adversarial verify pass produced the final fix list. It gave both quizzes and the payment beat more hold time, kept falling coins behind all text, cleaned up the level-complete payoff, and kept every 9:16 caption inside y 220–1600 and x ≤ 940.

## Guardrails

- All copy is taken from the app's own UI, emails and rules. Fundraisers and goals are labelled as examples, with no names, totals or testimonials.
- Logo green is the primary colour. Logo blue appears only on verification and Gold Coins. The wordmark is unaltered, and there are no people photos.
- The score is synthesized and synced to the film's exported cue table (`work/comic-cues.json`), mastered to -14 LUFS.

## Rebuild

```
cd work
node dump-cues.mjs                                # export the film's cue table
rm -f comic-score.wav && ./deliver-comic.sh h     # 16:9
./deliver-comic.sh v                              # 9:16 (reuses the score)
```

Run this against the repo's Vite dev server on 127.0.0.1:5173.

---

# Co-op mode: give or get help (second comic cut)

A 36.5s two-player cut for both audiences. Player 1 ("I need help") applies and shares. Player 2 ("I want to help someone") gives. Both watch the same coupon land: Player 1 reveals and marks it used, Player 2 gets the update, and they fill the goal together. It ends on the homepage's own dual call to action.

| Format | File |
| --- | --- |
| 16:9, 1920×1080 | `coupon-coop-16x9.mp4` |
| 9:16, 1080×1920 | `coupon-coop-9x16.mp4` |

| # | Time | Scene | Real product moment |
| --- | --- | --- | --- |
| 1 | 0.0–3.5 | Hook | The homepage's split doors: "I need help" / "I want to help someone". "Two players. One goal." |
| 2 | 3.5–11.0 | Apply (P1) | The 4-step application ("Who are we helping?" → "Review and submit your request"), "Free to apply. You receive retail coupons only — never cash.", Submit Fundraiser, "Great work!" |
| 3 | 11.0–13.5 | Share (P1) | "Your fundraiser is ready to share." → Share Fundraiser → "Link copied!" |
| 4 | 13.5–18.0 | Give (P2) | Donate now on the example fundraiser, coupons deal out: "Coupons, not cash" |
| 5 | 18.0–24.5 | Arrive (P1) | "A donation arrived for your fundraiser" → Coupons → Reveal code → Used → Mark as used → "Marked as used" |
| 6 | 24.5–28.0 | Update (P2) | "An update on your donation to “Example fundraiser”": Donated → Coupon created → Received → Used |
| 7 | 28.0–32.0 | Goal (both) | Three donors fill the example goal → Fully funded → "Co-op complete!" |
| 8 | 32.0–36.5 | CTA | "Help someone this week. Or ask for help yourself." with Start donating / Apply for support, and "U.S. residents, free to apply." |

On screen, Reveal code is what turns the donor's step to Received, and Mark as used is what turns it to Used, exactly as the product works. Coupon codes are always masked. The film never promises timing, approval or verification. Rebuild with `PAGE=coop node dump-cues.mjs`, then `FILM=coop ./deliver-comic.sh h` (or `v`).
