# Show the real last donation in the Live bar

Replace the invented rotating names in the live donation pill with the single most recent real donation from the database, and stop the fast rotation.

## What changes

- The pill shows one real donation: the donor's display name (as already anonymised in the database), the real amount, the retailer(s) it went to, and the real time since it happened ("3 months ago", "2 days ago", "just now").
- No more rotating through invented names every 3.5 seconds. The pill stays still and only refreshes quietly in the background (every 60 seconds) in case a new donation comes in.
- If there is no donation to show yet, the pill is simply hidden and the rest of the bar stays intact.

Everything else in the bar is untouched: the green Live dot, the donations count, the raised-to-date figure, and the retailer logo strips.

## Note on the data

The newest completed donation in the database is from 12 June 2026, so the pill will honestly read something like "Harshit A. donated $10 via DoorDash — 3 months ago". That is the real record; nothing is padded.

## Technical notes

- Read via the existing `get_recent_public_donations(1)` security-definer function (already returns display name, amount, brand_partner, created_at) through the Supabase client — no schema or policy changes.
- New local relative-time helper (seconds/minutes/hours/days/months) computed from `created_at`; recompute on each refresh tick.
- In `src/components/landing/LiveActivityBar.tsx`: delete `generateDonation`, hold the fetched donation in state, drop the 3.5s rotation interval and the mobile scroll-pause logic that only existed to hide that rotation. Keep the memoised `DonationPill` markup as-is, fed by real values.
