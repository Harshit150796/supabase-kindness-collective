# Fundraiser home, footer and authoritative totals — completion report

## Changes and exact cause

The legacy confirmation RPC incremented `amount_raised` but did not keep `donors_count` correct. The stored column was stale, not a rendering error. Completed donations are now authoritative: a locked recompute function sums completed amounts and counts distinct `coalesce(donor_id::text, lower(donor_email), id::text)`. An AFTER donation INSERT/relevant UPDATE trigger reconciles totals, including status, amount, campaign reassignment and donor identity changes. Every campaign was backfilled once; changed counters were audited. No donation record was changed by the backfill.

Existing Stripe/Square paths insert a donation then call `apply_donation_to_fundraiser`. That RPC now invokes the same idempotent recompute, preventing trigger-plus-RPC double-counting. Checkout/webhook files were not changed. The donation trigger is the explicit exception requested in this brief; no fundraiser UPDATE trigger or coupon trigger was added.

The shared primitives live in `src/components/ui/organizer.tsx`: page header, card surface, section label, stat, status chip, progress, empty/error state and shaped skeleton. The dashboard and fundraiser home use them. Fundraiser home loads one owner-scoped `get_my_fundraisers` RPC, including live totals, ready counts, last donation time and ordered images; there are no client per-card queries or credential fields. Its database implementation reuses protected helpers internally per campaign. The multi-campaign donor summary adds distinct-per-campaign counts; a donor supporting two different campaigns contributes to both campaign counts, not a globally deduplicated organizer audience.

The redundant eye action is removed. Share uses native sharing or clipboard plus confirmation, always the branded public `/f/:slug` URL; a missing slug falls back to a public UUID lookup. Manage and the card open the organizer dashboard; the ready chip links to `#coupons`. The footer uses a proportioned 12-column grid, full-colour light lockup, shared labels, one signup link, support contact and partnership-labelled connect contact.

## Verification and limits

- Automatic build reports `build OK` after the final frontend edits, with no reported compile errors. A separate manual TypeScript command was not run because the environment runs build/typechecks automatically; no standalone typecheck result is claimed.
- Existing Deno suite: **42 passed, 0 failed**.
- `supabase/tests/fundraiser_totals.sql` executed successfully as a self-undoing database proof: completion, repeat donor normalization, unidentified guests, amount changes, refund, legacy repeated RPC, owner/public count, payload privacy and all-campaign consistency. Temporary records and totals were rolled back.
- Real reference campaign stores **$20 and 1 donor**. Owner-home RPC under authenticated database role returned $20/1; dashboard ledger RPC returned 1; real public page `/f/help-feed-my-family-this-month-7kvke2` visibly showed **1 donor**. The real ready-to-reveal count was **0**; screenshots with a ready chip intentionally use fixture data.
- Inspected fundraiser home and footer at **1440, 1024, 768 and 390px**. Desktop cards have a clear image/content split; 390px stacks image and content with reachable Share/Manage controls. No horizontal overflow at any width. The footer lockup measured 244px wide and retained **16px right padding** at all widths; the name never touched/crossed its surface. Tablet footer places brand above columns; mobile stacks groups. Contact addresses wrap inside their columns. Existing consent/voucher notices can overlay the footer while open; their behavior was not changed.
- Browser verified native share URL, clipboard fallback/toast, Manage URL, Coupons anchor, two-campaign summary, empty/error-retry states and reduced motion (`animation: none`, transition `0s`). No captured runtime errors.
- Signed-out organizer home redirects to `/auth`. **Actual authenticated owner browser screens and controls remain unverified**: this project uses external unmanaged auth. Owner-home visual checks used isolated RPC/auth fixtures, not a real session. SQL role-context checks are not browser authentication proof. No real checkout/refund transaction was performed.
- No publish, no new packages, no emails sent; tree/hero unchanged. Existing security-linter warnings remain outside this pass; no clean-linter claim.

## Every direct totals reader found

