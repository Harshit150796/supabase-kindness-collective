## Problem

Fetching `https://coupondonation.com` from a client without full WebGL support (link‑preview bots, older browsers, some in‑app webviews, low‑end Android) returns the app‑wide **"Something went wrong / Reload Page"** screen instead of the site. I reproduced this by fetching the live domain — the top‑level `ErrorBoundary` in `src/App.tsx` is catching a throw from the lazy `Tree3DScene` (Three.js / `@react-three/fiber`) and replacing the entire page with its fallback.

Playwright with software WebGL still renders the tree, so it only breaks for a subset of real users — but for those users **every** route (not just `/`) is dead, because the outer boundary wraps the whole `BrowserRouter`.

Secondary observation: the current preview URL is `/index`, which is not a defined route and correctly returns the 404 page. That's expected behaviour, not a bug — just noting so it isn't confused with the loading issue.

## Fix

Contain 3D failures to the hero and degrade gracefully to the gradient background that already exists as the pre‑mount fallback.

1. **Local error boundary around `Tree3DScene`** in `src/components/landing/HeroSection.tsx`
   - Wrap the lazy `<Tree3DScene />` in a small `<Tree3DErrorBoundary>` whose fallback is `null` (the `<GradientFallback />` layer underneath keeps painting).
   - Log the caught error to console so we still see it in production diagnostics, but don't rethrow.

2. **WebGL capability gate before mounting**
   - Before flipping `treeReady` to `true`, run a one‑time check: create a throwaway `<canvas>` and attempt `getContext('webgl2') || getContext('webgl')`. If both return `null`, keep `treeReady` at `false` permanently for this session.
   - Also skip mounting when `navigator.userAgent` matches known headless/crawler patterns (`Googlebot`, `bingbot`, `facebookexternalhit`, `Twitterbot`, `LinkedInBot`, `Slackbot`, `WhatsApp`, `Discordbot`, `HeadlessChrome`) — they don't need the 3D scene and often can't run it.

3. **Reduce blast radius of the top‑level boundary**
   - Keep the existing outer `ErrorBoundary` (safety net), but ensure the hero‑scoped boundary catches first so the rest of the page renders. No API changes to `ErrorBoundary`.

4. **Verify on the live domain after publish**
   - Re‑run `fetch_website` on `https://coupondonation.com` and confirm the homepage renders with the gradient hero (no "Something went wrong").
   - Load `/`, `/about`, `/donate`, `/stories`, `/f/:slug` in a WebGL‑disabled Playwright context and confirm each renders normally.

## Files touched

- `src/components/landing/HeroSection.tsx` — add capability check + local error boundary wrapper
- `src/components/landing/Tree3DErrorBoundary.tsx` *(new)* — tiny class component, fallback = `null`

## Out of scope

- Rewriting the 3D scene, changing Three.js versions, or removing the hero.
- Tremendous / donation‑cycle work from earlier plans (unchanged, still awaiting your account).
- The `/index` URL — that's not a real route; visit `/` instead.
