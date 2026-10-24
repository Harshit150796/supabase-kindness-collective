# Architecture Rules
- Read AGENTS.md in components/landing, pages/admin and components/navigation before edits.
- Google uses GIS ID tokens, not redirects, for site identity; hashed Google/raw exchange nonce; existing navigation.

## Design System Rules
- CouponDonation UI uses logo green `hsl(123 46% 34%)` as primary and logo blue `hsl(212 80% 42%)` as its only secondary accent; warm UI colors are forbidden outside protected third-party and 3D artwork.
- Wordmark is exactly `#2e7d32` Coupon / `#1565c0` Donation; founder-approved exceptions (hero kicker, night-sky header, tracking-bar retailer colours) are listed in components/landing/AGENTS.md.
- Campaign pages use the `ink` token (near-black, green undertone) for Share buttons, strong headings and the dark more-fundraisers band; Donate stays primary green; blue marks verification only.
- Marketing bands alternate neutral/soft-green/deep-forest; borderless tonal panels, hairlines for tables only; no eyebrows, decorative pills, icon circles, gradient text, glow or card-on-card.
- Shared organizer primitives own titles/numerals, surfaces, labels, stats, status, progress and states; controls use sans.
- Motion is full on every device; the OS reduced-motion setting is not consulted (founder decision lives in memory). The visitor's own Pause animations control is the only exception.
- Public photos stay local; without people-photo consent use coupon/receipt/trace visuals. Only transform managed Supabase hosts or local variants (contain, never crop at delivery).
- Module-level Intl formatters only (toLocale* per render is slow).

## Data, Privacy & Dispatch Rules
- Messages, comments, updates, invites and blocks are written only by the `send-message` and `fundraiser-actions` edge functions after server moderation (`_shared/moderation.ts`); clients have read-only access, so safety rules hold server-side.
- Public fundraiser pages read donors, organizers and coupon totals through security-definer read functions only, and totals come from `get_fundraiser_totals` (completed donations), never stored counters, to avoid drift; donations/profiles remain private under RLS.
- Donation INSERT/relevant UPDATE triggers recompute distinct completed-donor totals; the legacy payment RPC recomputes idempotently. No checkout/coupon triggers or realtime.
- Shared links: branded /f/ URLs only.
- Resolve fundraiser imagery everywhere as primary gallery, then ordered gallery, then legacy cover, then branded category fallback; card delivery uses Supabase transforms and uploads create one bounded WebP.
- Gold Coins are credited only by credit_gold_coins() from the scheduled dispatcher into the append-only gold_coin_ledger (unique per donation and entry type); payment tables stay read-only.
- Anonymous public submissions (partner inquiries, contact messages, testimonials) go through the public-submit edge function, never direct table inserts. US footer contacts use contact_messages, email support@coupondonation.com with the sender as Reply-To, and read by the team at /admin/contact.
- Production is Lovable hosting (vercel.json, api/share inert).

## Coupon System Rules
- Coupon writes go only through security-definer RPCs; no client writes. Codes/PINs are stored plainly but column-locked: owners reveal via owner_reveal_coupon, staff only through an audited reveal, and prepaid is a hosted link only.
- Codes are never hard-deleted: removed codes become 'returned' (never auto-filled); unused stock is voided. Donation-linked coupons are never deleted: re-splits void rows, keep the non-void total per donation+brand to the cent, and reads/sums exclude 'void'.
- Impact emails: impact-dispatch; receipts in a private bucket. Donor/live-fundraiser emails send once via claim_account_email.
- Optional emails skip email_suppressions (`_shared/suppression.ts`); all unsubscribes use email-unsubscribe, one opt-out for every list.
- Fundraiser home uses one owner-scoped invoker RPC under RLS; summaries omit donor identities and credentials to preserve privacy.
- Donors choose retailers and whole-dollar shares only (src/lib/donationSplit.ts: $10 minimum each, always adds up; no amount is suggested); the site never promises coupon counts or sizes. Checkouts re-check the split and send it compact (`_shared/brand-split.ts`); webhooks create ONE pending coupon slot per retailer holding its exact share, and the team sizes real coupons by hand.
- 100% of every gift reaches families; no platform fee is taken from it. Checkout adds a tip (default in checkout-total.ts), an opt-in monthly box (one fixed Square plan per checkout, `recurring_donations`) and a card-fee cover box ticked by default; an uncovered fee is paid from tips. One calculation for page and server: `supabase/functions/_shared/checkout-total.ts`. Webhooks record donations.amount = gift, plus amount_paid, tip_amount and fee_covered_amount.
- PostHog: consent-gated, ID-only; docs/workflow-contract.md.
- Example campaigns (`is_example`) read only `example_donations`/`example_coupons`; checkouts refuse them (`_shared/example-guard.ts`) and stats exclude them, so showcase data never mixes with real gifts.

