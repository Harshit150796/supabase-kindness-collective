# Restore all approved motion and remove Top Donors

## Confirmed causes

- The retailer-logo rail currently runs at **10 seconds on phones/tablets** but **48 seconds at desktop width**, so smaller devices visibly race. The desktop timing will become the single timing everywhere.
- Top Donors is rendered twice around the homepage hero and also drives a separate weekly-donor area on Stories; its hook polls and subscribes in the background. “Remove completely” will remove the UI and its requests, not merely hide it.
- The four compact giving steps depend on a one-shot reveal classification and a progress animation that can resolve instantly or before a visitor sees it. Their artwork wrapper itself begins fully visible, making failed sequences look static.
- Homepage motion is split between shared reveal primitives, local CSS animations, Motion components, chart animation, lazy-loaded sections, and the WebGL tree. A single successful tree or reveal test does not prove the page’s other animation systems are running.

## Changes

### 1. Remove Top Donors completely
- Remove both hero placements, the weekly donor section on Stories, and all imports/usages of the Top Donors hook.
- Remove the now-unused panel and hook so there is no hidden polling, realtime subscription, reserved space, or donor leaderboard code left.
- Preserve the hero composition, tree, chat control, and CTA positioning after the panel is gone.

### 2. Make retailer-logo movement universal
- Set the live retailer rail to the current desktop speed of **48 seconds per full loop at every width and device**.
- Keep the existing pause/resume control, hover pause, touch pause, seamless duplicate track, and accessibility labels.
- Verify elapsed distance over time rather than relying only on CSS inspection, so phone, tablet, and desktop speeds are demonstrably equal.

### 3. Rebuild the four giving-step triggers
- Keep the compact below-`lg` layout and animate each illustration only when its own row approaches the viewport.
- Give every row a deterministic replayable sequence: artwork starts in its true opening frame, then the Give press, coupon formation, basket fill, and receipt/check drawing play visibly; caption follows by about 120ms.
- Prevent fast scrolling, delayed mounting, browser throttling, or a stale one-shot observer from skipping the sequence. A fast fling may reveal completed content, but ordinary scrolling must play the motion.
- Keep the desktop shared story clock and restore its continuous/scroll-linked illustration motion without changing the compact mobile layout.

### 4. Restore and standardize homepage motion
Audit each rendered homepage section and reconnect every approved effect to the shared full-motion path:
- Hero: live tree movement, logo sway/drop/regrow, birds, fireflies, ripple, camera behavior, and rotating headline.
- Entry motion: headings, copy, fundraiser cards, completed campaigns, transparency, donation flow, security items, testimonials, figures, retailer chart, CTA, and footer.
- Data-driven/lazy content: animate after real content commits; loading, empty, and error states remain visible and keep their reservations.
- Figures and proof: count-ups, bars/rings, chart growth, donation cycling, and pulse indicators.
- Interactive elements: desktop hover motion plus equivalent touch press feedback.
- Fix current ref warnings in the tree/reveal paths where they can prevent animation attachment or pollute runtime checks.

Use one shared reveal contract: pre-trigger before arrival, visible fade-and-rise for ordinary entry, no permanently hidden content, and no page-height collapse. Preserve the founder-approved full-motion-on-every-device rule already recorded for this project.

### 5. Sweep previously animated pages
- Search every routed page for Motion components, animation utilities, shared reveals, counters, progress indicators, carousels, and responsive/reduced-motion branches.
- Restore previously developed motion where a mobile breakpoint, stale gate, ref failure, or local duplicate has disabled it.
- Reuse the shared motion primitives instead of adding page-specific substitutes, while leaving page content, business behavior, and the cookie bar unchanged.

## Verification

- Add regression checks for: no Top Donors render/fetch paths; universal 48-second marquee; all four step timelines; delayed/lazy reveal behavior; full-motion policy; and no mobile-only animation suppression.
- In Chromium and WebKit, test phone, tablet, and desktop profiles, including 390px, 412px, 768px, 1024px, 1180px, and 1440px widths.
- Record sampled opacity, transform, and illustration-frame changes as each homepage section enters; every planned animation must either visibly progress or already be correctly completed after a genuine fling.
- Compare logo-rail displacement over the same elapsed time on phone/tablet/desktop.
- Scroll the homepage top-to-bottom and back: no blank sections, no decreasing document height, no horizontal overflow, and sections stay in order.
- Confirm the tree is animated while visible and pauses only off-screen or in a hidden tab; preserve its materials, lighting, camera framing, geometry, and quality rules.
- Exercise representative non-home routes from the animation sweep in both engines.
- Run the full existing tests plus motion regressions and confirm a clean preview build/runtime console.
- Do not publish. Report any limitation plainly, especially that simulation cannot prove real-device frame smoothness.
