# Full-site editorial redesign

## Goal and sign-off decision

Rebuild CouponDonation as a premium, human, editorial product using one system across public and signed-in pages, without altering business logic, compliance language, payments, authentication, data access, the application flow, or the 3D tree internals.

**Background change requiring sign-off:**

| | Current | Proposed |
|---|---|---|
| Canvas | `--background: 60 20% 98%` — warm cream/yellow cast | `--background: 120 8% 98.5%` — neutral near-white with a faint green temperature |

Approval of this plan includes approval of that visible background shift.

## Audit inventory

### 1. Warm-color UI usage and migration

**Foundation tokens and global effects**

- `src/index.css:5-9, 34-36, 61-65, 73-75, 99-100, 124-128, 136-138, 154-160, 200-212, 387-400`: gold design-system description, `--accent`, `--gold*`, teal `--emerald-*`, gold/emerald gradients, shine/glow, and gradient text. Decorative. Replace with the logo-green ladder, brand blue, or neutral; delete gold tokens/utilities after callers migrate.
- `tailwind.config.ts:16-20, 66-76, 85-90`: Inter/Cal Sans/About font families, gold/emerald colors, `shadow-gold*`. Foundation. Replace with Instrument families and semantic green/blue/neutral tokens; remove retired mappings.
- `src/components/ui/card.tsx:6`: global hardcoded gold hover border/glow. Decorative and affects every card. Replace with a quiet hairline/neutral interaction.
- `src/components/ui/sidebar.tsx:421`: sidebar accent hover inherits today’s gold `--accent`. Functional hover. Retune `--accent` to brand blue/neutral.
- `index.html:14-17`: stale teal theme color and Google-hosted About fonts. Replace theme color with `#2e7d32`, remove remote font requests, preload only critical self-hosted files.

**Homepage and shared public chrome**

- `Navbar.tsx:148`: gold hover shadow → restrained primary response.
- `WhatWeDo.tsx:17, 52-53, 71, 73-74, 77, 107, 111, 139-140, 150, 236, 247, 408, 450, 471, 473`: gold illustration fills, ambient wash, proof panel, recipient doorway. Decorative except step meaning. Restyle only to blue/green/neutral without changing timing or choreography.
- `TrustTransparency.tsx:46,114`: 3% operations chart segment/legend amber → brand blue; keep the percentage and factual copy unchanged.
- `BrandLeaderboard.tsx:114-116,128,138,142`: badge, trophy, and first-place treatment → blue/neutral ranking treatment.
- `ImpactDashboard.tsx:28-31`: gold statistic icons → blue/neutral.
- `CTASection.tsx:13,48-50,73,85`: gold haze, company panel, CTA, gradient headline → unboxed blue/neutral editorial treatment.
- `TestimonialsSection.tsx:8`: recipient amber role badge → blue/neutral.
- `DonationFlow.tsx:825-832`: amber/yellow rewards callout → blue/neutral; checkout behavior remains untouched.
- `BrandAllocationSliders.tsx:78,134`: incomplete-allocation warning → blue informational or destructive only when invalid.
- `HeroHeadline.tsx:39`: neutral text shadow may be softened; no warm color.
- `TopDonorsPanel.tsx:9,11,45`: amber/orange rank colors and trophy → blue/neutral numeric ranks.
- `AITreeLauncher.tsx:18`: amber attention dot → brand blue.
- `LiveActivityBar.tsx:9-12`: `accent` wash becomes blue through tokens; logo artwork remains untouched.
- Currently unused homepage modules still included in the purge so they cannot reintroduce gold later: `GoldCoinsSection.tsx:8,22,34-36,41,47,52,54-55,60,86,89-90,97`, `PartnerBrands.tsx:34`, `CategoriesSection.tsx:9-10`, `HowItWorksSection.tsx:14`.

**Public/auth/application pages**

