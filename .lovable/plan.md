# Tidy "Last gift" on fundraiser cards

## What changes
1. **One clean line.** On every fundraiser card the place and the last gift sit on the same line, split by a small dot: "Austin, TX · Last gift 2 days ago". The empty leftover spot where "Example campaign" used to be is removed so there's no stray gap. If there's no place, only "Last gift …" shows (no dot).
2. **Newer dates on example campaigns only.** The clearly marked showcase fundraisers get recent gift dates (spread over the last few days) so they don't look stale. Real fundraisers keep their real dates; nothing is invented for them.

## Technical details
- `src/components/stories/FundraiserCard.tsx` line 23: drop the `is_example` `{"\n"}` span, render location and `Last gift {timeAgo(...)}` with a `·` separator (`aria-hidden`), muted text, single row with wrap.
- First step in build: find where example fundraisers' `latest_donation_at` comes from (the `example_donations` table or a read function) and confirm with a read query.
- Data update (no schema change): move `created_at` of a few `example_donations` rows to recent days (e.g. 1–6 days ago), touching only rows on `is_example` fundraisers. Real `donations` untouched.
- No edge functions, nothing published.
