# Project Architecture Rules

- Tree fruit animations share one transparent WebGL logo path.
- Tree slots stay stable while allowed brands rotate non-repeating; exclude Trader Joe's, eBay, and Postmates.
- Use 18 deterministic, color-balanced canopy slots with front bias, orbit coverage, and no duplicate hanging brand.
- Use official local SVG artwork when available and preserve its colors/proportions; prefer recognizable emblems unless a brand is wordmark-led.
- Tree anchors use slot-specific leaf clearance and vertical correction.
- Tree logo meshes mount after the shared logo preload settles.

## Design System Rules

- CouponDonation UI uses logo green `hsl(123 46% 34%)` as primary and logo blue `hsl(212 80% 42%)` as its only secondary accent; warm UI colors are forbidden outside protected third-party and 3D artwork.
- Instrument Serif is reserved for editorial headings at weight 400; Instrument Sans serves body copy and controls, with zero negative tracking.
- Marketing pages alternate neutral, soft-green, and deep-forest bands; tonal panels have no borders or shadows, and hairlines are for tables.
- No eyebrow headings, decorative pills, icon circles, gradient text, glow shadows or card-on-card.
- Shared motion uses bold translate/scale/clip/parallax in full mode; gentle mode stays visible with opacity and at most 16px rise.
- Public photos stay local; without verified people-photo consent, use coupon/receipt/trace visuals.
- Preserve the two-color CouponDonation wordmark exactly as `#2e7d32` for Coupon and `#1565c0` for Donation.
- The hero's rotating “CouponDonation is …” uppercase kicker is a founder-approved exception to the no-eyebrow rule and must not be removed.
- The homepage Live Donation Tracking chart uses vertical bars in each retailer's own brand colour — a founder-approved exception to the no-warm-colour rule.
- Messages are written only by the `send-message` edge function after server moderation (`_shared/moderation.ts`); clients have read-only access, so safety rules cannot be bypassed.
- Public fundraiser pages read donors, organizers and coupon totals through security-definer read functions only; donations/profiles stay private under RLS.
- Never add triggers, notify functions or realtime publications to donation, checkout or coupon tables; live fundraiser totals poll public read functions instead.

- Campaign pages use the `ink` token (near-black, green undertone) for Share buttons, strong headings and the dark more-fundraisers band; Donate stays primary green; blue marks verification only.
- Comments, updates, invites and blocks are written only by the `fundraiser-actions` edge function after server moderation, keeping safety rules server-side.
- Public share links stay on coupondonation.com (or a branded host via `VITE_SHARE_HOST`); never expose the raw backend function URL to users.
- Public fundraiser totals come from `get_fundraiser_totals` (completed donations), never stored counters, because stored counters drifted.

- Production is Lovable hosting; vercel.json and api/share are inert.
- Gold Coins are credited only by credit_gold_coins() from the scheduled dispatcher into the append-only gold_coin_ledger (unique per donation and entry type); payment tables stay read-only.
- Anonymous public submissions (partner inquiries, testimonials) go through the public-submit edge function, never direct table inserts.
- Resolve fundraiser imagery everywhere as primary gallery, then ordered gallery, then legacy cover, then branded category fallback; card delivery uses Supabase transforms and uploads create one bounded WebP.

- Admin portal pages render inside AdminLayout (via DashboardLayout on /admin paths); lists use server-side pagination through DataTable, never whole-table loads.
- Admin mutations go through security-definer admin_* RPCs that re-check role (admin/staff/viewer) and write admin_audit_log; never rely on hidden buttons.
- Fundraisers are archived, not deleted; permanent delete only via admin_hard_delete_fundraiser with zero donations/coupons.
- No UPDATE triggers on fundraisers: payment webhooks update it via apply_donation_to_fundraiser; fundraiser auto-tasks come from admin-dispatch polling.
- One 5-minute pg_cron job calls admin-dispatch with a Vault secret; downstream dispatchers reject calls without it.

## Coupon System Rules

- Codes/PINs stored plainly but column-locked; only owner reveal and audited staff reveal read them; prepaid = hosted link only.
- Codes are never hard-deleted: removed codes become 'returned' (never auto-filled); unused stock is voided.
- Donation-linked coupons are never deleted; re-splits void rows, server keeps the non-void total per donation+brand to the cent, and all coupon reads/sums exclude 'void'.
- Coupon writes go only through security-definer RPCs; no client writes.
- Owners reveal codes via owner_reveal_coupon; impact emails queue in donor_impact_events, sent by impact-dispatch; receipts: private bucket, signed URLs.
- Donor confirmations and live-fundraiser emails send once via claim_account_email, from confirm-donation or admin-dispatch polling.
