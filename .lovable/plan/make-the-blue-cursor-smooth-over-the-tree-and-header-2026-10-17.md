# Make the blue cursor smooth over the tree and header

## Goal
The three-dot cursor should feel as fast and smooth in the top half of the homepage (live tree, hero, header) as on calm pages — ideally smoother. Same look, colours, sizes and trail feel; tree look and motion unchanged.

## Why it lags up there
- The two following dots are moved by page code that shares time with the live tree. When the tree takes a long frame, the dots wait for it, so they stutter right where the tree is.
- The blue lead dot only switches to the system pointer (which never lags) over the tree drawing itself — not over the headline, buttons or header, so it stutters there too.
- On every move the cursor re-reads page colours behind it, and the tree re-checks what is under the pointer on every mouse event, adding work in the busiest area.
- The see-through blurred header sits over a constantly changing tree, which is costly to redraw each time a dot passes over it.

## Changes
1. **Lead dot never waits:** extend the system-pointer blue dot to the whole hero area and header (not just the tree drawing), with seamless hand-off at the edges and the same hover/press looks.
2. **Following dots run off the busy lane:** move their gliding to the browser's separate animation lane, which keeps running smoothly even while the tree is busy. Same 170/340ms follow feel as today.
3. **Less work per move:** colours behind the cursor are worked out once per section (cached, refreshed on scroll/route change) instead of re-reading styles; the tree checks what's under the pointer at most once per drawn frame.
4. **Header:** keep the header looking the same but avoid the live blur over the moving tree (near-identical solid tint) if measurement confirms it is a cost.
5. Keep text-field cursor, touch devices, admin pages, opening animation and menus behaving as now.

## Checks
- Same mouse paths over tree, header, hero buttons and a calm page, before and after: frame gaps and how far each dot falls behind.
- Existing cursor and tree tests plus new ones for the hand-off zones and follow timing.
- Honest note: the test browser has no graphics card, so real-device smoothness must be confirmed by you.

## Technical notes
Files: `CursorTrail.tsx`, `cursorBackground.ts`, cursor rules in `index.css`, pointer handling in `Tree3DScene.tsx` (r3f event throttling), possibly `Navbar.tsx` blur. Followers use Web Animations API transform animations (compositor) retargeted from pointer samples. Native lead via CSS `cursor: image-set(...)` on `.hero-stage` and `[data-site-header]`, still gated by `CSS.supports`. No backend, no publishing. Lovable picks the model automatically; Fable 5.1 / GPT-6 Astra can't be selected for this.
