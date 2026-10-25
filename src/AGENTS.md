# Frontend architecture

## Search (SEO)
- Every public page renders `<SEO>` (title under ~60 characters before " | CouponDonation", description under 155, canonical without query string); private, utility, example and empty pages pass `noindex` (account routes are wrapped in `Private` in App.tsx). Helpers live in src/lib/seo.ts.
- index.html holds true defaults marked `data-rh` so Helmet replaces them; it never carries a canonical or og:url, because one file serves every route.
- Lovable pre-renders pages for verified crawlers (search engines, AI crawlers, social previews) at request time, and content that loads late can be missed: landing pages keep answers in the HTML (no closed accordions; the FAQ page uses forceMount) and lists load in one small query.
- Landing pages: /help/:need (src/data/needs.ts), the ways to give (src/data/givePages.ts) and /gofundme-alternative (sourced; recheck GoFundMe's facts before editing). Add one only with real, specific content: no city, store or keyword pages generated in bulk (Google's scaled-content policy). New pages go in public/sitemap.xml, the footer and public/llms.txt.
- public/robots.txt keeps one `User-agent: *` group (a bot named in its own group ignores the Disallow lines). Open, real fundraisers and blog posts are listed by the `sitemap` edge function named in robots.txt (plain-text format, because Supabase serves function responses as text/plain); new or edited fundraisers ping IndexNow through the `indexnow` function, whose key file public/88cc93917332877d9126bf9574635250.txt must never be removed.
- The share image is public/og-image.png (1200×630, with the logo).

