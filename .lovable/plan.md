## Problem

The three components (HeroHeadline, TopDonorsPanel, AITreeChat + coupon-chat) are already implemented and wired into `HeroSection.tsx`. The page renders blank because Vite is still serving 504s for `@ai-sdk/react`, `ai`, `streamdown`, `use-stick-to-bottom`, and `motion/react` from its stale optimized-deps cache. `@ai-sdk/react` was added to `package.json` in the last loop, but the running dev server never re-ran dep optimization, so the prior 504 entries are still being served.

## Fix

1. Restart the Vite dev server so it re-scans deps with the now-complete `@ai-sdk/react` graph and rebuilds `.vite/deps`.
2. Reload `/` and confirm the hero renders with:
   - Headline + rotating word + Donate/How-it-works CTA (top center)
   - Top Donors glass card (top right)
   - "Talk to Coupon" leaf launcher (bottom right)
3. Click the launcher, send "Show me active campaigns", confirm the stream returns and `searchFundraisers` results render.
4. If any 504 persists after restart, clear `node_modules/.vite` and restart once more.

No code changes are required — all three features are already built.
