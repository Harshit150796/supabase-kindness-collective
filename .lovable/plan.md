## Goal

Bring the landing page back to "extremely fast" on first load on every device, and make mobile feel light and snappy — without losing the brand visuals (tree, falling coupons, donor names).

## Root causes (verified in the code)

1. **No route-level code splitting.** `src/App.tsx` eagerly imports ~50 page components (Admin*, Donor*, Recipient*, Blog, Stories, overlays, DonationFlow, etc.). The home route ships them all in the initial JS bundle.
2. **3D hero is heavy and always runs.**
  - `Tree3DScene` runs `frameloop="always"` whenever in view, with DPR locked up to 2, PCFSoft 4096×4096 shadow maps, and a forest HDRI Environment.
  - On mobile it still spawns 2800 instanced leaves, fireflies, squirrel, bird, plants layer, trunk ripple, hit zones, 16 `CouponFruit` instances.
  - Each `CouponFruit` uses Drei `<Html transform>` to render a 920×600 DOM coupon face inside the Canvas — 16 React+iframe transforms compositing every frame. The landed label additionally uses `backdrop-filter: blur(8px)` over an animated scene (known perf killer).
  - 1.5 MB `tree.glb` is loaded before the page is interactive.
3. **Oversized public assets.** `og-image.png` 809 KB, `favicon-512.png` 938 KB, `favicon-192.png` 677 KB, `favicon.png` 222 KB — all referenced from `index.html`/manifest on first paint.
4. **Heavy below-the-fold sections load eagerly.** `DonationFlow` (894 lines), `BrandLeaderboard`, `ImpactStories`, `TrustTransparency` etc. all import on first render even though they're far below the fold.
5. **Mobile UX issues.** Hero is `60vh` but full Canvas + scroll-jacking wheel/touch handlers compete with native scrolling, making the page feel sluggish on phones.

## Plan

### 1. Route-level code splitting (biggest single win)

- Convert every non-home route in `src/App.tsx` to `React.lazy(...)` + a single top-level `<Suspense fallback={…}>`.
- Keep `Index` eager so the landing page itself is not gated by Suspense.
- Expected impact: initial JS bundle drops by an order of magnitude.

### 2. Defer below-the-fold landing sections

- In `src/pages/Index.tsx`, lazy-load everything below `HeroSection` + `LiveActivityBar`:
`ImpactStories`, `TrustTransparency`, `BrandLeaderboard`, `DonationFlow`, `SecurityBadges`, `TestimonialsSection`, `ImpactDashboard`, `CTASection`.
- Wrap each in `<Suspense fallback={<div className="h-[400px]" />}>` so layout is reserved (no CLS).
- Optional: mount each via an `IntersectionObserver` wrapper so chunks load only as the user scrolls.



### 5. HTML/meta hygiene in `index.html`

- Add `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` if missing.
- Add `<link rel="preconnect">` for Supabase + Stripe (already used early).
- Move any tracking pixels' `<noscript>` out of `<head>` (rule already in our directives).

### 6. Verification

- Build the project (Vite auto-runs) and inspect chunk sizes in the output.
- Use `browser--performance_profile` on `/` at mobile viewport (390×844) to confirm: TTFB/LCP, long tasks count, JS heap < 60 MB.
- Manually scroll the page in the preview to confirm sections appear smoothly and 3D hero (desktop) still drops coupons with donor names.

## Technical details

- Files to edit:
  - `src/App.tsx` — convert non-home routes to `lazy`.
  - `src/pages/Index.tsx` — lazy + Suspense + IO wrapper for below-fold sections.
  - `src/components/landing/HeroSection.tsx` — branch on `isMobile`/`prefers-reduced-motion` to a static hero.
  - `src/components/landing/Tree3DScene.tsx` — lower shadows, drop Environment, mobile bail-out, kill scroll-jack on mobile, idle-mount Canvas, visibility-pause.
  - `src/components/landing/tree3d/CouponFruit.tsx` — remove `<Html transform>` overlay, remove `backdrop-filter`, cap concurrency where applicable.
  - `src/components/landing/Tree3DScene.tsx` Scene — gate `Fireflies`/`Bird`/`Squirrel`/`TrunkRipple`/`HitZones`/`PlantsLayer` by `isMobile`.
  - `index.html` — preconnect + LCP preload + viewport.
  - `public/og-image.png`, `public/favicon*.png`, `public/models/tree.glb` — re-encode/compress via a one-off script.
- No backend or schema changes. No business-logic changes. Donor-name behavior, plant growth, falling animation, brand allocation logic stay intact.

## Out of scope (won't touch)

- Donation / Stripe / auth flows.
- Database schema or RLS.
- Visual identity (palette, logo, typography).
- Donor-name resolution and plant growth logic added in prior turns.