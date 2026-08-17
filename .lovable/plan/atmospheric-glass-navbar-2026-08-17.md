# Atmospheric Glass Navbar

Refine the top navigation into a frosted, premium glass bar that blends into the 3D sky below it — no layout or functional changes.

## What changes visually

1. **Frosted translucent surface**
   - Stronger, layered blur on desktop and tablet (currently blur is desktop-only): translucent background at ~70% with saturation boost, so the sky colour subtly tints the bar.
   - Hairline top highlight inside the bar (1px light line) plus a very soft inner shadow at the bottom — the classic glass "pane" read.

2. **Light haze at the sky/nav seam**
   - Replace the hard bottom border with a soft gradient haze: a thin, low-opacity band fading downward under the nav so the seam between nav and hero sky dissolves.
   - Border becomes a near-invisible token-based hairline that only shows once the page is scrolled.

3. **Scroll-reactive state**
   - At scroll top: maximum transparency, minimal haze — the sky reads through.
   - After ~24px scroll: slightly denser glass, hairline border and a soft ambient shadow fade in. Transition is 300–400ms ease-out.

4. **Sunlight glow behind the CTAs**
   - A warm gold radial glow sits behind the "Start Donating" button (and the account button when signed in), blurred and low opacity, so the CTA looks lit from behind rather than outlined.
   - On hover the glow expands slightly and warms; button keeps its existing emerald→gold shadow behaviour.

5. **Nav link polish**
   - Links get a soft rounded hover pill using a faint translucent surface instead of a colour jump, and a 1px underline that grows from the centre on hover.
   - Logo wordmark keeps its exact brand colours; only a faint glow behind the logo mark on hover.

6. **Mobile menu**
   - Mobile dropdown panel uses the same frosted glass + haze treatment so the open menu matches the bar.

## Technical notes

- New semantic tokens in `src/index.css` (light + dark): `--glass-surface`, `--glass-border`, `--glass-highlight`, `--haze`, `--glow-warm`, plus a `--shadow-glass` and `--gradient-haze`. No hardcoded colour utilities in components.
- Register `shadow-glass` and the haze/glow gradients in `tailwind.config.ts` so they are usable as utilities.
- `src/components/layout/Navbar.tsx`: add a small scroll listener (`useEffect` + `scrollY > 24`) for the scrolled state, wrap the CTA area in a relative container with an absolutely positioned blurred glow div (`pointer-events-none`), and add the haze element as an `::after`-style absolutely positioned div below the bar.
- Keep all routes, dropdown items, auth logic and markup structure unchanged — presentation only.
- Verify against the hero at scroll top and mid-scroll, in both light and dark mode, on desktop, tablet and mobile widths.
