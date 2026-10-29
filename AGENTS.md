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
- Analytics loads only after Okay on the cookie bar and never with Global Privacy Control; Essential only and Cookie settings (footer) switch it off. While the bar is up, PrivacyConsentBanner pads the bottom of the page by its height so the last lines (the footer's notice) never sit hidden under it. Motion keeps playing by default; the hero and footer "Pause animations" control (src/lib/motionChoice.ts) is the WCAG 2.2.2 pause and must stay.
- Public edge functions that send codes or reveal account existence are rate-limited through `_shared/rate-limit.ts` (hashed keys in request_rate_limits). Retired admin/import functions return 410; don't revive them without authentication.
- Account deletion and data copies are requests to support@coupondonation.com (Settings), answered within 45 days; deletion within 30 days apart from records the law requires.

## Scoped rules
- Read supabase/AGENTS.md before changing authentication, permissions, payments, messaging, email, coupon claims, storage or security; its October audit rules also constrain frontend callers.
- Read src/AGENTS.md before changing frontend files; it owns public-page SEO rules. Other subdirectories have their own AGENTS.md to read before edits, as listed above.

## Homepage fundraisers on phones
- Below md, "Fundraisers open now" (ImpactStories) shows FundraiserMosaic: panels of up to four fundraisers (one tall tile, two small, one wide; every other panel mirrored) that swipe sideways, ending with "See all" and "Start a fundraiser" tiles, then a full-width "See all fundraisers" button. Founder's choice (Oct 2026); keep it rather than going back to one card per screen. Example fundraisers keep their "Example campaign" label. Desktop is unchanged.

## Homepage need filter and totals
- "Fundraisers open now" filters by need with icon chips (founder's pick Oct 2026, option 3 of 10): All needs plus each need that has open fundraisers, labelled with needLabel() and NeedIcon (src/components/needs/NeedIcon.tsx, kept small so the homepage never loads the apply form), in HELP_NEEDS order; a 2-column grid on phones, one wrapping row from md. No counts on the chips, and no fundraiser totals at the end of the list on any device (founder decision): the links read "See all fundraisers". Sort is a labelled select. The /help guides are links, not filters: they sit in a closed "Asking for yourself? Read a guide" disclosure below the bar.

## Profiles, follows and message oversight (founder request, Oct 2026)
- Everyone can have a GoFundMe-style profile at /u/:username (PublicProfile): photo, cover, profile name, username, 160-character bio, up to 5 causes (HELP_NEEDS ids), links (website + social handles, no payment apps), optional city, pinned fundraisers (up to 3 they run or gave to). /profile edits it; /people searches, suggests people and shows the Following feed and new followers.
- Private by default (founder's choice): a private profile shows only name, photo and cover and is never searchable. Public profiles show the fundraisers someone supported only for gifts not made anonymously and only while "Show the fundraisers I support" is on; amounts never appear anywhere on profiles. Profile pages are noindex.
- Profile fields, follows, blocks and profile reports are written only by the profile-actions edge function (moderated through _shared/profile-rules.ts, rate-limited); trg_profile_guard keeps every public-profile column from browser updates. Reads go through security-definer RPCs (get_profile, get_follow_list, search_people, suggested_people, following_feed …). Photos live in the person's own folder of the public fundraiser-covers bucket as profile-avatar-* / profile-cover-* (the workspace blocks new public buckets; the unused profile-media policies in the migration are harmless).
- Blocking is person-level (user_blocks): it ends follows both ways, hides each profile from the other, and closes messages between them (send-message checks it).
- Messages stay tied to fundraisers (supporters ↔ organizers); there are no person-to-person DMs (founder's choice).
- Admin > Messages lists every conversation and who is in it; reading one goes through admin_conversation_thread, which writes conversation.view to the audit log every time. Removing a conversation or message hides it from both people at once (RLS), keeps a sealed copy for admins, and purge_removed_conversations (called by admin-dispatch) deletes it a year after removal (founder's choice). Admin > Profiles clears profile content, hides profiles and turns off messaging, profile editing or following (profiles.restrictions); every action needs a reason and is audited. The Privacy Policy discloses that the safety team can read conversations.

## Donated cards
- /donate-a-card takes unused digital gift cards, store coupons and promo codes (no physical cards), signed in, at most 5 a day, to a chosen open request or the shared pool. It is promoted by DonateCardPromo (the forest-green gift card panel under the donate card in DonationFlow, on the homepage and /donate; founder's pick, keep it prominent), from the site menu (Donate a coupon), /donate-gift-cards, fundraiser pages (RequestedHelp) and the footer.
- Submissions go through submit_card_donation into card_donations; codes sit in card_donation_secrets, which no browser role can read. Staff see a code only through admin_card_donation_secret (audited) at /admin/card-donations, then admin_review_card_donation accepts it (to a family through admin_add_outside_coupon, or to coupon stock for the pool) or declines it with a reason; the secret row is deleted either way. Screenshots live in the private card-donations bucket.
- We never buy or pay for cards, and the page keeps its scam warning.
