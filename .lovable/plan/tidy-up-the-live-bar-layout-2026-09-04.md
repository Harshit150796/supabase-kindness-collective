# Tidy up the Live bar layout

The bar currently spreads three blocks with equal `justify-between` spacing, so the "Redeemable at" label and logos drift toward the middle and eat space. Goal: a calm, evenly balanced single row where each part has a clear place.

## New arrangement (desktop / tablet)

```text
[ ♥ LATEST DONATION            ]   24 donations | $1,250 raised to date      REDEEMABLE AT ( )( )( )( )
  Harshit A. · $10 DoorDash · Jun 12
```

- Left: latest-donation pill, unchanged content, anchored hard left.
- Middle: the two stats, grouped closer together with a thin vertical divider between them instead of loose spacing, kept visually centered.
- Right: "Redeemable at" + revolving logos pushed to the far right edge of the container, with a soft fade mask on the left so logos slide in cleanly instead of looking clipped.

Implementation detail: give the row an explicit three-column structure (left auto, center flexible and centered, right auto) so the right group truly sits at the edge and the center stats stay optically centered no matter how wide the pill gets.

- Logos: 4 in the loop (down from 5) at their current size, so the right group is compact.
- Label styled smaller and lighter than the stats so it reads as a caption, not a competing headline.
- Bar height stays as it is now (~64px), one row, no wrapping or overlap.

## Mobile

No structural change: pill on top, stats under it, brand marquee as its own full-width row. The "Redeemable at" caption gets added above that mobile marquee row so the logos have context there too, without adding height beyond a single small line.

## Verification

Screenshots at desktop (1280), tablet (~900, current preview width) and mobile widths to confirm one tidy row, right-aligned logos, no clipping or overlap, and unchanged height.
