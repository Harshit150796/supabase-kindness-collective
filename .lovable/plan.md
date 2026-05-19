# Mobile Performance Plan — Landing Page

Goal: Make `/` load fast and run smooth on mobile **without changing any visuals** of the 3D tree or the rest of the page. The tree, plants, fireflies, bird, squirrel, sky, ground, day/night, coupons — all stay exactly as they are visually. We only touch *when* and *how* things load, and tune mobile-only quality knobs that the user cannot perceive.

---

## 1. Defer everything below the hero until it's needed

Currently `src/pages/Index.tsx` imports every section synchronously (LiveActivityBar, ImpactStories, TrustTransparency, BrandLeaderboard, DonationFlow — 894 lines, SecurityBadges, TestimonialsSection, ImpactDashboard, CTASection, Footer). On mobile this all parses before the user sees anything.

- Convert all below-the-fold sections to `React.lazy` with a `Suspense` skeleton matching their current height (prevents layout shift).
- Keep `Navbar` + `HeroSection` eager so the first paint is unchanged.
- Wrap each lazy section in an `IntersectionObserver`-based "render when near viewport" wrapper (200px rootMargin) so we don't even fetch the chunks until the user scrolls toward them.

Net effect: initial JS for `/` drops dramatically; nothing visual changes.

## 2. Code-split heavy routes in `src/App.tsx`

All 40+ pages are imported eagerly today, which bloats the initial bundle that mobile users download before the homepage can hydrate.

- Convert every non-homepage route (`About`, `HowItWorks`, all `/admin/*`, all `/donor/*`, all `/recipient/*`, `Blog`, overlays, etc.) to `React.lazy` + a single `Suspense` boundary around `<Routes>`.
- Keep `Index` eager so `/` is instant.

## 3. Defer the 3D scene start on mobile until the canvas is actually visible

`HeroSection` already lazy-loads `Tree3DScene`, but on mobile we should also avoid mounting `<Canvas>` until the hero is in view and the browser is idle — so the first paint is just the gradient sky placeholder (looks identical to the current fallback).

- In `Tree3DScene.tsx`, on mobile only, gate the `<Canvas>` behind: `inView && requestIdleCallback fired (or 250 ms timeout fallback)`.
- The gradient placeholder already exists in `HeroSection`, so visually there's no change — just a ~quarter-second deferral that lets HTML/CSS paint first and React hydrate other things.

## 4. Mobile-only runtime tuning inside Tree3DScene (no visual change)

These are all values the eye cannot distinguish on a 390 px viewport but cost real frame time:

- **DPR cap**: currently locked to `devicePixelRatio` up to 2. On mobile cap at `1.5` (Three.js community standard for mid-range phones). At 390 CSS px this is visually indistinguishable from 2x but ~30 % cheaper per frame.
- **Shadow map**: currently `4096×4096`. On mobile drop to `1024×1024` and reduce `shadow-blurSamples` from 25 → 8. Shadows still look soft at hero scale on a phone.
- **`frameloop`**: already `demand` when off-screen — keep. Additionally pause the loop while `document.visibilityState === 'hidden'` (tab in background).
- **Leaf count**: already `2800` on mobile, keep.
- **Plant cap**: already `20` on mobile, keep.
- **Fireflies / Bird / Squirrel**: keep visuals; just confirm they respect `frameloop="demand"` and use the existing wind ref (no changes needed unless profiling shows otherwise).
- **Environment preset**: `Environment preset="forest"` downloads an HDR. On mobile switch to `background={false}` with the lightweight `apartment` preset OR preload it with `<Environment files=...>` cached — pick whichever measures faster. Either way the visual difference at mobile scale is imperceptible because we already set `background={false}`.

## 5. Asset & network hygiene

- `<link rel="preload" as="image" href="/src/assets/logo.png">` in `index.html` won't match the bundled hashed asset path in production — it's a wasted request. Remove it (or move it inside the React tree where the import URL is known).
- Add `<link rel="preconnect">` for the Supabase project URL and Stripe so first DB / image fetches start sooner.
- Audit `src/data/brandLogos.ts` and any landing images — ensure they're lazy (`loading="lazy" decoding="async"`) and use explicit `width`/`height` to avoid CLS. No visual change.

## 6. Verify, don't guess

After the changes:
- Build and inspect `dist/assets/*.js` sizes — confirm initial chunk shrank.
- Use the browser performance profiler on a throttled mobile viewport (390×844, 4× CPU slowdown) before/after to confirm LCP and TTI improved.
- Visually diff the hero against the current commit at 390 px to confirm zero visual regressions.

---

## Out of scope (explicitly not changing)

- Any geometry, colors, materials, lighting hues, animation timing, or shader of the tree, plants, fireflies, bird, squirrel, sky, or coupons.
- Any copy, layout, spacing, or component structure of landing sections.
- Backend, data fetching logic, or business rules.

## Files that will be touched

- `src/pages/Index.tsx` — lazy + intersection-observer wrappers for below-fold sections.
- `src/App.tsx` — route-level code splitting.
- `src/components/landing/HeroSection.tsx` — small mobile-gating addition.
- `src/components/landing/Tree3DScene.tsx` — DPR cap, shadow map size, visibility pause, environment tweak (mobile branch only).
- `index.html` — remove stale preload, add preconnects.
- Possibly one new tiny helper `src/components/LazyOnView.tsx` for the intersection-observer wrapper.

No new dependencies required.