| Reader | Fields/source and effect |
|---|---|
| `src/pages/MyFundraisers.tsx` | `amount_raised`, `donors_count` from the new owner RPC; rendered totals and summary. |
| `src/pages/FundraiserDashboard.tsx` | Stored fundraiser fields for fallback/share metadata; main visible totals from privacy-safe donation RPC. |
| `src/hooks/useFundraisers.ts` | Selects both fundraiser columns for campaign listing consumers; now reconciled at source. |
| `src/pages/admin/AdminFundraisers.tsx` | Displays both stored counters for operational comparison. |
| `src/pages/overlays/QRCodeOverlay.tsx` | Selects and displays stored `amount_raised`, including live row updates. |
| `src/pages/overlays/ProgressBarOverlay.tsx` | Selects/displays stored `amount_raised` and computes progress, including live row updates. |
| `src/hooks/useFeaturedStories.ts` | Reads both fields from CMS editorial stories, not live fundraiser counters. |
| `src/pages/admin/AdminStories.tsx` | Reads/edits both fields on CMS stories; manual editorial data is not backfilled by donation reconciliation. |
| `src/components/story/DonationPanel.tsx` | Camel-case editorial `amountRaised`/`donorsCount`; not a live fundraiser-table reader. |
| `src/components/apply/ShareModal.tsx` | Camel-case `amountRaised` prop from caller, including dashboard live-total fallback. |
| `src/data/impactStories.ts` | Static editorial `amountRaised`/`donorsCount` fixtures; not live totals. |
| `src/data/featuredStories.ts` | Static editorial `amountRaised`/`donorsCount` fixtures; not live totals. |
| `src/integrations/supabase/types.ts` | Generated schema/type declarations, not a runtime reader. |

Public campaign totals travel through `useFundraiserLive.ts` → `get_fundraiser_totals` → campaign `DonationPanel.tsx`; this RPC now uses the same distinct-donor formula, and the public label says donors rather than donations. Static/CMS story totals are deliberately distinguished from real donation counters; this change cannot make manual editorial figures ledger-derived.

## Proposed next passes — no additional restyling performed

1. Public donation/trust journey: `/f/:slug`, `/donate`, confirmation/cancellation, `/auth`, `/reset-password`; highest-trust screens first. Normalize primitives without payment changes.
2. Donor proof and protected tools: impact views, giving/history, wallet, verification, fundraiser edit, messages and invitations; preserve credential/privacy controls.
3. Main account hub, application, profile/settings; unify forms, summaries and danger states.
4. High-traffic discovery/editorial routes: homepage non-hero sections, stories, need pages, how-it-works, FAQ, about/partners; preserve hero/tree and CMS behavior.
5. Legal, blog/detail and preference/error endpoints; align long-form typography and recovery states.
6. Admin modules as one operational token migration, retaining paginated/audited tables; then low-traffic OBS typography only.

Traffic ranking is a proposed product-priority order, not measured analytics. The route assessments below are source-level, not authenticated visual verification.

## Every route — one-line assessment

