# Project Architecture Rules
- 3D tree rules: src/components/landing/AGENTS.md. Admin rules: src/pages/admin/AGENTS.md.
## Design System Rules
- Lazy section short states fill reservations to preserve scroll; shared count/retry logic prevents false zeros and early failures.

- CouponDonation UI uses logo green `hsl(123 46% 34%)` as primary and logo blue `hsl(212 80% 42%)` as its only secondary accent; warm UI colors are forbidden outside protected third-party and 3D artwork.
- Shared organizer primitives own titles/numerals, surfaces, labels, stats, status, progress and states to prevent page drift; controls use sans.
- Marketing pages alternate neutral, soft-green, and deep-forest bands; tonal panels have no borders or shadows, and hairlines are for tables.
- No eyebrow headings, decorative pills, icon circles, gradient text, glow shadows or card-on-card.
- Shared reveals decide via `revealMode` (pre-trigger 20% below viewport, late on-screen mounts still animate, time-based fling detection) so busy frames never skip motion.
- Inline opening preloads the shared live tree; covered loads defer posters and start at clock palette. Canvas uses offsetSize, never scales.
- Cursor uses a settling rAF loop timed by the rAF timestamp, falling back to the clock past 6ms (frameDt); event targets for moves, cached DOM colours; CSS owns colour/hover; lazy-tree read-only probe.
- Editorial line reveals use removable aria-hidden overlays without replacing React-owned nodes; font/initial-frame settlement and the shared observer protect startup.
- Responsive public photos use proportional contain transforms on managed Supabase hosts or generated local variants; never append transformation parameters to unknown hosts or crop at delivery, because presentation framing belongs to the image container.
- Motion is full on every device; the OS reduced-motion setting is not consulted (founder decision lives in memory).
- Public photos stay local; without verified people-photo consent, use coupon/receipt/trace visuals.
- Preserve the two-color CouponDonation wordmark exactly as `#2e7d32` for Coupon and `#1565c0` for Donation.
- Preserve the founder-approved rotating “CouponDonation is …” hero kicker exception.
- Live Donation Tracking bars retain retailer colours (founder-approved warm-colour exception).
- Messages are written only by the `send-message` edge function after server moderation (`_shared/moderation.ts`); clients have read-only access, so safety rules hold.
- Public fundraiser pages read donors, organizers and coupon totals through security-definer read functions only; donations/profiles stay private under RLS.
- Donation INSERT/relevant UPDATE triggers recompute distinct completed-donor totals; legacy payment RPC recomputes idempotently. No checkout/coupon triggers or realtime.

- Campaign pages use the `ink` token (near-black, green undertone) for Share buttons, strong headings and the dark more-fundraisers band; Donate stays primary green; blue marks verification only.
- Comments, updates, invites and blocks are written only by the `fundraiser-actions` edge function after server moderation, keeping safety rules server-side.
- Shared public links use branded /f/ URLs, never organizer/backend URLs.
- Public fundraiser totals come from `get_fundraiser_totals` (completed donations), never stored counters, because stored counters drifted.

- Production is Lovable hosting; vercel.json and api/share are inert.
- Gold Coins are credited only by credit_gold_coins() from the scheduled dispatcher into the append-only gold_coin_ledger (unique per donation and entry type); payment tables stay read-only.
- Anonymous public submissions (partner inquiries, testimonials) go through the public-submit edge function, never direct table inserts.
- Resolve fundraiser imagery everywhere as primary gallery, then ordered gallery, then legacy cover, then branded category fallback; card delivery uses Supabase transforms and uploads create one bounded WebP.

- No fundraiser UPDATE triggers; auto-tasks poll via admin-dispatch.
- One 5-minute pg_cron job calls admin-dispatch with a Vault secret; downstream dispatchers reject calls without it.

## Coupon System Rules

- Codes/PINs stored plainly but column-locked; only owner reveal and audited staff reveal read them; prepaid = hosted link only.
- Codes are never hard-deleted: removed codes become 'returned' (never auto-filled); unused stock is voided.
- Donation-linked coupons are never deleted; re-splits void rows, server keeps the non-void total per donation+brand to the cent, and all coupon reads/sums exclude 'void'.
- Coupon writes go only through security-definer RPCs; no client writes.
- Owners reveal codes via owner_reveal_coupon; impact emails queue in donor_impact_events, sent by impact-dispatch; receipts: private bucket, signed URLs.
- Donor confirmations and live-fundraiser emails send once via claim_account_email, from confirm-donation or admin-dispatch polling.
- Fundraiser home uses one owner-scoped invoker RPC under RLS; summaries omit donor identities and credentials to preserve privacy.