- `Auth.tsx:272`, `ResetPassword.tsx:129`, `Blog.tsx:25`, `FAQ.tsx:53`, `HowItWorks.tsx:34`: decorative gold gradient washes → neutral canvas/green tint.
- `HowItWorks.tsx:79-100`: recipient icons, step numbers, CTA → blue secondary path.
- `Stories.tsx:50,302,304,331,333` and `StoryDetail.tsx:42`: emergency category and medal colors → neutral/blue, using labels/icons rather than extra hues.
- `DonationSuccess.tsx:16,84-88`: “Gold Coins” remains existing product copy, but amber presentation becomes blue/neutral. Renaming the reward is not included.
- `MyFundraisers.tsx:93`, `FundraiserDashboard.tsx:234`: “Under Review” yellow → blue informational status.
- `AccountDialog.tsx:65`, `PasswordStrengthIndicator.tsx:27,48`: medium password strength gold/yellow → blue; errors remain red and strong remains green.
- `ShareScreen.tsx:42`, `StoryStep.tsx:280,282-283,298`, `MediaTray.tsx:75`: decorative/progress gold → blue/neutral.
- `ShareModal.tsx:178`: red-orange Events & streaming tile → neutral/blue. Facebook, WhatsApp, Messenger, LinkedIn, X, Google, Visa, Mastercard, Amex, Apple Pay, and Google Pay brand artwork/colors remain excluded as third-party marks.

**Authenticated/admin pages — lighter-touch token and status migration**

- `Dashboard.tsx:154,159-160,174,177,273,311-312`; `MyImpact.tsx:210,213-214`; `DonorImpact.tsx:129,131`; `RecipientLoyaltyCard.tsx:85`; `RecipientVerification.tsx:82`: gold decoration/status → blue or neutral.
- `RecipientCoupons.tsx:146,252-253`; `DonationCouponsModal.tsx:46`; `ImpactDonationModal.tsx:105-107,302`: amber pending/expiry states → blue informational/neutral.
- `AdminDashboard.tsx:26,35,111,114,129,151`; `AdminVerifications.tsx:74`; `AdminStories.tsx:177-178,235,256,283,304`; `AdminDonations.tsx:163,177,219`; `AdminFundraisers.tsx:328-329,367`; `AdminProcurement.tsx:133-134`; `AdminAnalytics.tsx:22,300`: gold/amber/orange categorization, pending, paused, featured, warning, and chart series → semantic blue/neutral; destructive remains red.

**Explicit exclusions — report only, no edits**

- 3D tree sky, sunset, sun/moon, lights, materials, foliage, fireflies, birds, plants, fog and brand-fruit artwork: `Tree3DScene.tsx` and `components/landing/tree3d/**`.
- Third-party logos and their authentic colors: `public/brand-logos/**`, `public/brands/**`, `src/data/brandLogos.ts`, payment/social logos.
- Photographs and fundraiser imagery.
- OBS overlays (`/overlay/*`) remain visually isolated to avoid breaking stream scenes.

### 2. Eyebrows/kickers

Remove marketing kickers with no replacement:

- Home: `HeroHeadline.tsx:42-58` (“CouponDonation is …”); `WhatWeDo.tsx:412` (“How it works”); `SecurityBadges.tsx:30-32` (“Platform Security”); `ImpactStories.tsx:160-162` (“Real Stories, Real Impact”); `TrustTransparency.tsx:195-203` (“100% Transparent”); `BrandLeaderboard.tsx:114-118` (“Live Leaderboard”); `DonationFlow.tsx:324-326` (“Simple 3-Step Process”); `TestimonialsSection.tsx:33-35` (“Community Voices”); `ImpactDashboard.tsx:38-41` (“Community Impact”).
- About: `About.tsx:158-165,174,195,211,251,286,301` (“About / 2025”, “A new standard for giving”, “The premise”, “The transparent trail”, “Our operating standard”, “The founding thesis”, “Our mission”, “Choose your next step”).
- Stories: `Stories.tsx:136-139,279-282` (“Real Stories, Real Impact”, “Donor Leaderboard”).
- If unused sections return: `PartnerBrands.tsx:28-31` (“Trusted Partners”), `GoldCoinsSection.tsx:34-37` (“Reward System”).

Keep functional labels that are not headline kickers: “This week”, receipt labels, field/status labels, founder role, dashboard portal label, password requirements, tabs, categories, and recommended-state labels.

### 3. Boxed/card-grid inventory and editorial replacement

