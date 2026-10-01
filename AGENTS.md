# Project Architecture Rules

- Tree fruit animations share one transparent WebGL logo path.
- Tree slots stay stable while allowed brands rotate non-repeating; exclude Trader Joe's, eBay, and Postmates.
- Use 18 deterministic, color-balanced canopy slots with front bias, orbit coverage, and no duplicate hanging brand.
- Use official local SVG artwork when available and preserve its colors/proportions; prefer recognizable emblems unless a brand is wordmark-led.
- Tree anchors use slot-specific leaf clearance and vertical correction.
- Tree logo meshes mount only after the shared local-logo preload settles, preventing first-frame fallback distortion.

## Design System Rules

- CouponDonation UI uses logo green `hsl(123 46% 34%)` as primary and logo blue `hsl(212 80% 42%)` as its only secondary accent; warm UI colors are forbidden outside protected third-party and 3D artwork.
- Instrument Serif is reserved for editorial headings at weight 400; Instrument Sans serves body copy and controls, with zero negative tracking.
- Marketing pages alternate neutral, soft-green, and deep-forest bands; tonal panels have no borders or shadows, and hairlines are for tables.
- Small uppercase eyebrow headings, decorative pills, colored icon circles, gradient text, glow shadows, and card-on-card compositions are not part of the visual language.
- Shared motion uses bold translate/scale/clip/parallax in full mode; gentle mode stays visible with opacity and at most 16px rise.
- Public photos stay local; when people-photo provenance or consent is unverified, use shared coupon, receipt, or trace visuals instead.
- Preserve the two-color CouponDonation wordmark exactly as `#2e7d32` for Coupon and `#1565c0` for Donation.
- The hero's rotating “CouponDonation is …” uppercase kicker is a founder-approved exception to the no-eyebrow rule and must not be removed.
- The homepage Live Donation Tracking chart uses vertical bars in each retailer's own brand colour — a founder-approved exception to the no-warm-colour rule.- Messages are written only by the `send-message` edge function after server-side moderation (`_shared/moderation.ts`); clients have read-only access, so safety rules cannot be bypassed.
- Public fundraiser pages read donors, organizers and coupon totals through security-definer read functions only; donations/profiles stay private under RLS.
- Never add triggers, notify functions or realtime publications to donation, checkout or coupon tables; live fundraiser totals poll public read functions instead.

- Campaign pages use the `ink` token (near-black, green undertone) for Share buttons, strong headings and the dark more-fundraisers band; Donate stays primary green; blue marks verification only.
- Comments, updates, invites and blocks are written only by the `fundraiser-actions` edge function after server moderation, keeping safety rules server-side.
- Public share links stay on coupondonation.com (or a branded host via `VITE_SHARE_HOST`); never expose the raw backend function URL to users.
- Public fundraiser totals come from `get_fundraiser_totals` (completed donations), never stored counters, because stored counters drifted.

- Social link previews come from a Vercel bot-only rewrite of /f/:slug to api/share/[slug].js; share URLs stay on the main domain because crawlers do not run the SPA.
