# Make "Apply as a Recipient" open fast

## What causes the wait
- The application page is only downloaded after the button is clicked, so every first visit waits for its download before anything appears.
- While it downloads, people see a plain "Loading..." screen.
- That download includes parts most people don't need yet: the photo cropper, the sign-up popup, the code-entry screen, and the success/share screens.
- On the homepage, the 3D tree keeps the phone busy, which slows that download further.

## Changes
1. **Start loading early.** The page begins downloading quietly once the homepage settles, and right away when someone hovers or touches "Apply as Recipient" (also from the menu and "Start a fundraiser" links). By the click, it is usually ready.
2. **Smaller first download.** The photo cropper, sign-up popup, code-entry screen and success/share screens load only when needed (step 2 or later), and also preload quietly in the background once step 1 shows.
3. **No blank "Loading..." screen.** If the page isn't ready yet, show a lightweight outline of the application (logo, step "1 of 4", headline area) in the same colors, so it feels instant.
4. **Step 1 shows immediately.** Step 1 no longer waits for the sign-in check; the saved draft fills in once that check finishes, so nothing typed is lost.
5. **Measure.** Time from click to step 1 before and after, on desktop and a slowed phone profile, and record the results.

Nothing changes in the steps, wording, tree, animations or cookie bar.

## Technical details
- `src/App.tsx`: export the `ApplyRecipient` loader; route-specific skeleton fallback for `/apply` instead of `RouteFallback`.
- Prefetch via existing `prefetchWhenIdle` (`src/lib/idlePrefetch.ts`) from `Index.tsx`, plus `onPointerEnter`/`onTouchStart`/`onFocus` on the hero link in `HeroHeadline.tsx` and menu links.
- `ApplyRecipient.tsx`: `lazy()` for `AccountDialog`, `OTPVerification`, `SuccessScreen`, `ShareScreen`, `SignInPrompt`; `StoryStep`/`ReviewStep` lazy with idle prefetch after mount; render step 1 while `authLoading`, keep draft restore effect as is.
- `GeoGuard` advisory mode already renders immediately; no change.
- Verify with Playwright timing (desktop + CPU throttle) and bundle-size comparison of the apply chunk.