- Homepage: `ImpactStories` fundraiser grid (retain real photo objects, remove ornamental chrome); `TrustTransparency` single enclosing card + icon circles → open chart/list composition; `BrandLeaderboard` retailer cards/chart card → ranked hairline rows plus unframed chart; `DonationFlow` enclosing card remains a focused transaction object but loses decorative shadow/radius; `SecurityBadges` three cards/icon circles → divided assurance row; `TestimonialsSection` four quote cards → editorial quote rail; `ImpactDashboard` four stat cards/icon tiles → oversized numerals divided by rules; `CTASection` two cards → full-width split pathways; `WhatWeDo` proof object may remain receipt-like, but doorway boxes become divided links. Preserve its choreography.
- `/how-it-works`: two three-card grids and icon circles → numbered donor/recipient sequences with alternating editorial rhythm.
- `/faq`: each boxed accordion item → one ruled question list.
- `/blog`: article cards → image-led editorial rows; article detail stays unboxed prose.
- `/stories`: four stat boxes, story-card grid, two leaderboard boxes → divided stat band and editorial lists; `FundraiserCard` stays a real photo object with restrained/no border and smaller radius.
- `/story/:id`, `/f/:slug`, `/featured/:storyKey`, `/story-detail/:id`: title/story/supporter/impact panels currently stack as large rounded cards. Flatten narrative content into an article column; retain the sticky donation panel as a genuine transaction object with hairline border.
- `/auth`, `/reset-password`, `/donation-success`, `/donation-cancelled`, `/unsubscribe`: one task-focused form/result surface may remain, with reduced radius/shadow.
- `/about`: already mostly editorial; remove kicker scaffold, unify type, remove accent rules and boxed final CTA.
- Navbar/Footer/Privacy banner: remove floating/heavy shadow treatment, use hairlines and clear hierarchy; preserve logo wordmark colors.
- Phase 4 dashboards/admin: keep cards where they group operational data, receipts, vouchers, or forms; globally reduce radius/shadows and replace decorative icon circles. Do not restructure dense workflows.

### 4. Route and component inventory

- **Homepage:** `/` → `Index.tsx`: Navbar, HeroSection, LiveActivityBar, WhatWeDo, lazy ImpactStories, TrustTransparency, BrandLeaderboard, DonationFlow, SecurityBadges, TestimonialsSection, ImpactDashboard, CTASection, Footer.
- **Public company/content:** `/about` About; `/how-it-works` HowItWorks; `/faq` FAQ; `/blog` Blog; `/blog/:slug` BlogPost; `/privacy` Privacy; `/cookies` Cookies; `/terms` Terms; `*` NotFound. Shared Navbar/Footer/SEO; FAQ uses Accordion; blog uses CMS hooks.
- **Public giving/stories:** `/donate` Donate → DonationFlow + SecurityBadges; `/stories` Stories → FundraiserFilterBar + FundraiserCard; `/story/:id` StoryDetail → StoryGallery, DonationPanel, UpdatesTimeline, ShareButtons, RelatedStories; `/f/:slug` PublicFundraiser → FundraiserGallery, ShareModal, owner ImageUploadModal; `/featured/:storyKey` FeaturedStoryDetail; `/story-detail/:id` CMSStoryDetail.
- **Account/public entry:** `/auth` Auth; `/reset-password` ResetPassword; `/donation-success`; `/donation-cancelled`; `/unsubscribe`; `/apply` ApplyRecipient behind advisory GeoGuard and composed from ApplyLayout, four step components, AccountDialog, OTP, success/share states.
- **Account management:** `/profile`, `/settings`, `/my-fundraisers` (advisory GeoGuard), `/my-impact`, `/fundraiser/:id` (advisory GeoGuard).
- **Unified dashboard:** `/dashboard`, `/dashboard/donate`, `/dashboard/giving`, `/dashboard/impact`, `/dashboard/wallet`, `/dashboard/loyalty-card`, `/dashboard/verification`, `/dashboard/history`; all use DashboardLayout and role guards, with GeoGuard on receiving routes.
- **Admin:** `/admin`, `/admin/users`, `/admin/verifications`, `/admin/coupons`, `/admin/analytics`, `/admin/content`, `/admin/stories`, `/admin/testimonials`, `/admin/blog`, `/admin/faq`, `/admin/fundraisers`, `/admin/newsletters`, `/admin/donations`, `/admin/procurement`; DashboardLayout + strict GeoGuard + admin role guard.
- **No redesign:** `/overlay/progress/:slug`, `/overlay/alerts/:slug`, `/overlay/qr/:slug`; 10 `/recipient/*` and `/donor/*` legacy redirects contain no UI.

