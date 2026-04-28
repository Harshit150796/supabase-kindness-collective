
# Production-grade SEO Optimization

The base SEO infrastructure (`SEO` component, `HelmetProvider`, Organization/WebSite/SiteNavigation JSON-LD, sitemap, robots) is already in place. This plan closes the gaps: public pages still missing SEO tags, dynamic content pages with no metadata, weak schema coverage, and a static sitemap that doesn't include fundraisers, blog posts, or CMS stories.

---

## 1. Add SEO to remaining public pages (static metadata)

Pages that render publicly but currently have no `<SEO>` block will get unique titles, descriptions, canonical URLs, OG/Twitter tags, and breadcrumb JSON-LD:

- `/auth` — title "Sign In or Create Account", `noindex` (auth pages shouldn't rank)
- `/reset-password` — `noindex`
- `/donation-success`, `/donation-cancelled` — `noindex`
- `/apply` (ApplyRecipient) — public, indexable, full SEO
- `/unsubscribe` — `noindex`
- `/404` (NotFound) — `noindex` + proper title

## 2. Dynamic SEO for content-driven pages

These pages render different content per URL and need metadata derived from the loaded record:

- **`/blog/:slug` (BlogPost)** — title from post title, description from excerpt, OG image from `cover_image_url`, `Article` JSON-LD with `datePublished`, `author`, `image`.
- **`/f/:slug` (PublicFundraiser)** — title from fundraiser title, description from story summary, OG image from first gallery image, `DonateAction` / `Project` schema with goal and raised amount.
- **`/featured/:storyKey` (FeaturedStoryDetail)** — title and description from local featured story data, OG image from story image.
- **`/story-detail/:id` (CMSStoryDetail)** — title and description from CMS record.
- **`/story/:id` (StoryDetail)** — title and description from impact story.
- **`/fundraiser/:id` (dashboard)** — `noindex` (owner-only view).

Each gets a `BreadcrumbList` and content-appropriate schema (`Article` for blog, `DonateAction` for fundraisers).

## 3. Strengthen homepage and key page schemas

- Add `FAQPage` JSON-LD on `/faq` (pulled from CMS FAQ entries) — eligible for rich results.
- Add `AboutPage` schema on `/about` referencing the Organization.
- Add `BreadcrumbList` to `/` (Home only) and ensure `WebSite` schema is the only site-level entry there.
- Add `Article` schema generator helper inside `SEO.tsx` (alongside the existing `breadcrumbJsonLd`) for reuse on blog/story pages.

## 4. Dynamic sitemap

The current `public/sitemap.xml` is static and missing all dynamic URLs. Replace with a generated sitemap so search engines can discover fundraisers, blog posts, and CMS stories:

- Create a Supabase edge function `generate-sitemap` that queries published `fundraisers`, `cms_blog_posts`, and `cms_stories` and returns `application/xml`.
- Add a Vercel rewrite in `vercel.json` so `/sitemap.xml` proxies to the edge function (keeps the canonical URL `coupondonation.com/sitemap.xml`).
- Include `lastmod` from each record's `updated_at`, sensible `changefreq`/`priority`, and keep all the static routes too.
- Keep `public/sitemap.xml` as a fallback in case the function is down.

## 5. Robots.txt hardening

Audit and update `public/robots.txt`:
- Confirm blocks: `/donor/`, `/recipient/`, `/admin/`, `/profile`, `/settings`, `/auth`, `/reset-password`, `/donation-success`, `/donation-cancelled`, `/unsubscribe`, `/fundraiser/` (dashboard), `/overlay/`.
- Explicit `Allow:` for `/blog/`, `/f/`, `/featured/`, `/story-detail/`, `/stories`, `/about`, `/how-it-works`, `/faq`, `/donate`, `/apply`.
- Add `Crawl-delay` for non-priority bots, keep Googlebot/Bingbot uncapped.

## 6. Search Console readiness

- Add a `<meta name="google-site-verification">` slot in `index.html` (empty placeholder commented with where to paste the verification token).
- Ensure `og-image.png` exists at 1200×630 (it does — confirmed in `/public`).
- Add `manifest.json` short_name/theme_color audit (already present).
- Document in README a 5-step "Submit to Google" checklist (verify domain, submit sitemap, request indexing for top routes, monitor Coverage report, set canonical domain).

## 7. Per-page indexing controls

The `SEO` component already supports `noindex`. Apply it consistently:
- Indexable: `/`, `/about`, `/how-it-works`, `/faq`, `/stories`, `/donate`, `/apply`, `/blog`, `/blog/:slug`, `/f/:slug`, `/featured/:storyKey`, `/story-detail/:id`, `/privacy`, `/terms`.
- `noindex, nofollow`: all auth/account/dashboard/admin/overlay/transactional routes.

---

## Technical notes

- Reuse the existing `SEO` component and `breadcrumbJsonLd` helper. Add an `articleJsonLd` helper for blog/story posts.
- Dynamic pages call `SEO` only after their data is loaded (or pass safe defaults during loading) to avoid blank titles in the rendered HTML.
- The sitemap edge function is read-only and public; no auth required. Cache it for 1 hour via `Cache-Control` header.
- No new dependencies required — `react-helmet-async` is already installed.

## Files touched

- **Edit**: `src/components/SEO.tsx` (add `articleJsonLd`, `faqJsonLd` helpers)
- **Edit (add SEO blocks)**: `Auth.tsx`, `ResetPassword.tsx`, `DonationSuccess.tsx`, `DonationCancelled.tsx`, `ApplyRecipient.tsx`, `Unsubscribe.tsx`, `NotFound.tsx`, `BlogPost.tsx`, `PublicFundraiser.tsx`, `FeaturedStoryDetail.tsx`, `CMSStoryDetail.tsx`, `StoryDetail.tsx`, `FundraiserDashboard.tsx`, `FAQ.tsx` (add FAQPage schema), `About.tsx` (add AboutPage schema)
- **Edit**: `index.html` (add Google verification placeholder)
- **Edit**: `public/robots.txt` (hardening)
- **Edit**: `vercel.json` (sitemap rewrite)
- **Edit**: `README.md` (Search Console checklist)
- **Create**: `supabase/functions/generate-sitemap/index.ts`
