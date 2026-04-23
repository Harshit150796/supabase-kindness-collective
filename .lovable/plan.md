

## Findings

I checked the database for Michael's $25 donation. Here's exactly what we know — and what's broken.

### The donation record (only 1 match)
- **Donor email**: `maustin5280@gmail.com`
- **Amount**: $25
- **Date**: 2026-04-16
- **Status**: completed
- **Stripe session**: `cs_live_a1dx3oikWbKzwwgbmDdA7J8pyqfovfNdxHTvMdn2yDL41GW6neaFeWMB2M`
- **`fundraiser_id`**: **NULL** ← we don't know which fundraiser
- **`donor_id`**: **NULL** ← donated as guest (not logged in), so no profile name "Michael" is linked
- **`message`**: NULL

### Why we can't tell which fundraiser

Two real bugs in the donation pipeline:

1. **`create-donation-checkout` never passes `fundraiser_id` into Stripe metadata.** The donate flow lets users pick a fundraiser, but that ID is dropped before checkout.
2. **`stripe-webhook` never reads or writes `fundraiser_id`** when inserting the donation row. Even if metadata had it, it'd be ignored.

Result: every donation lands with `fundraiser_id = NULL`. We literally cannot attribute Michael's $25 (or any other donation) to a campaign right now.

### Were the fundraiser totals updated?

**No.** The webhook does not touch the `fundraisers` table. `amount_raised` and `donors_count` on every fundraiser are stuck at whatever was seeded — donations don't roll up. (That's why those fields are still 0 across the board.)

### Why Michael's name isn't visible

The donation was made as a guest (no `donor_id`), and Stripe Checkout's `customer_details.name` is captured by Stripe but **we don't store it** — only `donor_email`. So "Michael" likely came from the Stripe dashboard, not ours.

### Admin CMS — donations page is missing

Your admin portal has pages for Users, Fundraisers, Coupons, Stories, etc. — but **no Donations page at all**. The only place donations appear is `AdminAnalytics.tsx` as aggregated totals. There's no way to browse, search, or open a single donation today.

---

## Plan to fix (4 changes)

### 1. Capture `fundraiser_id` end-to-end
- `DonationFlow.tsx` → pass selected `fundraiserId` to `create-donation-checkout`
- `create-donation-checkout/index.ts` → include `fundraiser_id` in Stripe session metadata
- `stripe-webhook/index.ts` → read `metadata.fundraiser_id` and write it on the donation row
- Also capture `customer_details.name` into a new `donor_name` column so guest donor names are visible

### 2. Auto-update fundraiser totals
In `stripe-webhook`, after inserting a successful donation with a `fundraiser_id`:
- `amount_raised += amount`
- `donors_count += 1` (counted by distinct donor_id/email per fundraiser to avoid double-counting repeat donors)

Add a DB migration to add a `donor_name` column on `donations` and a tiny SQL helper (or do it in TS) for the increment.

### 3. Backfill the existing 10 donations
One-off: pull `customer_details` and `metadata` from each Stripe session via the Stripe API and update the donations rows + fundraiser counters. For Michael's donation specifically, this will recover his name and (if his checkout had fundraiser context) the fundraiser link. If his session has no fundraiser metadata (likely — the bug existed when he donated), we'll mark it as a general donation and surface it that way.

### 4. New Admin Donations page (`/admin/donations`)
Following the same pattern as `AdminFundraisers.tsx`:
- Sortable, paginated list: date, donor name/email, amount, status, fundraiser (linked), brand allocations, Stripe receipt link
- Filters: status, date range, fundraiser, has-fundraiser-vs-general
- Detail drawer: full Stripe metadata, coupon(s) generated, refund status
- Add link from Admin Dashboard sidebar + a "Total Donations" stat card

### Deliverable for your immediate question
After step 3 runs, you'll be able to open `/admin/donations`, search "maustin5280" or "Michael", and see the full record — fundraiser link included if Stripe captured it, or flagged as "unattributed" if not.

### Honest caveat
For donations made **before** the fix, fundraiser attribution depends entirely on what Stripe stored in session metadata at the time. Since our checkout never sent `fundraiser_id`, it's almost certainly missing for all 10 existing donations including Michael's — the backfill will recover names and emails, but those historical donations will have to be manually reassigned to fundraisers (the new admin page will let you do that with a dropdown).

