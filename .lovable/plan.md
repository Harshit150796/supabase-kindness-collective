# Stripe Compliance: Remove Simulated Activity & Amounts from the Front Page

Goal: nothing on the public site can look like invented donation activity, invented dollar totals, or non‑US operations. An underwriter reviewing the live site should only see real data or neutral copy.

## 1. Top Donors (hero panel)
- Remove `TopDonorsPanel` from the hero entirely for now (single line removed from `HeroSection`), so no fake names/amounts render over the tree.
- Stop generating fake donors: the placeholder-donor padding is removed from the top-donors hook so if the panel is re-enabled later it can only ever show real donations.

## 2. Brand Leaderboard section
Currently hardcoded: a $1,000/$800/$600 brand chart, "Top Donors This Month" cards with fake percentage changes, a rotating ticker of invented donors ("Sarah M. donated $100"), and a "$3,300 total this month".
- Remove this section from the home page (unmount from `Index`), since every number in it is fabricated.

## 3. Live Activity Bar
Currently generates random donor names, random amounts, and climbing counters (8,234 donations / $127,450 raised).
- Replace the fabricated ticker and counters with static, factual copy about how the platform works (zero‑cash, closed‑loop retail vouchers, US‑only campaigns) — same visual bar, no invented data.

## 4. Impact Dashboard stats
Currently: "$10,000 Total Donated", "20 Families Helped", "50+ Coupons Delivered", "3+ Countries Reached".
- Drop the "Countries Reached" stat (contradicts the US‑only representation) and reframe the remaining three as neutral, non‑numeric platform descriptors, plus change the "Global Impact" eyebrow and "across the globe" copy to United States framing.

## 5. Testimonials
Currently invented people with stock Unsplash headshots labelled "Verified Donor".
- Remove the "verified" badging and stock headshots, and mark the section as illustrative example scenarios rather than claimed testimonials. If you prefer, we can hide the section entirely — say the word.

## 6. Copy scrub
- Grep the whole `src/` tree for remaining currency claims, "countries", "worldwide/global", "meals provided", and any wording that implies cash reaching organizers; fix anything that survives.

## Verification
- TypeScript check on all edited files.
- Load the home page in a headless browser at desktop and mobile widths, screenshot the full page, and confirm: no fake donor names, no invented dollar totals, no non‑US claims, and the layout still reads as a polished production landing page with no empty gaps where sections were removed.

## Notes / not in scope
- The compliance email you drafted is ready to send as-is; nothing in it depends on these edits beyond them being live, which this change makes true.
- No backend, Stripe, or fund-flow logic changes — presentation only.

## Technical detail
Files touched: `src/components/landing/HeroSection.tsx`, `src/hooks/useTopDonors.ts` (+ delete `src/lib/placeholderDonors.ts`), `src/pages/Index.tsx` (+ delete `src/components/landing/BrandLeaderboard.tsx`), `src/components/landing/LiveActivityBar.tsx`, `src/components/landing/ImpactDashboard.tsx`, `src/data/testimonials.ts` / `TestimonialsSection.tsx`.
