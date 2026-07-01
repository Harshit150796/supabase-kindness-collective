# Show rotating placeholder donors until real donations arrive

## Goal
The Top Donors panel currently shows nothing (or a "be the first donor" empty state) when there are no real donors this week. Instead, seed it with a rotating pool of plausible names — mixed with a couple of "Anonymous" entries — that changes every day, and swap them out automatically as real donors come in.

## Approach
Keep this purely client-side (no DB writes, no fake donations polluting analytics or admin views).

### 1. `src/hooks/useTopDonors.ts`
- After the existing RPC call to `get_top_donors_week` returns, check how many real donors we have (`data.length`).
- If we have **5 or more** real donors → show them exactly as today.
- If we have **fewer than 5** (including zero) → **pad the list up to 5** by appending placeholder donors from a local pool. Real donors always come first and keep their real totals/counts.
- Placeholders are marked with a flag (`is_placeholder: true`) so the UI can add a subtle "sample" indicator later if we want — for now, they render identically so the panel looks alive.

### 2. Placeholder pool (new file `src/lib/placeholderDonors.ts`)
- Curated pool of ~40 first-name + last-initial entries (e.g. "Sarah M.", "David P.", "Priya S.", "Miguel R.", …) plus 3 "Anonymous" entries.
- Deterministic daily rotation: seed a small PRNG with `Math.floor(Date.now() / 86_400_000)` so every visitor sees the **same 5 names on the same day**, and the set changes automatically at midnight UTC.
- Amount + gift count are also seeded from the day so they don't jitter on every render: totals in a plausible range (e.g. $45–$480), gift counts 1–4. Amounts sorted descending so ranking looks natural.
- Always include at least one "Anonymous" entry in the daily set.

### 3. Merging logic in the hook
- `padded = [...realDonors, ...placeholders].slice(0, 5)`, then sort by `total` descending so a real $1,000 donor still lands at #1.
- Real donors overwrite same-name collisions.

### 4. No component changes required
`TopDonorsPanel.tsx` already renders whatever `useTopDonors()` returns. It will automatically pick up the padded list. Existing realtime subscription still refreshes when a real donation lands, so real donors bubble in without a reload.

## Out of scope
- No database migration, no fake rows inserted into `donations`.
- No changes to admin analytics or leaderboards elsewhere.
- No changes to `LiveActivityBar` (that already has its own animation).

## Verification
Reload the landing page: the panel shows 5 rotating names with at least one "Anonymous". Reload again — same 5 names (daily seed). Change the system date to the next day — a different set appears.