## Apply as Recipient
- Four steps (ApplyLayout): Who & what, Your story, Goal & place, Review, with the deep-green "Your request" panel on wide screens (RequestPanel, mirroring the donor's "Your gift" ledger). Continue says what's missing beside it.
- Recipients pick one or more needs and, per need, up to 8 stores from the donor catalogue (src/lib/helpNeeds.ts, NeedsAndStores); `category` keeps the first need, `help_categories`/`preferred_brands`/`similar_stores_ok` keep the rest. Writes retry without those columns if a database lacks them.
- Location is a US ZIP code; donors see city and state only (`city`, `state_code`, saved at submit), never a bare ZIP. The confirmed city uses the verification blue.
- Fundraiser pages show "What's needed" (RequestedHelp): each requested store links to /donate?fundraiser=…&store=…, and the donate flow lists a fundraiser's requested stores first, marked Requested.

## Legal, Claims & Security
- Legal facts live in src/lib/legal.ts (company, email, phone, mailing address, LEGAL_VERSION). Pages use LegalPage: /terms, /privacy, /cookies, /refunds, /fundraiser-rules, /health-data-privacy, /copyright, /accessibility, all linked in the footer. Bump LEGAL_VERSION and LEGAL_UPDATED for material changes.
- Every button that creates an account, signs in or pays sits under an AgreementNotice (18+, Terms, Privacy, Refunds for donations); pressing it calls markAgreement, and useAuth records it in legal_acceptances. Submitting a fundraiser needs the ReviewStep confirmation checkbox and records "fundraiser-submit". Never remove these.
- Claims must be true: no "verified families", "PCI compliant" or "tax-deductible" wording, no claimed retailer partnerships or endorsements, and CouponDonation is never called a nonprofit or charity; CouponDonation Inc. is a for-profit company and gifts are not tax-deductible. No invented stories, testimonials, reviews, people or figures: editorial and CMS stories were removed for this reason, and testimonials pictured with stock photos never show. Testimonials need the person's permission; staff or relatives must be disclosed. The Coupon assistant follows the same facts.
- Analytics loads only after Okay on the cookie bar and never with Global Privacy Control; Essential only and Cookie settings (footer) switch it off. Motion keeps playing by default; the hero and footer "Pause animations" control (src/lib/motionChoice.ts) is the WCAG 2.2.2 pause and must stay.
- Public edge functions that send codes or reveal account existence are rate-limited through `_shared/rate-limit.ts` (hashed keys in request_rate_limits). Retired admin/import functions return 410; don't revive them without authentication.
- Account deletion and data copies are requests to support@coupondonation.com (Settings), answered within 45 days; deletion within 30 days apart from records the law requires.

## Search (SEO)
- Every public page renders `<SEO>` (title under ~60 characters before " | CouponDonation", description under 155, canonical without query string); private, utility, example and empty pages pass `noindex` (account routes are wrapped in `Private` in App.tsx). Helpers live in src/lib/seo.ts.
- index.html holds true defaults marked `data-rh` so Helmet replaces them; it never carries a canonical or og:url, because one file serves every route.
- Lovable pre-renders pages for verified crawlers (search engines, AI crawlers, social previews) at request time, and content that loads late can be missed: landing pages keep answers in the HTML (no closed accordions; the FAQ page uses forceMount) and lists load in one small query.
- Landing pages: /help/:need (src/data/needs.ts), the ways to give (src/data/givePages.ts) and /gofundme-alternative (sourced; recheck GoFundMe's facts before editing). Add one only with real, specific content: no city, store or keyword pages generated in bulk (Google's scaled-content policy). New pages go in public/sitemap.xml, the footer and public/llms.txt.
- public/robots.txt keeps one `User-agent: *` group (a bot named in its own group ignores the Disallow lines). Open, real fundraisers and blog posts are listed by the `sitemap` edge function named in robots.txt (plain-text format, because Supabase serves function responses as text/plain); new or edited fundraisers ping IndexNow through the `indexnow` function, whose key file public/88cc93917332877d9126bf9574635250.txt must never be removed.
- The share image is public/og-image.png (1200×630, with the logo).

## Homepage fundraisers on phones
- Below md, "Fundraisers open now" (ImpactStories) shows FundraiserMosaic: panels of up to four fundraisers (one tall tile, two small, one wide; every other panel mirrored) that swipe sideways, ending with "See all" and "Start a fundraiser" tiles, then a full-width "See all fundraisers" button. Founder's choice (Oct 2026); keep it rather than going back to one card per screen. Example fundraisers keep their "Example campaign" label. Desktop is unchanged.

## Donated cards
- /donate-a-card takes unused digital gift cards, store coupons and promo codes (no physical cards), signed in, at most 5 a day, to a chosen open request or the shared pool. It is promoted by DonateCardPromo (the forest-green gift card panel under the donate card in DonationFlow, on the homepage and /donate; founder's pick, keep it prominent), from the site menu (Donate a coupon), /donate-gift-cards, fundraiser pages (RequestedHelp) and the footer.
- Submissions go through submit_card_donation into card_donations; codes sit in card_donation_secrets, which no browser role can read. Staff see a code only through admin_card_donation_secret (audited) at /admin/card-donations, then admin_review_card_donation accepts it (to a family through admin_add_outside_coupon, or to coupon stock for the pool) or declines it with a reason; the secret row is deleted either way. Screenshots live in the private card-donations bucket.
- We never buy or pay for cards, and the page keeps its scam warning.
