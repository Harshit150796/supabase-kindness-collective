# Organizer card: show city and state, not "us"

The Organizer card on fundraiser pages shows the organizer's profile country ("us") under a pin.

## Change
- The Organizer card's location line will show the fundraiser's city and state (e.g. "Austin, TX"), the same place already shown at the top of the page.
- The country is never shown. If no city/state is known, the pin line is hidden.
- Co-organizers show the same fundraiser place; nothing else on the card changes.

## Technical details
- `PublicFundraiser.tsx`: pass the already-computed `place` to `TeamSection` as a new `place` prop.
- `TeamSection.tsx`: replace `place(m)` (city + country) with that prop; drop country from display.
- Frontend only; no database or function changes; not published.
