# Remove "a tree for every $10"

## What changes
- **Laptops and tablets:** the star-constellation tree in the sky that writes "a tree for every $10" and "We plant one for every $10 you give." is removed. The sky beside the moon/sun stays empty, as before it was added.
- **Phones:** the small wooden signpost on the grass ("$10 donated" / "1 tree planted") is removed too, since it says the same thing.
- The 3D tree, falling logos, names, headline, buttons and cookie bar are unchanged.
- The garden plants can now also grow where the signpost stood.

## Technical details
- Stop rendering `HeroStarTree` and `HeroSignpost` in `HeroSection.tsx`; delete those components, `src/lib/starTree.ts`, `src/lib/heroSignpost.ts`, the Caveat `@font-face` in `index.css` and `public/fonts/caveat-700-tree.woff2` (plus any preload of it in `index.html`).
- Remove the signpost keep-clear rectangle in `tree3d/gardenSpots.ts`.
- Replace the star-tree bullet in `components/landing/AGENTS.md` with one line recording its removal (founder request, Nov 16, 2026); update any tests that check the star tree or signpost.
- Run tree tests, check preview build, browser-check laptop and phone.
