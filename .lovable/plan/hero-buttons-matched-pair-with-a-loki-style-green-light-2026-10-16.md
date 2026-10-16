# Hero buttons: matched pair with a Loki-style green light

## Goal
Restyle the two homepage hero buttons ("Donate now" and "Apply as Recipient") so they match each other and look premium, with a green energy effect inspired by Loki and the TVA. Nothing else on the homepage changes: the tree, the opening, the rotating "CouponDonation is ..." line and the cookie bar stay the same.

## What changes
- **Same size and shape:** both buttons are rounded pills with the same height (48px on phones, 52px on larger screens) and the same width, so neither looks bigger.
- **Donate now (main):** deep forest-to-logo-green fill. A thin bright-green light runs around the edge, and every few seconds a light streak sweeps across the label, like the flicker over the Loki title. On hover the edge brightens, the streak sweeps right away, and the arrow moves forward.
- **Apply as Recipient (second):** dark glass pill (near-black with a green tint, see-through over the sky) with a fine green edge line and soft light text. On hover the edge glows green and a faint scan line passes once. It matches the main button without competing with it.
- **Colors:** only the brand green family (deep forest, logo green, a bright "TVA" green for the light) plus near-black ink. No gold or other warm colors, because the brand rules forbid them. The Loki gold accent is replaced by bright green.
- **Day and night sky:** both buttons stay readable over the bright day sky and the night sky.
- **Motion:** the effects run on every device, as you decided before.

## Exception to record
The site's design rules ban glow effects on marketing pages. This is a founder-requested exception for these two hero buttons only, and I'll write it into the design rules so it isn't spread to other places.

## Technical details
- `src/index.css`: add `.btn-tva` (primary) and `.btn-tva-ghost` (secondary) classes with tokens `--tva-green`, `--tva-deep`, `--tva-glow` (HSL, green hue 123). Effects: a masked conic-gradient border that rotates slowly, a `::after` diagonal light sweep (keyframe `tva-sweep`, 4.5s loop, re-triggered on hover), and a short `tva-flicker` opacity flicker on the label. Uses only transform and opacity for smooth playback.
- `src/components/landing/hero/HeroHeadline.tsx`: swap the two Buttons to the new classes with a shared `h-12 md:h-[52px] min-w-[11.5rem] rounded-full px-6` sizing. Remove the inline `bg-background` and `shadow-lg`, and keep the links and the arrow.
- Night-sky overrides go next to the existing `html[data-sky=night]` hero rules.
- Shared button component and other pages unchanged.
- Add the exception line to the project design rules (memory).
- Check with Playwright screenshots of the buttons at 937px and 390px wide, day and night.
