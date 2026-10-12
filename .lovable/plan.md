# Better timing for the four dealt cards

## Scope
Tune only the green-and-blue cards in “Give what people need.” Keep their design, wording, white illustrations and dealing/flipping motion. Leave the compact phone/tablet presentation, other homepage animations, payments and loading unchanged. Nothing will be published or deployed.

## Timing changes
- Start later: wait until a meaningful portion of the card row is visible, rather than starting when its top first crosses the current trigger line.
- Require about 180ms of continuous visibility before the first deal, so a brief scroll past the trigger does not launch the whole sequence.
- Give each card a distinct beat from left to right. Start with approximately 750ms per deal and 500ms between starts, after the visibility hold; refine these values during preview checks so the flips feel deliberate without making the fourth card wait excessively.
- Keep completed cards face up while the remaining cards arrive. The illustrations remain finished, as they are now; this change concerns card arrival, not a new drawing animation.
- Pause an unfinished sequence if the row leaves view or the tab becomes hidden. Resume remaining animation from its current position when visible again, without restarting completed cards.
- Preserve the existing replay boundary: re-stack only after the row has completely left below the viewport. Scrolling back up from below must not unexpectedly re-deal finished cards.

## Technical details
- Current source starts the whole sequence using an IntersectionObserver with `rootMargin: '0px 0px -20% 0px'`, a 120ms initial delay, 300ms stagger and 1000ms duration. This confirms the current trigger and overlap; the perceived early start still needs a scroll reproduction.
- Use a dedicated card-row visibility gate, not the shared early-reveal observer. Base its required visible depth on the smaller of roughly 35% of the row height and 35% of viewport height, so short laptop windows can still trigger naturally.
- Keep Web Animations API transform-only animation with pixel transforms. Visibility and resize observers handle eligibility; do not add layout reads to scroll frames.
- Limit implementation to the dealt-card timing in `WhatWeDo.tsx`, its scoped architecture rule and a focused timing/lifecycle test following existing project tests.

## Verification
- Reproduce the early start before editing, then compare the same slow and ordinary downward scroll paths after the change.
- Check short laptop, standard laptop and wide desktop windows: the first card starts visibly on screen, all four arrive in order, and the final card is not left waiting awkwardly.
- Check hovering near the trigger, reversing direction, fast scrolling past, returning to the row, tab switching and resizing during a deal. No hidden countdown, half-flipped freeze or duplicate sequence.
- Verify the phone/tablet layout remains unchanged, run the focused tests and check the automatic build result.