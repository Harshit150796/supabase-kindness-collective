# Restyle the latest-donation pill to match the reference

Change only the donation pill on the left of the live bar so it looks exactly like the reference image. Nothing else in the bar changes — the donations count, the raised-to-date figure and the retailer logo strips stay exactly as they are.

## The pill

- Wide white rounded pill with a soft shadow and a very subtle border, taller than today (two lines of text).
- Solid green heart on the left, filled, sitting vertically centred.
- First line: small uppercase muted label "LATEST DONATION" with wide letter spacing.
- Second line: `Harshit A. · $10 DoorDash · Jun 12` — the name in bold dark text, the amount in bold green, the retailer in muted grey, and the date as a short month-day (`Jun 12`) instead of "2 months ago".
- The separate pulsing green dot and the "LIVE" word to the left of the pill are removed, since the reference shows the pill standing alone.
- Long retailer lists stay on one line and truncate rather than wrapping.

## Data

Still the real most recent donation from the database, refreshed quietly in the background. Only the date wording changes: exact month and day instead of relative time.

## Technical notes

- All edits confined to `src/components/landing/LiveActivityBar.tsx`: replace the `timeAgo` helper with a short-date formatter (`toLocaleDateString('en-US', { month: 'short', day: 'numeric' })`), restyle `DonationPill` markup, and drop the dot/LIVE block from the left slot.
- Colours via existing semantic tokens (`text-primary`, `text-muted-foreground`, `bg-background`, `border-border`) — no hardcoded hex.
