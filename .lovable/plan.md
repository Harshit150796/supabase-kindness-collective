# Repair the What We Do animation flow

## Scope
- Preserve the existing headline, all four step titles, all step body copy, and the overall section order.
- Change only `src/components/landing/WhatWeDo.tsx`.

## Implementation
- Replace the four independent repeating timelines with one parent-owned six-second motion value.
- Pause the shared clock while the section is off-screen, and pass the same progress value to every illustration.
- Apply phase offsets of 0.00, 0.12, 0.24, and 0.36 through derived transforms so activity travels left to right without clock drift.
- Keep a permanent anchor in every scene: giving phone, coupon, grocery bag, and receipt phone.
- Retain the donation, coupon, and notification choreography with tighter pacing and longer settled states.
- Remove the delivery van entirely. Animate bread, milk, and apple dropping into the permanent grocery bag, followed by a brief emerald check.
- Drive the desktop and mobile connecting dots from the same master progress.

## Lower section
- Restyle the transparency area as a clearly raised, softly tinted two-column band.
- Replace the verification pill with a recognizable floating receipt containing line items, a blue seal, shimmer, and a 2026–2036 year roll that holds on 2036.
- Tighten vertical spacing around the transparency band, dignity line, and action links.
- Add short emerald rules around the unchanged dignity sentence.
- Add distinct inline icons, subtle token-based tints, matching glows, lift, and arrow movement to both action links while keeping equal emphasis.

## Validation
- Confirm reduced-motion displays fully resolved static scenes and a 2036 receipt.
- Check the live section at 320, 360, 390, 430, 768, 1024, and 1440 pixels for overflow, clipping, overlap, and illustration legibility.
- Observe the synchronized row across repeated cycles and confirm the production build remains clean.
