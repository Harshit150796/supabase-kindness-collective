## Problem

The landing page renders completely blank. Vite returns 504 for `ai`, `@ai-sdk/react`, `streamdown`, `use-stick-to-bottom`, and `motion/react`. Root cause: `AITreeChat.tsx` imports `useChat` from `@ai-sdk/react`, which is not in `package.json`. The missing package breaks Vite's dep optimization for the whole AI-SDK graph, so `HeroSection` (which eagerly imports `AITreeChat`) fails to load and React renders nothing.

## Fix

1. Install the missing package:
   - `bun add @ai-sdk/react@^2`
2. Restart the dev server so Vite re-runs dep optimization with the now-complete graph.
3. Verify the page renders by reloading `/` and confirming the tree scene, headline, top-donors panel, and "Talk to Coupon" launcher are all visible.
4. Click the launcher, send one message ("Show me active campaigns"), confirm the stream returns and the `searchFundraisers` tool result renders.

No other code changes are required — `HeroHeadline`, `TopDonorsPanel`, `AITreeChat`, `AITreeLauncher`, and the `coupon-chat` edge function are already wired correctly.
