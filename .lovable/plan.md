# Mobile Hero & Activity Bar Polish

Four focused mobile fixes on the landing page. No business logic changes.

## 1. Remove the white "bubble" around Donate now (mobile)
File: `src/components/landing/hero/HeroHeadline.tsx`

The CTA row currently wraps in a `bg-background rounded-full px-2 py-1` pill on mobile (added when we stripped `backdrop-blur` for iOS Safari). That pill is what's reading as a weird white bubble around the single visible button.

- Drop the mobile pill wrapper. Keep the row as a plain `inline-flex` with gap.
- Keep the button's own shadow for legibility over the 3D scene; add a subtle `drop-shadow` on the row instead of a solid background.

## 2. Show "Apply as Recipient" next to "Donate now" on mobile
Same file.

- Remove the `hidden md:inline-flex` on the secondary button so it renders on mobile too.
- Replace its label/target with the recipient CTA used on desktop nav: `Apply as Recipient` → `/apply-recipient` (matches existing route used elsewhere).
- Use `size="sm"` on both, tighten gap to `gap-1.5`, allow wrap-none. Both buttons get matching height so they sit cleanly side-by-side at 384px width.
- Outline button gets a solid `bg-background` (no backdrop-blur on mobile) so it stays readable.

## 3. Shrink "Talk to Coupon" launcher on mobile
File: `src/components/landing/hero/AITreeLauncher.tsx`

- Mobile: render as a compact pill — small leaf icon + short label "Coupon" (or "Ask Coupon"). Reduce padding to `p-2`, icon circle to `w-6 h-6`, text to `text-[11px]`, drop the amber pulse dot on mobile.
- Desktop (md+): keep the current larger pill with "Talk to Coupon" unchanged via responsive classes.
- Keep `aria-label="Talk to Coupon, the AI tree"` for a11y.

## 4. Make the brand marquee visible on mobile in LiveActivityBar
File: `src/components/landing/LiveActivityBar.tsx`

The brand strip is currently `hidden lg:flex`, so phones never see brands moving. Plan:

- On mobile, render the marquee as its own full-width row **below** the live donation + stats rows (stacked layout already uses `flex-col` on mobile).
- Use the existing `animate-marquee` keyframe with the duplicated logo set so the loop is seamless.
- Keep desktop behaviour identical (inline strip in the same row at `lg+`).
- Mark the row `aria-hidden="true"` (decorative) and `overflow-hidden` with mask-image fade on the edges so it doesn't feel cut.
- No new data, no JS — same `popularBrands.slice(0, 6)` source already imported.

## Technical notes

- Touch targets: both hero CTAs stay ≥ 36px tall (`size="sm"` in shadcn = h-9). Launcher stays ≥ 36px.
- No layout-shift risk: hero overlay is absolutely positioned; adding the second button doesn't change container height. Marquee row adds a fixed ~32px strip on mobile inside the existing `LiveActivityBar` section, which is below-the-fold of the hero (no CLS into the 3D canvas).
- No changes to `Tree3DScene`, routes, data, or styles tokens.
