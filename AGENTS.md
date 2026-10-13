# Architecture Rules
- Scoped rules: tree/opening/motion in src/components/landing/AGENTS.md, admin portal in src/pages/admin/AGENTS.md, navigation/auth in src/components/navigation/AGENTS.md. Read the matching file before changing that area.

## Design System Rules
- CouponDonation UI uses logo green `hsl(123 46% 34%)` as primary and logo blue `hsl(212 80% 42%)` as its only secondary accent; warm UI colors are forbidden outside protected third-party and 3D artwork.
- Preserve the two-color wordmark exactly: `#2e7d32` for Coupon, `#1565c0` for Donation. Founder-approved exceptions: the rotating "CouponDonation is …" hero kicker, and retailer colours kept in the Live Donation Tracking bars.
- Campaign pages use the `ink` token (near-black, green undertone) for Share buttons, strong headings and the dark more-fundraisers band; Donate stays primary green; blue marks verification only.
- Marketing pages alternate neutral, soft-green and deep-forest bands; tonal panels have no borders or shadows and hairlines are for tables. No eyebrow headings, decorative pills, icon circles, gradient text, glow shadows or card-on-card.
- Shared organizer primitives own titles/numerals, surfaces, labels, stats, status, progress and states to prevent page drift; controls use sans.
- Motion is full on every device; the OS reduced-motion setting is not consulted (founder decision lives in memory).
- Public photos stay local; without verified people-photo consent use coupon/receipt/trace visuals. Responsive photos use proportional contain transforms on managed Supabase hosts or generated local variants — never append transformation parameters to unknown hosts or crop at delivery, because framing belongs to the image container.
- Use module-level Intl formatters; toLocale* per render is slow.

## Data, Privacy & Dispatch Rules
- Messages, comments, updates, invites and blocks are written only by the `send-message` and `fundraiser-actions` edge functions after server moderation (`_shared/moderation.ts`); clients have read-only access, so safety rules hold server-side.
- Public fundraiser pages read donors, organizers and coupon totals through security-definer read functions only, and totals come from `get_fundraiser_totals` (completed donations), never stored counters, to avoid drift; donations/profiles remain private under RLS.
- Donation INSERT/relevant UPDATE triggers recompute distinct completed-donor totals; the legacy payment RPC recomputes idempotently. No checkout/coupon triggers or realtime.
- Shared public links use branded /f/ URLs only.
- Resolve fundraiser imagery everywhere as primary gallery, then ordered gallery, then legacy cover, then branded category fallback; card delivery uses Supabase transforms and uploads create one bounded WebP.
- Gold Coins are credited only by credit_gold_coins() from the scheduled dispatcher into the append-only gold_coin_ledger (unique per donation and entry type); payment tables stay read-only.
- Anonymous public submissions (partner inquiries, contact messages, testimonials) go through the public-submit edge function, never direct table inserts. US footer contacts use contact_messages, email support@coupondonation.com with the sender as Reply-To, and read by the team at /admin/contact.
- Production is Lovable hosting; vercel.json/api/share are inert.

## Coupon System Rules
- Coupon writes go only through security-definer RPCs; no client writes. Codes/PINs are stored plainly but column-locked: owners reveal via owner_reveal_coupon, staff only through an audited reveal, and prepaid is a hosted link only.
- Codes are never hard-deleted: removed codes become 'returned' (never auto-filled); unused stock is voided. Donation-linked coupons are never deleted: re-splits void rows, keep the non-void total per donation+brand to the cent, and reads/sums exclude 'void'.
- Impact emails queue in donor_impact_events and are sent by impact-dispatch; receipts use a private bucket with signed URLs. Donor confirmations and live-fundraiser emails send once via claim_account_email, from confirm-donation or admin-dispatch polling.
- Fundraiser home uses one owner-scoped invoker RPC under RLS; summaries omit donor identities and credentials to preserve privacy.
- Donors choose retailers and whole-dollar shares only (src/lib/donationSplit.ts: $10 minimum each, always adds up; no amount is suggested); the site never promises coupon counts or sizes. Checkouts re-check the split and send it compact (`_shared/brand-split.ts`); webhooks create ONE pending coupon slot per retailer holding its exact share, and the team sizes real coupons by hand.
- 100% of every gift reaches families; no platform fee is taken from it. Checkout adds a tip (default in checkout-total.ts), an opt-in monthly box (one fixed Square plan per checkout, `recurring_donations`) and a card-fee cover box ticked by default; an uncovered fee is paid from tips. One calculation for page and server: `supabase/functions/_shared/checkout-total.ts`. Webhooks record donations.amount = gift, plus amount_paid, tip_amount and fee_covered_amount.
- PostHog: consent-gated, ID-only; docs/workflow-contract.md.
