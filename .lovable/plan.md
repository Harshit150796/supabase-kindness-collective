

# Streamlining Donation → Coupon Tracking & Notifications

You asked two big questions. Here's the honest read on each, then the plan.

---

## Question 1: Should donors hand out coupons themselves, or should we (the platform) do it?

**Recommendation: Platform-controlled distribution.** Donor pays → platform owns the coupon → platform assigns it to a verified recipient. Donor never touches the code.

### Why (trade-offs honestly)

| Option | Pros | Cons |
|---|---|---|
| **A. Donor distributes** (donor gets the code, sends to whoever) | Personal, gift-like feel | Defeats your verification model. Codes get shared on Reddit. No tracking. Tax/audit nightmare. Recipients aren't vetted. |
| **B. Platform distributes** ✅ | Verified recipients only. Full audit trail. Donor sees real impact ("Sarah in Detroit redeemed your $10 Walmart coupon"). Brands trust the funnel. | Donor doesn't get the warm-fuzzy of "handing" a gift. Solved with rich impact updates. |

Your whole brand (verified families, Stripe-for-charity, transparency) only works with **B**. The current code already assumes B — it just isn't wired end-to-end.

---

## Question 2: Do we *actually* buy a real coupon when a donation comes in, or generate a placeholder?

**Today (the bug):** The webhook calls `generateCouponCode()` — random 8 chars like `K7MP2QXR`. **It's fake.** Nothing was bought. A recipient who "redeems" it at Walmart gets nothing.

**Two real paths forward:**

### Path A — Pooled procurement (recommended for launch)
- Donations accumulate in your Stripe balance.
- You buy real gift cards from each brand in **bulk batches** (e.g., weekly), via Tango Card / Tremendous / Giftbit APIs (these aggregate Walmart/Target/Amazon/DoorDash/etc. and give you one API).
- An admin job (or auto cron) ingests purchased codes into `coupons` table, marking them `available`.
- Recipients claim from the real inventory.
- **Pro**: lower fees (bulk discounts, fewer API calls), works today with manual ops, you can float a small inventory.
- **Con**: there's a delay between donation and a real code existing. We mark donor-facing status as "Funded → Coupon being procured → Ready → Claimed → Redeemed".

### Path B — Just-in-time procurement (later)
- Webhook fires → immediately call Tango/Tremendous → code returned → store in `coupons` row linked to the donation.
- **Pro**: instant 1:1 link from donation to a real code.
- **Con**: every donation = an API call + possible failure to handle, higher per-unit fees, harder to refund.

**Recommendation: ship Path A now**, migrate hot brands to Path B once volume justifies it. Both use the same DB schema, so no rework.

---

## Question 3: How do donors get notified when "their" coupon is redeemed?

We add a real lifecycle to each coupon and an attribution chain back to the donor:

```
donation ──┬─→ coupon (procured, available)
           │       │
           │       └─→ claimed by recipient
           │              │
           │              └─→ redeemed at store
           │
           └─→ donor gets: in-app notification + email at each milestone
```

Notifications fire at three moments:
1. **Coupon created** — "Your $10 Walmart coupon is live and waiting for a family."
2. **Coupon claimed** — "A verified family in Texas just claimed your coupon."
3. **Coupon redeemed** — "Maria used your $10 Walmart coupon today. Thank you."

Privacy: recipient name/photo only shown if they opt-in; default is region + first name.

---

## Plan (build order)

### Step 1 — Lifecycle & attribution (DB)
- Add `coupon_status` enum values: `pending_procurement | available | claimed | redeemed | expired | refunded`.
- Add `donor_id` (denormalized from donation) + `claimed_at`, `redeemed_at` (already partially there) to `coupons`.
- Add `notifications` rows trigger: when coupon status flips, insert a notification for `donor_id`.
- New table `coupon_procurement_batches` (admin-only): tracks bulk gift card purchases — vendor, brand, amount, count, codes_uploaded_at.

### Step 2 — Fix the webhook
- Stop generating fake codes immediately. Instead, insert coupons with `status = 'pending_procurement'` and `code = NULL`.
- Coupons become `available` only when a real code is attached (admin upload or API).

### Step 3 — Procurement admin tooling (`/admin/procurement`)
- Lists all `pending_procurement` coupons grouped by brand and value.
- "Bulk upload codes" — admin pastes/uploads CSV of real codes from Tango/Tremendous/manual purchase, system attaches them FIFO to oldest pending coupons, flips status to `available`, fires donor notifications.
- (Later) "Auto-procure" button per brand → calls Tango API.

### Step 4 — Recipient redemption confirmation
Two options for "how do we know it was redeemed?":
- **Self-report**: recipient marks "I used this" in their portal — fast, trust-based, fine for small grants.
- **Brand API**: Tango/Tremendous webhooks tell us when a code is redeemed at the brand — gold standard, requires using their issuance API.

We support both: Tango-issued codes use webhook; manually uploaded codes use self-report with a "swipe to confirm redemption" UX in `RecipientCoupons`.

### Step 5 — Donor notifications + impact feed
- In-app: bell icon already has `notifications` table; we surface coupon lifecycle events there.
- Email: extend the existing transactional email system to send "Your coupon was redeemed" with recipient region + first name + brand.
- Donor dashboard gets a new **"My Coupons"** section: timeline of every coupon spawned by their donations with current status.

### Step 6 — Admin Donations page improvements
Already exists. Add a "Coupons spawned" sub-table per donation showing each coupon's current status + which recipient claimed it (admin-only PII).

---

## Honest caveats

1. **You don't have a gift card vendor wired up yet.** Until you sign up with Tango/Tremendous (or buy cards manually), Step 3's "upload codes" path is the only working flow. That's fine for launch — admin manually buys and uploads. But you cannot honestly tell donors "real coupon issued" until that pipeline exists.
2. **Self-reported redemption is gameable** (recipients could lie). Acceptable while small; switch to API redemption tracking once volume matters.
3. **Existing 10 donations** have fake codes already in `coupons`. We'll mark them all `pending_procurement` in a migration so the new pipeline is clean — admin reissues real codes via the procurement page.
4. **Notifications add email volume** — 3 emails per coupon × multiple coupons per donation can be noisy. We'll batch into a daily digest by default with a per-event opt-in.

---

## Technical artifacts the plan will produce

- 1 DB migration (status enum expansion, columns, triggers, new table)
- 1 webhook update (stop generating fake codes)
- 1 new admin page `/admin/procurement`
- 1 new donor section "My Coupons"
- 1 update to `RecipientCoupons` (confirm-redemption UX)
- 2 notification templates (in-app + email) for claim/redeem events
- Backfill script for the existing 10 donations