| Route | Distance from shared system / next work |
|---|---|
| `/` | Editorial design largely aligned; migrate shared type and state primitives without changing hero or tree. |
| `/about` | Editorial composition aligned; normalize titles, labels and spacing. |
| `/how-it-works` | Editorial composition aligned; normalize functional typography and section labels. |
| `/faq` | Editorial FAQ styling partly aligned; standardize labels and interactive states. |
| `/privacy` | Legacy bold-sans legal hierarchy; needs shared title and readable long-form rhythm. |
| `/cookies` | Legacy legal hierarchy; needs shared title and long-form rhythm. |
| `/terms` | Legacy legal hierarchy; needs shared title and long-form rhythm. |
| `/stories` | Editorial listing partly aligned; standardize shared card/state hierarchy. |
| `/help/:need` | Editorial landing partly aligned; unify title, labels and campaign surfaces. |
| `/partners` | Editorial landing partly aligned; unify form surfaces and states. |
| `/story/:id` | Editorial story detail partly aligned; standardize numbers and donor-facing trust surfaces. |
| `/f/:slug` | High-trust campaign page partly aligned; migrate donation, proof and empty states first. |
| `/messages` | Functional messaging UI; needs shared page header, surfaces and accessible states. |
| `/team/accept` | Functional invitation screen; needs shared header and success/error states. |
| `/featured/:storyKey` | Editorial detail partly aligned; review legacy static metrics separately from live campaign totals. |
| `/story-detail/:id` | CMS editorial detail partly aligned; normalize hierarchy without changing CMS behavior. |
| `/overlay/progress/:slug` | Intentionally frameless OBS UI; adapt numeric typography only, retain transparency. |
| `/overlay/alerts/:slug` | Intentionally frameless OBS alerts; adapt typography and reduced motion only. |
| `/overlay/qr/:slug` | Intentionally frameless OBS QR UI; adapt typography only. |
| `/auth` | Legacy account form hierarchy; prioritize shared header, fields and trust/error states. |
| `/reset-password` | Legacy security form hierarchy; prioritize shared header and confirmation states. |
| `/donation-success` | Trust-critical confirmation; normalize number hierarchy, next actions and states. |
| `/donation-cancelled` | Trust-critical recovery screen; normalize hierarchy and retry guidance. |
| `/apply` | Mixed onboarding styling; migrate shared forms, progress and errors without changing approval logic. |
| `/donate` | Trust-critical donation flow; needs consistent numeric hierarchy and shared states. |
| `/my-fundraisers` | Shared system applied this pass; actual authenticated owner browser integration remains unverified. |
| `/my-impact` | Impact-specific styling partly aligned; migrate shared stats and timelines. |
| `/impact/:token` | Guest impact view partly aligned; prioritize receipt, privacy and access-expiry states. |
| `/fundraiser/:id` | Organizer hierarchy aligned and shared primitives adopted; actual signed-in walkthrough remains unverified. |
| `/fundraiser/:id/edit` | Functional owner editor; migrate header, form surfaces and save/error states. |
| `/profile` | Legacy account form; migrate shared header and editable surfaces. |
| `/settings` | Legacy preferences form; migrate shared labels, surfaces and danger states. |
| `/dashboard` | Older sans-heavy hub; substantial header/stat/card migration needed. |
| `/dashboard/donate` | Legacy authenticated giving flow; align donation controls and trust states. |
| `/dashboard/giving` | Legacy giving history; align numeric rows, metadata and loading states. |
| `/dashboard/impact` | Mixed impact dashboard; align stats and receipt/timeline surfaces. |
| `/dashboard/wallet` | Legacy wallet surfaces; prioritize credential-safe states and shared hierarchy. |
| `/dashboard/loyalty-card` | Specialized loyalty view; align functional hierarchy without changing marketing-only Gold Coins rules. |
| `/dashboard/verification` | Legacy verification form; prioritize shared hierarchy and security/error states. |
| `/dashboard/history` | Legacy recipient history; align numeric rows and loading/empty states. |
| `/recipient` | Redirect to `/dashboard`; no independent UI to restyle. |
| `/recipient/coupons` | Redirect to `/dashboard/wallet`; no independent UI to restyle. |
| `/recipient/history` | Redirect to `/dashboard/history`; no independent UI to restyle. |
| `/recipient/loyalty-card` | Redirect to `/dashboard/loyalty-card`; no independent UI to restyle. |
| `/recipient/verification` | Redirect to `/dashboard/verification`; no independent UI to restyle. |
| `/donor` | Redirect to `/dashboard`; no independent UI to restyle. |
| `/donor/donate` | Redirect to `/dashboard/donate`; no independent UI to restyle. |
| `/donor/impact` | Redirect to `/dashboard/impact`; no independent UI to restyle. |
| `/donor/coupons` | Redirect to `/dashboard/wallet`; no independent UI to restyle. |
| `/donor/history` | Redirect to `/dashboard/giving`; no independent UI to restyle. |
| `/admin` | Overview metrics and shell; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/donors` | Donor CRM table; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/partners` | Partner CRM table; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/gold-coins` | Gold Coins ledger; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/tasks` | Task workflow; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/notifications` | Internal notification feed; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/settings` | Operations configuration; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/team` | Role/team management; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/audit` | Audit trail; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/fundraisers/manage` | Redirect to `/admin/fundraisers`; no independent UI to restyle. |
| `/admin/moderation` | Sensitive moderation queue; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/users` | User directory; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/verifications` | Verification queue; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/coupons` | Coupon inventory; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/analytics` | Operational charts; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/content` | CMS controls; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/stories` | Story CMS editor; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/testimonials` | Testimonial CMS editor; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/blog` | Blog CMS editor; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/faq` | FAQ CMS editor; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/fundraisers` | Campaign operations table; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/newsletters` | Newsletter CMS/send controls; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/donations` | Donation operations table; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/admin/procurement` | Procurement inventory; shared CRM shell/table pattern exists, but consumer title/stat tokens are not fully adopted; preserve dense operational controls. |
| `/blog` | Editorial listing partly aligned; normalize title and shared list states. |
| `/blog/:slug` | Editorial article partly aligned; normalize long-form rhythm and functional labels. |
| `/unsubscribe` | Functional preference endpoint; standardize calm confirmation and error states. |
| `*` | Not-found screen; adopt shared empty state and clear recovery link. |