### 5. Font inventory

- `tailwind.config.ts:17`: Inter is the implicit site-wide sans but is not actually loaded, so it falls back to system UI.
- `tailwind.config.ts:18`: Cal Sans is declared as `font-display` but unused and not loaded.
- `tailwind.config.ts:19-20` + `About.tsx:113-313`: Libre Baskerville and IBM Plex Sans are About-only.
- `index.html:15-17`: Google-hosted IBM Plex Sans and Libre Baskerville.
- `font-mono` is correctly functional for coupon codes, IDs, card numbers, technical errors, and HTML editing; retain it.
- Arial inside payment/logo SVG artwork is third-party/graphic content; retain it.

## Proposed headline review table

Only headings change; body, legal, fee, percentage, disclosure, and compliance copy remain untouched.

| Current | Proposed |
|---|---|
| Giving should never be a black box. | See where every donation goes. |
| From generosity to usable value—with a record at every step. | A donation becomes a coupon, with a record at every step. |
| Technology built around accountability. | Every donation leaves a record. |
| Make trust visible. | We built the trail donors were missing. |
| Build the most transparent way to give. | Let donors see what their money became. |
| Be part of a more accountable way to give. | Donate, or ask for support. |
| Make an Impact in Seconds | Choose where your donation can be used. |
| Meet the Families You're Helping | See who your donation supports. |
| Hear From Our Community | What donors and families say. |
| See the Real Impact | The numbers, as they stand today. |
| Discover Fundraisers & Success Stories | Browse fundraisers. |
| Your Security Matters | Your payment is protected. |
| World-Leading Brands | Brands people already use. |

Any data-driven story title, CMS headline, legal heading, and operational/dashboard heading remains unchanged. The execution report will repeat the final exhaustive before/after table after implementation.

## Phased execution

### Phase 1 — foundation

1. Add self-hosted `@fontsource/instrument-serif` and `@fontsource-variable/instrument-sans`; import the packaged CSS locally, remove Google Font links, preload only the above-fold Sans and Serif WOFF2 files, and add metric-matched fallback faces with `size-adjust`, ascent/descent and line-gap overrides.
2. Set `--primary: 123 46% 34%`, create the 97/93/85/45/28/20 lightness ladder, set both accent and `--verify` to `212 80% 42%`, adopt the approved neutral-green canvas, and retune foreground/muted/border/sidebar/dark-mode roles. Remove gold/teal tokens only after zero-usage search passes.
3. Restyle Button, Card, Badge, Input/Textarea/Select, Dialog/Alert/Toast, Tabs, Progress, Switch and related focus states: smaller radius, hairlines, minimal shadows, no automatic gold hover.
4. Add shared Motion primitives for once-only masked headline lines, paragraph rise, image clip reveal, and count-up. Use `motion/react`, transform/opacity (clip-path only for image reveal), and a static/minimal end state for reduced motion.
5. Restyle Navbar, Footer and privacy banner; keep the wordmark exactly `#2e7d32` / `#1565c0`. Append the approved Design System rules to `AGENTS.md`.
6. Verify 390px and 1440px screenshots, keyboard/focus states, contrast, no overflow, font requests, CLS/LCP signals, and zero warm UI classes before Phase 2.

### Phase 2 — homepage, in current page order

