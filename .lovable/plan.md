# Reliable fundraiser imagery and homepage campaign showcase

## Goal
Make fundraiser photos reliable everywhere, clean the duplicate image data, prevent future duplicate primaries, and rebuild the homepage fundraiser section around one live-data card shared with `/stories` and related campaigns.

## Part A — One image system
- Add one shared resolver that consistently chooses: primary gallery photo, first photo by `display_order`, legacy cover, then a branded category fallback.
- Use it across homepage, Stories, public campaign gallery/share card, related campaigns, organizer/dashboard views, admin lists, and the Vercel social preview endpoint.
- Harden `ImageReveal`: full-height inner wrapper, visible gentle mode, and an on-screen timeout fallback if intersection observation misses.
- Use cropped card photography with stable aspect ratios and category-based branded fallback artwork.

## Part B — Data and uploads
- Confirm duplicate primary pairs using image dimensions/content comparison; keep the optimized WebP where they are copies, remove only the duplicate database row, retain storage originals, and audit every change.
- Fill only empty `cover_photo_url` values from each fundraiser’s resolved gallery image and audit each row.
- Add an additive uniqueness rule allowing only one primary gallery row per fundraiser, after cleanup.
- Centralize browser image optimization to WebP with a sensible maximum dimension and quality; update organizer and admin uploads to create one row and keep the cover synchronized.
- Check Supabase image transformation availability. Use transformed delivery URLs if supported; otherwise document the available options without deleting originals.
- Update public database reads that expose cover imagery so server and browser resolve the same image.

## Part C — Homepage and shared cards
- Extend the live fundraiser feed with safe organizer/location summaries, completed-donation totals/counts, and latest completed donation time.
- Build one `FundraiserCard` used by homepage, `/stories`, and related campaigns: image/fallback, category, title, shortened organizer, city/state when available, progress, live totals, donation count, recency, Coupon-locked mark, and Donate action.
- Rebuild the homepage section with featured lead plus desktop grid, a complete mobile snap carousel with position dots, category filters, and Newest / Most supported / Close to goal sorting.
- Show all active fundraisers while the set is small; keep a clear link to all fundraisers as it grows.
- Add stable skeleton and designed empty states. Preserve the hero/tree and all payment systems unchanged.

## Part D — Audit only
- Capture signed-out screenshots at 390px and 1440px for every public page and every homepage section.
- Capture homepage fundraiser section, `/stories`, and one campaign at both widths, plus one reduced-motion proof.
- Report prioritized issues covering imagery opportunities, broken/empty states, weak calls to action, inconsistent cards, and performance. Do not implement audit findings.

## Verification and reporting
- Verify database cleanup row by row, public queries, image HTTP responses, and one-primary enforcement.
- Verify the homepage shows every active fundraiser under current data and no photo can remain animation-hidden.
- Check preview build/runtime logs and responsive screenshots; note the published domain remains unchanged until published.
- Tick `roadmap.md` at the end of Parts A, B, C, and D.

## Assumptions
- City/state will come from privacy-safe organizer/public location data already exposed by approved public functions; unavailable fields are omitted.
- “Near you” is omitted unless a state can be derived without requesting precise browser location.
- Existing original storage files remain untouched, including duplicate originals and oversized images.
