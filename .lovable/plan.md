## Goal
Improve Google CTR and rich-result eligibility, plus verify the www → apex redirect.

## 1. Rewrite homepage meta (`index.html`)

Stronger, benefit-led, keyword-front, under length limits.

- **Title** (58 chars): `CouponDonation — Turn Donations Into Grocery Coupons`
- **Meta description** (152 chars): `Your donation becomes real grocery coupons for verified families. 95% efficiency, Walmart/Target/Amazon partners. Donate in seconds, see your impact.`
- Mirror to `og:title`, `og:description`, `twitter:title`, `twitter:description` (twitter desc kept tight).

## 2. Per-page meta tightening

For each page, update the `<SEO>` title/description used by `react-helmet-async` so each sitelink has a unique, CTR-friendly snippet:

- `/how-it-works` — "How CouponDonation Works — Donate, Verify, Redeem"
- `/donate` — "Donate Now — Turn Your Gift Into Grocery Coupons"
- `/faq` — "FAQ — Donations, Verification & Coupon Redemption"
- `/about` — "About CouponDonation — Our Mission to Feed Families"
- `/stories` — "Impact Stories — Real Families Helped by Donors"

Each description ≤155 chars, unique, benefit-led, no ellipsis.

## 3. FAQPage JSON-LD on `/faq`

In `src/pages/FAQ.tsx`, build a `FAQPage` schema from the same `faqs` array already rendered (works for both CMS and hardcoded fallback) and pass it via `SEO`'s `jsonLd` prop alongside the existing BreadcrumbList. Shape:

```
{ "@context":"https://schema.org","@type":"FAQPage",
  "mainEntity":[{"@type":"Question","name":"...","acceptedAnswer":{"@type":"Answer","text":"..."}}, ...] }
```

This makes Q&A expandable in Google results.

## 4. BreadcrumbList coverage on inner pages

`SEO.tsx` already exports `breadcrumbJsonLd`. Audit and add it where missing:

- `src/pages/Privacy.tsx` — add SEO jsonLd breadcrumb (Home → Privacy)
- `src/pages/Terms.tsx` — same
- `src/pages/Stories.tsx`, `src/pages/Blog.tsx`, `src/pages/About.tsx` — verify; add if missing
- Story/blog detail pages (`StoryDetail`, `BlogPost`, `FeaturedStoryDetail`, `CMSStoryDetail`, `PublicFundraiser`) — add a 3-level crumb (Home → Stories/Blog → {title})

## 5. NonprofitOrganization (optional, mention only)

If CouponDonation is a registered 501(c)(3), switch `index.html`'s `Organization` schema `@type` to `NGO` and add `nonprofitStatus: "Nonprofit501c3"`. Flagging this — will ask before changing, since misuse can hurt trust.

## 6. www → apex redirect verification

This is a DNS/host check, not a code change. Plan: after build mode, run `curl -sI https://www.coupondonation.com` and confirm `301`/`308` → `https://coupondonation.com`. If it doesn't redirect:
- On Vercel: add `www.coupondonation.com` in the domain settings, pick `coupondonation.com` as primary — Vercel auto-creates the 308.
- Document the result back to the user; no `vercel.json` change needed (Vercel handles it at the platform layer).

## Files to touch

- `index.html` — title + descriptions
- `src/pages/FAQ.tsx` — FAQPage JSON-LD
- `src/pages/Privacy.tsx`, `src/pages/Terms.tsx`, `src/pages/Donate.tsx`, `src/pages/HowItWorks.tsx`, `src/pages/About.tsx`, `src/pages/Stories.tsx`, `src/pages/Blog.tsx`, `src/pages/StoryDetail.tsx`, `src/pages/BlogPost.tsx`, `src/pages/FeaturedStoryDetail.tsx`, `src/pages/CMSStoryDetail.tsx`, `src/pages/PublicFundraiser.tsx` — tighten copy + breadcrumb JSON-LD where missing

## Out of scope
Visual/UI changes, copy outside `<head>` and H1s, backend logic, the 3D tree.