1. Hero overlay only: remove kicker, apply editorial type/reveal to copy and controls. Do not touch HeroSection layering, WebGL capability gate, tree internals, camera, canvas, gradient-first paint, or canvas fade.
2. LiveActivityBar: remove warm wash and boxy logo containers while preserving authentic brand artwork and marquee behavior.
3. WhatWeDo: token/font/spacing restyle only; preserve its current animation choreography, in-view mobile behavior, native scrolling, and interaction timing.
4. ImpactStories: new plain headline, reveal system, restrained real-object fundraiser cards.
5. TrustTransparency: unbox into chart + divided list, retain exact percentages and disclosure copy, count numbers once.
6. BrandLeaderboard: replace cards/pill rank language with editorial ranking rows and unframed chart; keep database queries unchanged.
7. DonationFlow: remove kicker and excessive chrome while preserving every state, validation, Square/Stripe choice, same-tab redirect, and checkout code.
8. SecurityBadges, Testimonials, ImpactDashboard, CTASection: convert grids to divided assurances, quote rail, oversized-number band, and split pathways; remove all kickers and generic headings.
9. Verify 390px/1440px screenshots, one-time reveals, reduced motion, lazy-mount boundaries, hero first paint, WhatWeDo behavior, and donation flow without submitting payment.

### Phase 3 — all other public pages

1. Redesign About, How It Works, FAQ, Blog/BlogPost, Stories, three story/fundraiser detail families, Donate, Auth/Reset, Apply presentation, Profile/Settings/My Fundraisers/My Impact/Fundraiser management, payment-result pages, unsubscribe and 404.
2. Use editorial bands, ruled lists, full-width image moments and restrained task surfaces. Keep fundraiser/photo cards and payment/form objects where semantically real.
3. Legal pages receive typography, spacing, link, and motion treatment only; no legal text edits. Apply/auth/payment/data logic is untouched.
4. Verify every route at 390px and 1440px, including empty/loading/error states and representative populated story/fundraiser states.

### Phase 4 — authenticated dashboards and admin

1. Let tokens and fonts cascade through DashboardLayout and all donor, recipient and admin routes.
2. Remove residual warm status colors; use blue for informational/pending/verification, neutral for paused/unattributed, green for success, red for destructive.
3. Reduce decorative card chrome and icon circles, but preserve dense tables, forms, dialogs, vouchers, receipts, charts, navigation, permissions and all queries.
4. Verify signed-in donor/recipient and admin flows at 390px/1440px, including loading, empty, populated, dialog and error states.

## Risks and controls

- **Font/LCP/CLS:** font preloads can compete with the preloaded tree model. Limit preload to two critical WOFF2 resources, use variable Sans, metric fallbacks and `font-display: swap`; compare network waterfall and layout shift before/after.
- **Global accent blast radius:** `--accent` currently powers both gold decoration and Radix hover states. Migrate primitives and explicit classes together, then search for zero remaining gold/yellow/amber/orange UI usages before deleting tokens.
- **Accessibility vs existing motion behavior:** `useMotionPreference` currently means “gentle, never frozen,” while the new requirement asks all motion to respect reduced motion. General reveals will render in their final state with minimal/no travel; WhatWeDo remains protected and will be regression-tested rather than rewritten.
- **Motion performance:** masked line wrappers and image clipping can affect layout/paint. Animate only transform/opacity, use clip-path only for images, avoid global observers, and keep once-only observers disconnected after entry.
- **Compliance/content risk:** no body, legal, security, fee, percentage, recipient, payment or disclosure language changes. The proposed headline list is the complete editorial copy scope; dynamic/CMS titles stay untouched.
- **Business-language conflict:** “Gold Coins” is an existing reward name in functional copy. This plan removes its yellow/gold styling but does not rename the product because the request limits copy edits to headings/eyebrows.
- **Protected systems:** no 3D internals, tree rules, payment flow, checkout logic, auth, application logic, Supabase query, RLS, data, or OBS overlay changes.
- **Third-party color exception:** authentic partner/payment/social marks may contain yellow/orange/red. Surrounding CouponDonation UI will use only green, blue and neutrals.
- **Public data issue outside redesign scope:** Stories/featured modules contain mock or hardcoded figures/supporters, and PartnerBrands contains unsupported contribution figures. They will not be rewritten during this visual pass; they should be handled by a separate factual-content audit.
- **Verification dependency:** reliable WebGL rendering has been intermittent in the sandbox. The non-3D page will still be screenshot-tested at both sizes; no claim about tree appearance will be made without a rendered canvas.
