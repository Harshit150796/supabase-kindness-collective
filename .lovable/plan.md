# Landing Page Compliance Copy & Stats Update

Text-only changes. No layout, styling, font, or color changes — same components, same structure, only strings (and one default state).

## 1. Brand & partnership terminology

| Where | Now | Becomes |
| --- | --- | --- |
| Live activity bar (logo marquee label) | "Powered by" | label removed (logos stay, marquee unchanged) |
| Donation flow step heading | "Choose Partner Brands" | "Select Available Retailers" |
| CTA "For Companies" | "Join DoorDash, Uber, and 50+ brands making a difference." | "Support campaigns alongside 50+ available retail networks." |
| Community Voices testimonial (James Wilson) | role label "Partner - DoorDash" | "Local Restaurant Owner" |
| Partner Brands section subhead | "Join 50+ industry leaders… backed by the world's most trusted companies." | reworded to "50+ available retail networks" with no implied endorsement/backing claim |

Also checking the same "Powered by" label in the fundraiser share/overlay views, which sits next to the CouponDonation logo (our own brand, not a retailer) — left as-is unless you want it gone too.

## 2. Statistics harmonized around the beta baseline

- Hero ticker: the climbing random counter is replaced with the fixed, factual "$1,250 raised during beta" (the live-dot and layout stay identical). The paired "donations today" counter is set to a matching realistic beta figure rather than incrementing into the thousands.
- Global Impact section: "$10,000 Total Donated" and "20 Families Helped" stay as the baseline beta metrics.
- For Donors CTA: "15K+ Families Helped" becomes "Help us reach 15,000 families".
- Impact section (secondary stats block) currently reads "20 Families Supported — Across 3 countries"; the "3 countries" sublabel is changed to United States wording so nothing contradicts the US-only representation.

Net story: ~20 families helped today, ~$10,000 donated, $1,250 raised during beta, unified goal of 15,000+ families.

## 3. Hero "Top Donors" panel

Per your note about fake amounts, the panel ships collapsed by default (it stays a working expandable panel, and any placeholder-name padding is dropped so it can only list real donors).

## 4. Verification

- TypeScript check on every edited file.
- Load the home page headless at desktop and mobile widths, screenshot, and confirm the new strings render, no wrapping/overflow breaks in the ticker or CTA cards, and no remaining "Powered by" / "Partner Brands" / "15K+" / "$132K" text anywhere in `src/`.

## Technical detail

Files: `src/components/landing/LiveActivityBar.tsx`, `src/components/landing/DonationFlow.tsx`, `src/components/landing/CTASection.tsx`, `src/components/landing/PartnerBrands.tsx`, `src/components/landing/ImpactSection.tsx`, `src/data/testimonials.ts`, `src/components/landing/hero/TopDonorsPanel.tsx`, `src/hooks/useTopDonors.ts`. No backend, Stripe, or fund-flow logic touched.
