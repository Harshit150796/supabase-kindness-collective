# Let the tree release the page after one scroll

Today the tree starts fully zoomed in, and the first several mouse-wheel scrolls are spent pulling the camera back before the page itself starts moving. That makes the home page feel stuck.

## What changes

- The tree loads already mostly pulled back, so you see it in full straight away.
- One normal wheel scroll finishes the remaining pull-back.
- The very next scroll moves the page, so you reach the rest of the site quickly.
- Scrolling back up to the top restores the closer view, so the effect still exists — just shorter.
- Phones and tablets are untouched (they already scroll natively).

## Technical notes

In `src/components/landing/Tree3DScene.tsx`:

- Initialise `zoomProgressRef` at `0.7` instead of `0` (0 = closest, 1 = fully out), and seed `currentDistRef` in `CameraRig` from that starting progress so there is no visible pull-back animation on load.
- Raise `WHEEL_SENSITIVITY` from `0.0018` to about `0.006` and normalise `deltaMode` (lines → x16) so the remaining 0.3 of progress is consumed by a single wheel gesture, then the handler stops calling `preventDefault()` and native scrolling takes over.
- Keep the existing upward behaviour: at `scrollY <= 4`, scrolling up re-consumes progress back toward `0.7`-and-below rather than blocking the page.
