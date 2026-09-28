# Premium visual rhythm and motion upgrade

## Goal
Restore the founder-approved hero wording, then replace the repetitive near-white ruled layout with a richer green/blue editorial system built from full-width colour bands, tonal panels, truthful product visuals, existing photography, and unmistakable but accessible motion.

## 1. Restore the hero first
- Restore `HeroHeadline` exactly from commit `06b40aa18515df2471a73332ab8eec9922cd8948`: “COUPONDONATION IS” plus Transparent / Trackable / Real-time, desktop rotation, static mobile word, screen-reader H1, text shadow, and existing buttons.
- Remove the replacement “Giving you can follow.” headline and supporting line.
- Do not change `HeroSection`, tree code, 3D assets, camera, lighting, sky, logo artwork, or any hero behavior beyond this file.
- Record the founder-approved hero-kicker exception in `AGENTS.md`.

## 2. Upgrade the shared design system and motion
- Add soft green tonal surfaces and a deep forest surface token while retaining the exact primary green, blue accent, neutral canvas, and no warm UI colours.
- Replace the blanket “directly on canvas” rule with alternating light, tinted, and deep full-width bands; use borderless, shadowless tonal panels for grouped content.
- Upgrade `Reveal`, `LineReveal`, `ImageReveal`, and `CountUp` to the requested timing and travel.
- Add shared `Parallax`, `WordReveal`, and on-view progress primitives through `useMotionPreference`.
- Gentle mode will use visible opacity plus no more than 16px rise; it will not freeze, scale, clip, parallax, or scrub transforms.

## 3. Recompose the homepage below the hero
- **Brand ribbon:** larger original-colour logos, smooth continuous marquee, soft edge masks, existing label, and latest completed-donation behavior.
- **What We Do:** preserve choreography and content; change only its containing surface to a tinted full-width band.
- **Impact Stories:** live-data magazine composition with one large lead fundraiser, smaller supporting entries, mobile scroll snap, image zoom, and animated progress.
- **Trust & Transparency:** deep green full-width band, animated 95¢ allocation ring, exact 95/3/2 wording and disclosure, and a drawn journey line.
- **Statement moment:** add one opacity-led `WordReveal` using existing approved copy.
- **Brand leaderboard:** live horizontal bars growing on view beside original retailer logos, exact figures, and honest empty state.
- **Donation flow:** place the unchanged checkout experience inside a refined tonal product setting; no payment logic changes.
- **Security:** deep/tonal strip with on-view lock and shield motion while preserving security copy.
- **Testimonials:** keep hidden unless published CMS entries exist; upgrade only its populated presentation.
- **Impact totals:** tinted full-width band with live non-zero count-ups and the current empty state.
- **Closing paths:** existing project photograph with deep green overlay and both existing calls to action.
- **Footer:** deep green structure with the exact two-colour wordmark on a light tile.

## 4. Upgrade other public pages at page boundaries
Apply varied colour bands, tonal panels, existing local photography, product/receipt motifs, and shared motion to:
1. About
2. How It Works
3. Stories
4. FAQ
5. Blog and article detail
6. Editorial story, featured story, CMS story, and live fundraiser details

No page will imply an existing photograph depicts a named recipient unless the source is genuinely tied to that record. Editorial stories remain clearly separate from live fundraiser transactions.

## 5. Restore Gold Coins safely
- Inspect the real donation/account data path first.
- Display a database-backed awarded amount only if the completed donation exposes one.
- Otherwise show that Gold Coins are credited to the account, without a number.
- Never derive an award, donation amount, or coupon count from URL parameters.

## Protected behavior and content
- No new packages.
- No changes to tree/3D code, protected hero scene settings, payment/checkout logic, processor choice, application logic, authentication, RLS, compliance/legal language, fee figures, or live-data privacy rules.
- No fabricated people, beneficiary imagery, names, amounts, progress, claims, or partner contributions.
- Use only existing local images; below-fold images remain lazy-loaded and responsively sized.

## Verification at each boundary
- Capture every completed homepage section and public page at 390px and 1440px.
- Prove visible motion with before/after captures for at least three sections: WordReveal, a ring/bar fill, and a parallax image.
- Emulate reduced motion and capture a gentle fade-plus-rise in progress and completed states.
- Check horizontal overflow, console/runtime errors, clean build, image loading, and LCP impact.
- Report completed pages, headline changes, data provenance, screenshots, unverified states, and any performance limitation honestly.
