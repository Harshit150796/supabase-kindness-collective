# Mobile tree quality and scroll-driven How It Works

## Goal
Improve phone rendering by reallocating GPU work from excess resolution to smoothing, tone mapping, and shadows, then make the existing How It Works story reversible and controlled by native page scrolling.

## Part 1 — Mobile tree quality
- Preserve all colors, materials, lighting, fog, scene geometry, scale, silhouette, and the approved camera framing at mobile position `z=16` with `fov=32`.
- Remove the unfinished closer-camera changes currently present in the file.
- Resolve mobile settings from the existing device tier system:
  - Low: DPR 1.5, antialias off, shadows off, `NoToneMapping`, low-power GPU preference, 2,500 leaves.
  - Medium/high: DPR capped at 2, antialias on, shadows on, `ACESFilmicToneMapping` at exposure 1.05, high-performance preference, 1,024 shadow map, modest 4–6 sample blur, and about 4,200 leaves.
- Keep desktop settings unchanged and keep the existing one-step FPS downgrade active without recreating the canvas.
- Ensure leaf alpha-to-coverage continues to detect the antialiased WebGL context on supported phones.
- Capture a reproducible 390px baseline from the current mobile rendering before editing, then capture the updated result under the same emulation and record sampled FPS for both.

## Part 2 — Scroll-driven How It Works
- Keep every existing word, the four desktop columns, transparency band, proof receipt, dignity line, doors, closing line, and all design-token colors unchanged.
- Replace the six-second timer with motion-library scroll progress.
- Below `lg`, use a roughly 240svh container with a `sticky top-0 h-[100svh]` stage:
  - Divide progress into four equal bands.
  - Show one large, legible illustration and its existing number, title, and body at a time.
  - Cross-fade and gently slide between steps in both scroll directions.
  - Scrub each illustration from its band-local progress.
  - Replace the long vertical connector with four 44px-minimum tappable progress segments that scroll natively to their bands.
  - Release naturally into the unchanged transparency content after step four.
- At `lg` and above, preserve the exact approved grid and use section scroll progress to drive the shared master phase, phase offsets, connector dot, and receipt.
- After about 1.5 seconds of desktop scroll inactivity, gently advance from the current phase; any renewed scrolling takes control immediately. Preserve fine-pointer hover replay.
- For reduced motion, disable sticky pinning and scrubbing and show the existing four-step stacked/grid layout with all illustrations settled and readable.

## Verification
- Confirm slow forward and reverse touch scrolling at 390px, native momentum behavior, large artwork, tappable indicators, and natural release.
- Confirm the desktop four-column layout is visually unchanged except for scroll-driven motion.
- Check no horizontal overflow at 320, 360, 390, 430, 768, 1024, and 1440px.
- Verify reduced motion, receipt resting on 2036, no console/runtime errors, and a clean build.
- Report the measured baseline/updated FPS and any remaining quality limitation honestly.
