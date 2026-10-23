# Opening review corrections

Nothing published. Cookie bar, 48-second rail and live tree appearance/motion were not changed. Canvas now measures offset dimensions, independently of ancestor transforms. Only the poster retains the introductory settle scale.

## Preview evidence

Chromium desktop 1440×900 and mobile/touch 390×664, mobile DPR 3:

| Measurement | Desktop | Phone |
|---|---:|---:|
| Hero CSS dimensions | 1440×666 | 390×385.109 |
| Canvas CSS dimensions | 1440×666 | 390×385 |
| Canvas origin vs hero | identical (0,73) | identical (0,69) |
| Journey point error vs icon centres | 0px, all four | at most 0.5px |
| Page errors in exercised flows | none | none |

The phone's 0.109px height difference is canvas integer rounding, not scale drift.

The drawing uses one uniform scale, not separate X/Y factors. At 1440×900 the measured X/Y scale was 1.01704; base (720,610.307), canopy centre (720,398.762). At 390×664, the early-capture scale was 0.644231 in both axes. This early capture used the pre-mount 68px navbar fallback, versus the mounted 69px navbar: approximately 1px vertical difference before the existing 2.4s recalculation. Uniform scaling intentionally narrows the canopy compared with the previous stretched drawing. Overlay composites are approximate visual evidence against later live frames, not frozen first-frame pixel registration.

The intro is 5,576 bytes. Its shapes are HTML wrappers animated only with transform/opacity. SVG paths inside branch wrappers remain static; no dash animation and no undrawn round-cap dots. Trunk grows with scaleY; branches scale from their bases, circles/tickets pop, and bob/breathe are transforms. Decorative shapes are assembled by the small inline script before the app bundle, not by React.

A mobile Chromium recording blocked the main thread from 629.7ms to 1629.7ms. Video captures were inspected across the seed/trunk/branch/canopy sequence; compositor motion continued rather than relying on JS updates. Frames and recordings live under /tmp/browser/review. This is a Chromium simulation, not an iPhone 13 hardware or Safari proof.

Cursor: screenshot shows the white hollow ring over Start Donating in the navbar. Computed lead width 44px, fill transparent, trailing-dot opacity zero. Pointer kept stationary during a scroll into the dark journey surface: cursor-light updated. Cursor layer 55 is above navbar 50. No changes to cookie/dialog layers.

Journey path points use offset layout coordinates to icon centres, independent of Reveal transforms. Progress covers the journey midpoint's movement from 85% to 35% of viewport height. Desktop and phone screenshots show the path crossing centres.

Headlines retain original React text nodes. A disposable aria-hidden overlay paints the lines, while original glyphs remain in layout and accessibility. Changing an original text node retained its identity and regenerated the overlay with new text. Resize/cleanup removes overlays, never restores innerHTML.

## Checks and limits

- All 36 tests in the five available `_shared/*test.ts` files passed. Visit-gating tests now exercise the exact 30-minute boundary and a public fundraiser entry.
- Latest observed preview compilation: build OK.
- Browser screenshots: desktop/phone opening and live tree, alignment composites, hover ring, journey path, blocked-thread video/frame sheet.
- No production or physical-device test, no website publishing.
- The alignment composites use later animated live frames; exact frozen-live registration remains unverified.
