# Visible travel between the four journey stops

## What will change
- Keep the green coupon starting at **01 Donation**, with each downward wheel gesture selecting **02 Allocation → 03 Coupon → 04 Use**.
- Replace the instant jump with a short, visible journey along the dotted line, taking approximately **300ms per adjacent stop**.
- Land exactly on the selected white icon and remain there until the next gesture. Intermediate positions appear only during travel, never as resting places.
- Reverse travel when scrolling upward. Keep normal page scrolling, the blue background, green coupon, white icons and all wording unchanged.

## Technical details
- The current marker update writes the destination transform immediately. Animate the transform between cached icon coordinates instead, without layout reads during movement.
- Preserve wheel-event grouping so momentum does not advance extra stops. Repeated scroll updates must not restart the same transition.
- If another deliberate gesture arrives during travel, continue smoothly from the current position toward the newly selected stop, following the line through any intervening icon.
- Place the marker directly at its initial anchor on arrival; handle resize, off-screen exit and hidden tabs without stale motion or a background animation loop.
- Update focused timing tests and the scoped journey rule; leave other homepage animations and payment logic untouched.

## Verification
- Check initial Donation placement, visible travel for each of three downward gestures, exact landing and holding at Use.
- Check upward travel, momentum, quick gestures and longer pauses: no skipped selected stops or unintended resets.
- Inspect the short laptop window and a stacked phone layout, including resizing and leaving/returning to the section.
- Run focused tests and check the automatic build result and browser errors.
- Do not publish or deploy.