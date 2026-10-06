# Project Architecture Rules

- Tree fruit animations share one transparent WebGL logo path.
- Tree slots stay stable while allowed brands rotate non-repeating; exclude Trader Joe's, eBay, and Postmates.
- Use 18 deterministic, color-balanced canopy slots with front bias, orbit coverage, and no duplicate hanging brand.
- Use official local SVG artwork when available and preserve its colors/proportions; prefer recognizable emblems unless a brand is wordmark-led.
- Tree anchors use slot-specific leaf clearance and vertical correction.
- Tree logo meshes mount after the shared logo preload settles.

## Design System Rules

- Lazy section short states fill reservations to preserve scroll; shared count/retry logic prevents false zeros and early failures.

- CouponDonation UI uses logo green `hsl(123 46% 34%)` as primary and logo blue `hsl(212 80% 42%)` as its only secondary accent; warm UI colors are forbidden outside protected third-party and 3D artwork.
- Shared organizer primitives own titles/numerals, surfaces, labels, stats, status, progress and states to prevent page drift; controls use sans.
- Marketing pages alternate neutral, soft-green, and deep-forest bands; tonal panels have no borders or shadows, and hairlines are for tables.
- No eyebrow headings, decorative pills, icon circles, gradient text, glow shadows or card-on-card.
- Shared motion pre-triggers reveals before viewport entry and immediately completes late/flung entries; gentle mode uses opacity-only transitions to avoid blank content.
- Tree quality starts from shared desktop settings except known software renderers; committed visible-frame sampling reduces shadow/DPR costs before ambient density so screen size never selects artwork.
- Preserve context-owned MSAA and leaf alpha-to-coverage during adaptation; changing the antialias method would remount WebGL or alter the leaf silhouette.
- Tree model and appearance are shared across viewport sizes; camera aspect fitting and mobile label placement may vary, but lights, materials, exposure and geometry do not.
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

- Admin portal pages render inside AdminLayout (via DashboardLayout on /admin paths); lists use server-side pagination through DataTable, never whole-table loads.
- Admin mutations go through security-definer admin_* RPCs that re-check role (admin/staff/viewer) and write admin_audit_log; never rely on hidden buttons.
- Fundraisers are archived, not deleted; permanent delete only via admin_hard_delete_fundraiser with zero donations/coupons.
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
