# Landing-page Performance & Polish Pass #3

## Measured problems (mobile, 390×844, dpr=3.75)

From a live `performance_profile` + screenshot just now:

| Metric | Current | Target |
|---|---|---|
| First Contentful Paint | **7.17 s** | < 2.0 s |
| DOMContentLoaded | **6.95 s** | < 3.0 s |
| Cumulative Layout Shift | **0.40 (poor)** | < 0.1 |
| Total JS shipped on landing | **3.89 MB** across 196 files | < 1.5 MB |
| Event listeners | 2 486 | < 1 000 |
| Largest single image | `favicon-192.png` **676 KB** | < 20 KB |
| Logo | `src/assets/logo.png` **222 KB** | < 30 KB |
| Tree model | `/models/tree.glb` **1.46 MB** | acceptable, but defer |
| Brand logos | Google favicon endpoint, 1.5–1.8 s each, blocks paint | self-host, < 50 ms |

Visible regressions on the screenshot:
- The **Privacy banner** covers the hero CTAs and the bottom third of the tree on a 390 px screen — users can't reach "Donate now" until they dismiss it.
- The single shifting element responsible for CLS 0.40 is the hero `div` swapping from gradient fallback to the 3D canvas (the canvas has no reserved aspect during the fade-in, the parent is sized via `h-[62svh]` but the inner wrapper re-layouts).

## Plan — 5 small, independent fixes

### Fix 1 — Eliminate CLS 0.40 on hero swap
File: `src/components/landing/HeroSection.tsx`
- The fallback `<GradientFallback />` and the `<Suspense>` wrapper currently render as siblings under a conditional. Replace the conditional with a single absolutely-positioned stack: gradient is always rendered, the canvas wrapper sits on top with `opacity` transition. No DOM swap → no shift.
- Add `style={{ contain: 'layout paint' }}` to the hero section so child paints can't shift siblings.

### Fix 2 — Hide privacy banner content overlap on small screens
File: `src/components/PrivacyConsentBanner.tsx` (read first)
- On `<sm` make the banner a compact bottom bar (single line + "Okay" + "More") instead of the tall card that covers the hero. Tall card stays for `md+`.
- Add `pb-[env(safe-area-inset-bottom)]`.

### Fix 3 — Right-size the two heavyweight images
- `public/favicon-192.png` — re-export at 192×192 PNG-8 (target ≤ 15 KB). It's currently a 676 KB PNG that the browser fetches as the apple-touch icon on every mobile visit.
- `src/assets/logo.png` — re-export at 2× display size as WebP and update the import. Target ≤ 25 KB.
- Add `<link rel="preload" as="image" href="/src/assets/logo.png" fetchpriority="high">` in `index.html` for LCP.

(These are static-file replacements + one `<link>` edit — no logic changes.)

### Fix 4 — Self-host brand logos instead of Google favicon service
File: `src/data/brandLogos.ts` + usage in `LiveActivityBar.tsx`, `BrandLeaderboard.tsx`, `PartnerBrands.tsx`
- Today every brand logo hits `https://www.google.com/s2/favicons?...&sz=128`. Each one is 1.5–1.8 s, blocks the marquee, and leaks the user's IP to Google.
- Download the ~10 brand favicons once into `public/brands/*.png` (16 KB each), point `brandLogos.ts` at the local paths. Marquee paints instantly and works offline / on flaky networks.

### Fix 5 — Shrink the JS waterfall
- `index.html`: add `<link rel="modulepreload">` for the main entry chunk only; remove any other ad-hoc preloads.
- `vite.config.ts`: add a `manualChunks` split so `three`, `@react-three/fiber`, `@react-three/drei` land in **one** chunk (currently they're split into `chunk-Z24DV3IB.js` 229 KB + `chunk-TAFHJI2K.js` 139 KB + `@react-three_drei.js` 775 KB which fetch sequentially behind the Vite dep optimizer in dev — in prod they're a single waterfall). Also chunk `recharts` separately so admin pages don't drag it into the landing bundle.
- Confirm `Tree3DScene` import in `HeroSection` stays lazy (it already is) — the `manualChunks` only affects how the chunk is split, not when it loads.

## Out of scope
- No copy, auth, RLS, routing, business-logic, or new dependencies.
- Desktop hero visuals must remain identical.
- No changes to the 3D scene itself beyond what fix #1 requires.

## Verification
1. Re-run `performance_profile` at 390×844. Expect CLS < 0.1, FCP < 3 s.
2. Visual diff at 1440×900 — hero, marquee, leaderboard pixel-identical.
3. DevTools Network — confirm 0 requests to `google.com/s2/favicons`, `favicon-192.png` < 20 KB, `logo.*` < 30 KB.
4. Screenshot at 390×844 — Privacy banner no longer covers the "Donate now" button.

## Technical notes (for the implementer)
- For CLS, the fix is structural — don't try to animate `height`. Stack gradient + canvas in the same absolutely-positioned layer.
- For favicon-192, use `pngquant --quality 60-80` or re-export from the source SVG at 192×192.
- For brand logos, fetch once with `curl -o public/brands/walmart.png https://www.google.com/s2/favicons?domain=walmart.com&sz=128` for each brand during implementation.
- The Vite `manualChunks` block goes inside `build.rollupOptions.output` and should look like `{ three: ['three','@react-three/fiber','@react-three/drei'], charts: ['recharts'] }`.
