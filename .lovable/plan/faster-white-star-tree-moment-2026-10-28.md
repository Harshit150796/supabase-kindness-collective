# Faster, white star-tree moment

## What changes
1. **Starts sooner** – the moment begins about 0.6 s after the headline halves meet, instead of 1.6 s.
2. **Plays about twice as fast** – the whole sequence (shooting star flight, stars lighting up, lines drawing, "a tree for every $10" writing, caption) finishes in about 5.5 s instead of 11.4 s. The order and look of each step stay the same, just tighter.
3. **White to match the stars** – on the night sky the shooting star, the pen dot and the "a tree for every $10" handwriting use the same white as the constellation stars (`#eef2ff`) instead of the pale yellow. The small caption becomes a soft white to match. The daytime sky keeps its green version, since the stars there are green too.

Nothing else changes: the 3D tree, the phone signpost, Pause animations and play-once behaviour stay as they are.

## Technical details
- `src/components/landing/hero/HeroStarTree.tsx`: `START_DELAY_MS` 1600 -> 600.
- `src/lib/starTree.ts`: scale the timeline by ~0.48 — `LEAD` [0.2, 1.9], `LIGHT` S2 2.0 ... S7 2.9 (0.15 s steps), `DRAW` trunk [2.95, 3.2], b1/b2 [3.15, 3.45], left/right [3.4, 4.1], `WRITE` [4.15, 5.2], `CAPTION_AT` 5.2, `STAR_TREE_SECONDS` 5.6. Shorten the lead star's colour fade (`LEAD[1] + 1` -> `+ 0.4`).
- Night palette: `fly` and `ink` -> `#eef2ff`, `caption` -> `rgba(238, 242, 255, 0.82)`. Day palette unchanged.
- Update the description line in `src/components/landing/AGENTS.md` if it mentions timing or yellow ink.
