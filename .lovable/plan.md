# Replace the live tracking bar with a retailer-first trust strip

## Why this is the right business decision
The strip should answer a customer’s immediate question—“Where can these coupons be used?”—instead of showing platform-wide totals that do not represent any individual campaign. Removing the old donation also prevents a stale date from weakening trust.

From the CEO perspective, this turns a fragile activity claim into an evergreen product advantage: choice across familiar retailers. From the customer perspective, it becomes faster to understand, more credible, and more useful.

## Selected direction
Build the **Sophisticated partner gallery** direction with the requested **auto-scrolling marquee** and **floating depth**, adapted into the existing compact band beneath the hero.

- Keep the quiet pale brand wash with emerald, warm gold, and blue accents through existing semantic tokens.
- Use a crisp Sora/Manrope-style hierarchy without changing typography elsewhere on the site.
- Make **“Redeemable at”** the dominant message.
- Add a small truthful supporting line: **“Choose familiar brands for every coupon.”**
- Give the retailer logos more visual presence in softly elevated individual tiles.
- Run the full available retailer set through a seamless, slow auto-scrolling rail with soft edge fades.
- Pause movement for reduced-motion visitors; show a complete static selection instead.

## Remove
- The “Latest donation” pill and its database polling.
- The platform-wide donation count.
- The platform-wide amount raised.
- “Live” language, dates, pulses, and any implication that recent activity is occurring.
- Any “preferred partners” or “verified partners” claim, since the current source only establishes available brands—not a formal partnership status.

## Responsive behavior
- **Desktop:** compact two-part strip—message anchored on the left, expansive logo marquee across the remaining width.
- **Mobile/tablet:** centered “Redeemable at” heading and support line above a full-width logo marquee; no cramped stats row.
- Preserve the strip’s role as a concise transition between the hero and the next section rather than turning it into a large standalone card.

## Technical details
- Refactor `LiveActivityBar.tsx` into an evergreen retailer strip while keeping its existing export and homepage placement.
- Remove the Supabase, state, timer, and landing-stat dependencies from this component only; other homepage sections continue using real database totals where appropriate.
- Reuse the self-hosted brand assets from `brandLogos.ts` and the existing marquee animation.
- Use semantic color/shadow tokens only, accessible image labels, stable tile dimensions, edge masking, and no new package.

## Verification
- Capture the finished strip at 390px and 1280px.
- Confirm no donation name, date, donation count, or raised amount remains in the strip.
- Confirm the marquee is seamless, logos are not clipped, and no horizontal page overflow occurs.
- Confirm reduced motion displays a useful static retailer selection.
- Confirm the preview has no console errors and the latest build is clean.
