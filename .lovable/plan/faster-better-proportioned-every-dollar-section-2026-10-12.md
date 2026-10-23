# Faster, better-proportioned “Every dollar” section

## Scope
Update the homepage “Every dollar” band and the loading, spacing, and typography of its immediate neighbors: the fundraiser/completed-campaign area above, the “We don't track the person” statement, and the donation section below. Keep all wording, live figures, payment behavior, the tree, opening, and cookie bar unchanged. Do not publish or deploy anything.

## Visual changes
- Try a full-width, solid brand-blue background using the existing `hsl(212 80% 42%)` blue. Apply it only to “Every dollar,” not the entire neighborhood.
- Use high-contrast light text, a light outlined-to-filled **100%**, and light underline, checks, and journey artwork. Do not leave dark green or blue labels unreadable against the blue band. Keep Donate buttons green in the neighboring donation section.
- Preserve Instrument Serif headings/numerals and Instrument Sans body/controls. Reduce the oversized headline and number using explicit breakpoint sizes, rather than viewport-scaled typography: headline approximately 40px on phones, 56px on tablets, and 72–80px on laptops/wide screens; **100%** approximately 128px, 192px, and 240px respectively, subject to fit checks.
- Keep body copy at 16–18px with comfortable line spacing, use consistent heading hierarchy across the immediate neighbors, and tighten excessive vertical gaps without crowding the content. Retain stacked phone layouts and aligned desktop columns.
- Keep the band unframed: no added cards, gradients, shadows, or decorative labels.

## Loading and animation changes
- Measure cold-load and fast-scroll arrival for these sections before changing loading behavior. They already use lazy mounting and idle code prefetch; improve the measured bottleneck rather than adding another loading system.
- Ensure nearby section code is available before viewport entry without competing with the homepage opening/tree. Preserve Save-Data handling and existing data caching; do not eagerly load the entire page.
- Recalibrate this neighborhood’s reserved heights against its revised layouts and real loading/empty/populated states. Avoid persistent oversized blank areas while preserving scroll stability.
- Preserve the **100%** filling on downward scroll and draining on upward scroll, the underline redrawing every seven seconds, the drawn checks, and the moving journey coupon.
- Cache journey geometry on layout/resize changes. Remove its repeated `getBoundingClientRect`, `getTotalLength`, and SVG point queries from scroll frames; interpolate the cached route and update only the marker transform.
- Suspend recurring work when this band is off-screen or the tab is hidden, then resume when visible. All approved animation remains active on every device while visible; do not introduce reduced-motion modes or testimonial pause behavior.

## Evidence and technical scope
- Current source uses 104px laptop headlines and a figure capped at 300px. The running homepage confirmed those sizes and the light background.
- `CouponScrollPath` currently reads layout and SVG geometry in scroll-triggered frames. This is an optimization candidate, not a proven explanation of all perceived slowness.
- One local scroll sample showed no long tasks or runtime errors; cold/throttled arrival and smaller-screen behavior still need measurement.
- Primary files: `TrustTransparency.tsx`, `CouponScrollPath.tsx`, homepage `Index.tsx`, and semantic section tokens in `src/index.css`. Change adjacent presentation files or shared loading helpers only where measurements support it, preserving other consumers.
- Update the scoped design rule for this founder-requested blue-band trial and relevant regression tests; no database, payment-function, or service changes.

## Verification
- Compare before/after section arrival, frame timings, and layout shifts under equivalent scroll paths, including a slower network/CPU scenario. Report measured results rather than promising a percentage improvement.
- Check phone, tablet, short laptop, and wide desktop layouts, including the current 889×576 window: text fits, blue-band contrast is readable, no horizontal overflow, and transitions into adjacent bands feel consistent.
- Scroll down and back up to verify filling/draining; leave and revisit the section to verify animation resumes without frozen or half-drawn content.
- Exercise fundraiser filtering and the donation card through retailers → amount/split → review without submitting a payment.
- Run relevant tests and check the automatic build result. Nothing will be published or deployed.