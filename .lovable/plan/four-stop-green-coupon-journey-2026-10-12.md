# Four-stop green coupon journey

## Requested behavior
- When the journey first becomes visible, show the green coupon at **01 Donation**, aligned with the heart.
- Each subsequent downward mouse-wheel gesture advances exactly one stop: **02 Allocation → 03 Coupon → 04 Use**. Initial arrival plus three advances shows the four stages.
- Snap directly to the selected icon, with no resting position or slow catch-up between icons. Hold at the cart after stage 04.
- Upward gestures step back through the same stops. Keep normal page scrolling; do not trap or cancel wheel input.
- Preserve the green coupon, white icons, blue background, wording and surrounding design.

## Technical details
- The current helper interpolates between icon coordinates, so intermediate resting positions are currently possible. Replace that behavior with a discrete four-stop selection.
- Group a wheel gesture’s repeated events and momentum into one advance, rather than treating each event as a separate step. Activate this handling only while the journey is visible; ignore horizontal gestures and browser zoom gestures.
- Anchor the marker to the actual selected icon using cached geometry. Recalculate on layout changes without reading layout on each scroll frame.
- Support touch, keyboard and scrollbar scrolling with discrete scroll checkpoints rather than leaving the marker between icons.
- Update the journey timing tests and its scoped architecture rule; leave unrelated animations and payment logic untouched.

## Verification
- Exercise initial arrival and three ordinary downward wheel gestures: heart, allocation icon, coupon icon, cart, in that order.
- Check repeated wheel events, trackpad momentum, upward scrolling, leaving/returning and resizing: no skipped stops or intermediate resting positions.
- Confirm the box and its selected icon remain visible during the ordinary four-stage flow, and normal page scrolling still works.
- Check touch/keyboard behavior, run focused regression tests and inspect the automatic build result.
- Do not publish or deploy.