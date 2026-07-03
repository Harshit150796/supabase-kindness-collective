## Current state of the donation → coupon cycle

I traced the entire flow. Here is what happens today and where it breaks.

```text
Donor pays via Stripe
      ↓
stripe-webhook creates donation row
      ↓
Webhook creates N coupon rows with status = 'pending_procurement', code = NULL
      ↓
❌ GAP: nobody buys the real gift cards
      ↓
Admin has to manually paste codes at /admin/procurement (attach_procured_codes RPC)
      ↓
Status flips to 'available' → recipients finally see them
```

Right now the DB has **115 pending coupons ($915 owed)** and **0 available**. Recipients open the dashboard and see nothing, which is why the cycle feels broken.

## Goals for this plan

1. Close the loop automatically: donated money becomes real, redeemable coupon codes without manual admin work.
2. Give recipients visibility even during the short procurement window.
3. Give admins a full editing surface for every coupon.

## Plan

### 1. Auto-convert donations to real gift cards via API (Tremendous)

Tremendous is the best fit: one API, 1000+ US brands (Walmart, Amazon, Target, Kroger, Visa, etc.), a free sandbox, and it returns the redemption code immediately. Alternatives (Tango, Rybbon) work the same way; we can swap providers later.

- New edge function `procure-coupons` that:
  - Reads all `pending_procurement` coupons for a donation.
  - Calls Tremendous `POST /orders` with campaign + funding source, one order line per coupon.
  - Receives redemption URLs / codes and updates each coupon row with `code` + `status = 'available'`.
  - Logs the batch in `coupon_procurement_batches` with vendor = `tremendous`, order id, cost.
- Called automatically from `stripe-webhook` right after coupons are inserted (fire-and-forget so webhook stays fast).
- Retries: a scheduled sweeper (pg_cron every 15 min) picks up anything still `pending_procurement` older than 5 min and retries.
- Secrets to add: `TREMENDOUS_API_KEY`, `TREMENDOUS_FUNDING_SOURCE_ID`, `TREMENDOUS_CAMPAIGN_ID` (I will ask for these after you approve the plan).
- Brand mapping: small `brand → tremendous_product_id` table (`brand_procurement_map`) so admins can adjust which SKU each brand pulls from.

### 2. Recipient dashboard shows the full picture

Today recipients only see `available` coupons. I will:
- Add a **"Coming soon"** section in `RecipientCoupons.tsx` that lists `pending_procurement` coupons with a subtle badge and expected activation time ("usually within a few minutes"). Codes stay hidden until procurement completes.
- Add a small live counter on `RecipientDashboard.tsx`: "12 new coupons being prepared."
- Realtime subscribe to `coupons` inserts/updates so cards flip from *coming soon* → *available* without refresh.
- RLS: add a SELECT policy allowing verified recipients to view metadata (no `code`) of pending coupons.

### 3. Admin edit surface

Rebuild `AdminCoupons.tsx` from read-only to a full management table:
- Inline edit: `title`, `store_name`, `value`, `expiry_date`, `status`, `code`.
- Filters: status, brand, donor, date range; search by code / donor email.
- Bulk actions: mark expired, regenerate via Tremendous, delete.
- "Retry procurement" button on any `pending_procurement` or `procurement_failed` row.
- Link from each coupon to the source donation.

Add `AdminProcurement.tsx` upgrade: show an **"Auto-procure all"** button that triggers Tremendous for every pending group, plus per-batch order status pulled from Tremendous.

### 4. Safety + observability

- New status value `procurement_failed` (added via migration) so failures are visible instead of stuck as pending.
- Notifications: notify donor when their coupons go live (reuse existing `notify_donor_on_coupon_status_change` trigger — already fires on `available`).
- Admin dashboard KPI: "Procurement success rate (24h)".

## Technical details

- Files to add: `supabase/functions/procure-coupons/index.ts`, `src/pages/admin/AdminCoupons.tsx` (rewrite), small realtime hook in `RecipientCoupons.tsx`.
- Migrations: add `procurement_failed` to `coupon_status` enum; add `brand_procurement_map` table; add `tremendous_order_id` + `procurement_attempts` columns to `coupons`; add SELECT policy for recipients on pending coupons (metadata only, `code` protected by existing `get_coupon_code` RPC); enable `pg_cron` sweeper.
- Secrets: `TREMENDOUS_API_KEY`, `TREMENDOUS_FUNDING_SOURCE_ID`, `TREMENDOUS_CAMPAIGN_ID`.
- Sandbox first: Tremendous ships a free sandbox key so we can end-to-end test before you fund a real balance.

## Two decisions I need from you before building

1. **Procurement provider** — go with Tremendous (recommended, easiest onboarding), or do you already have a Tango Card / Rybbon account you want to reuse?
2. **Rollout mode** — start in **Tremendous sandbox** (fake codes, safe to test end-to-end today) and switch to live once you fund a Tremendous balance, or wait until you have live credentials and skip sandbox?
