# Make every animation play on phones — including the live site

## What the research found

1. **The live site is still the old version.** Every phone fix from the last pass (live tree on mobile data, desktop-quality tree, visible scroll reveals, moving "how it works" story, touch press effects) exists only in the preview. coupondonation.com will keep showing the old, mostly-static phone experience until you publish. This explains most of what you saw.
2. **Testing in iPhone Safari's engine (WebKit) shows a real bug in the preview too.** Earlier checks only used Chrome. In WebKit at iPhone size:
   - The 3D tree does mount, at full quality, and keeps animating.
   - Many sections arrive **after** they are already on screen, because their content waits for data (fundraiser cards, testimonials, figures, brand board). The current reveal sees "already on screen" and **snaps them in with no animation**, or leaves them invisible for 300–600 ms before snapping. So on phones, much of the scroll motion never visibly plays.
   - Elements passed through a carousel or wrapper log "function components cannot be given refs" warnings (Testimonials, Figures, Footer labels), so some of them never get their reveal attached.
3. **Phones with "Reduce Motion" on get a calmer, mostly-still version** (still tree, no birds, fades only, paused marquee, no press effects). You've chosen: full animations for everyone, regardless of that setting.

## What will change

**Scroll reveals (every page using them: home, About, How It Works, FAQ, Blog, Stories, fundraiser pages, 404)**
- Content that appears while already on screen now plays a real fade-and-rise (about 0.45 s) instead of snapping in. Only a genuine fast fling still finishes instantly.
- Content still triggers just before it reaches the screen when it's ready in time, so nothing sits blank.
- Fix the ref warnings so every wrapped card, figure and label gets its animation.

**Full motion everywhere, ignoring the phone's Reduce Motion setting**
- Tree: camera drift, orbiting logos, birds, falling coupons, trunk ripple, wind — same as desktop on every device.
- Rotating headline slides (not just crossfades); brand marquee scrolls (pause button stays for anyone who wants it).
- Count-ups, progress bars, ring draws, story illustrations, dashboard card rise, skeleton shimmer, touch press effects — all run.
- Remove the stylesheet rules that switch animations off under Reduce Motion (site-wide, including the older slide/stagger/fade classes on other pages). The cookie bar stays untouched.

**Other pages**
- Sweep every page for animation classes and motion components that are disabled on small screens or by the motion setting, and turn them back on (fundraiser page ring and count-up, dashboard rows, apply flow transitions, stories cards).

**Tree on phones**
- Keep full desktop settings at start; only measured slowdowns reduce shadow sharpness and render resolution (invisible). Add a guard so the first seconds of page loading don't count as "slow" on phones, so capable phones don't step down by mistake.

## Verification
- Run the homepage and key pages in **both** iPhone Safari's engine (WebKit) and Android Chrome's engine at 390, 412 and 1024: sample each section's opacity and position as it arrives — it must visibly animate from hidden to shown, never snap, never stay blank.
- Same checks with Reduce Motion switched on: identical motion to off.
- Tree mounted and moving (camera, birds, logos) on simulated iPhone and Android.
- Scroll top-to-bottom-and-back: page height never shrinks; no sideways scroll.
- Build clean, all tests pass (updated tests for the new "full motion always" rule).
- Plainly reported: simulation can't prove real-phone smoothness, and **you'll need to publish** before your phone shows any of this on coupondonation.com.

## Technical details
- `useMotionPreference` returns `'full'` always (keep the hook so callers don't change; keep `?motiondebug`). Remove/neutralise `@media (prefers-reduced-motion)` blocks in `src/index.css`, the `reducedMotion()` helper in `FundraiserDashboard.tsx`, and the check in `ui/organizer.tsx`.
- `useEarlyReveal`: replace the `rect.top <= 0.8h → instant` rule with "mounted on screen → animate with 0.45 s, no delay"; keep instant only for true flings (scroll delta > 1 viewport between frames). Keep 20% bottom pre-trigger.
- Convert `Reveal`/`CountUp`/`SectionLabel`/`BrandLeaderboard` wrappers to `forwardRef` (or stop passing refs) where warnings show.
- `PerfWatchdog`: extend warm-up until first paint plus network idle (or 2 s minimum) and require two consecutive slow samples before a step-down.
- Record the founder decision (full motion regardless of OS setting) in project memory; update AGENTS.md motion rule and the tree/motion regression tests.
- Probes use Playwright WebKit (`p.devices["iPhone 13"]`) plus Chromium Android profiles; scripts under `/tmp/browser/`.
