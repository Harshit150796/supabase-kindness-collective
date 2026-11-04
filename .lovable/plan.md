# Smaller "a tree for every $10" line on every screen

Shrink the handwritten line by about 30% in all three layouts the hero uses, and keep the star tree and caption where they are relative to it.

## Changes (src/lib/starTree.ts only)
- Laptop/desktop (beside the moon or canopy): line size 38 → 27 (still scaled by screen).
- Sky band above the headline (tablets/phones): line size 30 → 21 (times the band scale).
- Small-phone ground version: line size 30 → 21 (times 0.62).
- Caption ("We plant one for every $10…") stays the same size; its gap below the line tightens slightly (30 → 24) on desktop so it doesn't float away.
- Width, write-on clip and centering already follow the size, so they adjust automatically.

## Check
- Screenshot the hero at laptop, tablet and phone widths after the change to confirm the line is smaller and nothing overlaps. No publishing.
