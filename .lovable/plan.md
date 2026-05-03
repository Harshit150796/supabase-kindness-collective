
# Promotional Email Management System

You already have a working baseline at `/admin/newsletters` (tables `email_campaigns`, `email_subscribers`, edge function `send-newsletter` via Resend from `updates@coupondonation.com`). The plan below upgrades it into a full marketing portal — keeping everything inside the existing admin area so you have one place to upload, send, schedule, track, and follow up.

I'll present **3 design options first**, then a concrete recommended build.

---

## Option A — Build it all in-house in the Admin Portal (recommended)

Extend `/admin/newsletters` into a 5-tab portal: Campaigns, Templates, Subscribers, Automations, Analytics. Resend stays the sender. Tracking (opens/clicks/unsubscribes/bounces) is captured via Resend webhooks + a tracking redirect edge function. Scheduling/reminders run on a `pg_cron` job hitting an edge function every minute.

- Pros: zero extra cost, fully integrated with your Supabase data (donors, fundraisers), full control of branding & deliverability rules already memorized.
- Cons: you maintain it. Reasonable scope — Resend handles the hard parts (delivery, DKIM, suppressions).

## Option B — Hybrid: in-house composer + Resend Broadcasts API

Use Resend's hosted Broadcasts/Audiences for sending and stats; the admin UI just creates/uploads broadcasts and reads stats back. Less code, but ties analytics to Resend dashboard, weaker segmentation against your own DB, and Resend Broadcasts has its own subscriber model that has to stay in sync.

## Option C — Plug in a dedicated tool (Mailchimp / Loops / Customer.io)

Best deliverability + drag-drop editors + automations out-of-the-box. We'd only build a thin "push subscribers to provider" sync. Downsides: monthly cost, second login, fragmented user data, harder to tie a campaign to a donor's behavior in your DB.

**Recommendation: Option A.** You already have ~90% of it. Below is what to add.

---

## Recommended Build — Admin Newsletters v2

### 1. New tabs at `/admin/newsletters`
```
[Campaigns] [Templates] [Subscribers] [Segments] [Automations] [Analytics]
```

### 2. Campaigns tab (upgraded)
- **Upload HTML** (drop a `.html` file or paste) — already partially there.
- **Choose template** dropdown (saved reusable layouts).
- **Audience selector**: All active / Segment / Single test address.
- **Schedule for later** (date+time picker → stored on row, cron picks it up).
- **Send test** to one address before launch.
- **A/B subject line** (optional v2): two subjects, 10% sample, winner sends to rest.
- **Per-campaign stats panel**: sent / delivered / opens / unique opens / clicks / unsubscribes / bounces / complaints + click map per link.

### 3. Templates tab
- CRUD library of reusable HTML templates with `{{name}}`, `{{first_name}}`, `{{unsubscribe_url}}`, `{{coupon_count}}` etc. tokens.
- Live preview with sample data.

### 4. Subscribers tab (upgraded)
- Bulk CSV import with column mapping + dedupe.
- Tag/label subscribers (e.g. `donor`, `recipient`, `lapsed_30d`).
- Per-subscriber timeline: every campaign sent, opened, clicked, replied.
- Manual unsubscribe / re-subscribe / hard delete (GDPR).

### 5. Segments tab
Saved filters that resolve to a live subscriber list, e.g.:
- "Donors who haven't donated in 30+ days"
- "Recipients with no claimed coupons"
- "Subscribers who opened last campaign but didn't click"
Stored as JSON filter spec; resolved at send time.

### 6. Automations tab (reminders & drips)
Visual list of "When X → wait Y → send template Z" rules. Examples:
- Welcome series: signup → Day 0 welcome → Day 3 how-it-works → Day 7 first-donation nudge.
- Donation reminder: 30 days since last donation → reminder template.
- Abandoned fundraiser: created draft, didn't publish in 24h → nudge.
- Recipient onboarding: verified → claim-your-first-coupon email.
Each automation = a row in `email_automations`; a cron worker evaluates triggers hourly and enqueues sends (writes to `email_campaigns` with `audience_type='single'`).

### 7. Analytics tab
- Org-wide KPIs: total sent (30d), avg open rate, avg click rate, unsubscribe rate, complaint rate, top-performing subjects, best send-time heatmap.
- Per-link CTR table.
- Bounce / complaint list with reason.

### 8. Reply capture
Resend can be configured with a `reply_to` address. Two ways to capture replies:
- **Simple:** set `reply_to: support@coupondonation.com` and read replies in your inbox (no UI).
- **In-portal (recommended later):** add an inbound route — point `replies@coupondonation.com` MX to Resend Inbound (or Cloudflare Email Routing → webhook) → store in `email_replies` table → "Inbox" sub-tab on the campaign showing threaded replies per subscriber.

---

## Technical details

### New / updated tables (migrations)
- `email_templates` — id, name, subject, html, tokens[], preview_text, created_at.
- `email_segments` — id, name, filter_spec jsonb, last_count, last_resolved_at.
- `email_automations` — id, name, trigger_type, trigger_config jsonb, template_id, delay_minutes, active, last_run_at.
- `email_automation_runs` — id, automation_id, subscriber_id, scheduled_for, sent_at, status. (Prevents double-send.)
- `email_events` — id, campaign_id, subscriber_id, event_type (`delivered|opened|clicked|bounced|complained|unsubscribed|replied`), url (for clicks), created_at, metadata jsonb. **Single source of truth for analytics.**
- `email_replies` — id, campaign_id, subscriber_id, from_email, subject, body_text, body_html, received_at. (Phase 2.)
- Extend `email_campaigns`: add `template_id`, `scheduled_for timestamptz`, `audience_type` (`all|segment|single`), `segment_id`, `test_recipients text[]`, `reply_to text`, `tracking_enabled boolean default true`, `ab_variant_of uuid`.
- Extend `email_subscribers`: add `tags text[]`, `last_open_at`, `last_click_at`, `engagement_score int`.

All tables: RLS, admin-only via `has_role(auth.uid(),'admin')`. Service role used inside edge functions.

### Edge functions
- `send-newsletter` (existing) — refactor to: render template + tokens, rewrite all `<a href>` through tracking redirect, inject 1×1 open pixel, write `email_events` row on send, respect `suppressed`/`unsubscribed`/`complained`. Batch with current 100/day Resend limit handling.
- `email-track-open` — GET `/track/open/:event_token` → returns 1×1 gif, inserts `opened` event.
- `email-track-click` — GET `/track/click/:event_token?u=<encoded>` → inserts `clicked` event, 302 to original URL.
- `resend-webhook` — POST receiver for Resend events (`email.delivered|bounced|complained|opened|clicked` if you choose to use Resend's own tracking instead of/alongside ours). Updates `email_events` and flips `email_subscribers.subscribed=false` on hard bounce/complaint.
- `email-scheduler` — cron every minute. (a) Picks `email_campaigns` where `scheduled_for <= now() AND status='scheduled'` and invokes send. (b) Evaluates active automations, enqueues `email_automation_runs`, sends due ones.
- `import-subscribers-csv` (extend existing `import-subscribers`) — accept uploaded CSV via storage signed URL, parse, dedupe, bulk insert.

### Cron
Enable `pg_cron` + `pg_net`, schedule `email-scheduler` every 1 minute (uses anon key + project URL pattern from your knowledge file).

### Storage
New bucket `email-assets` (public) for inline images uploaded from the composer.

### Tracking links + privacy
Each rendered link/pixel uses a per-recipient `event_token = hmac(campaign_id||subscriber_id, secret)` so opens/clicks attribute correctly without leaking IDs in URLs. Add unsubscribe footer + List-Unsubscribe header (Resend supports it) for inbox placement.

### Deliverability guardrails (already in your memory)
- Plain text + HTML body (keep current logic).
- Throttle 200 ms between sends, 100/day Resend cap until limit raised.
- Respect `email_subscribers.subscribed=false`, `suppressed_emails`.
- Auto-disable an automation if bounce > 5% or complaint > 0.3% on its last 100 sends.

### Frontend (admin portal)
- New components under `src/components/admin/newsletters/`: `CampaignComposer`, `TemplatePicker`, `SegmentBuilder`, `AutomationEditor`, `CampaignStats`, `EngagementChart`, `LinkClickTable`, `SubscriberTimeline`.
- Recharts for analytics (already used in `/admin/analytics`).
- Use existing `DashboardLayout`, shadcn `Tabs`, `Dialog`, `Table`, `Badge`.

---

## Phased rollout

**Phase 1 (core promo upgrade)** — `email_templates`, `email_events`, tracking pixels + click redirect, scheduling via cron, per-campaign analytics, CSV import, segment-by-tag. ~most user value.

**Phase 2 (automation)** — `email_automations` + scheduler, welcome series, donation-reminder rule, A/B subjects.

**Phase 3 (replies inbox)** — inbound route, `email_replies`, threaded view.

---

## What I need from you to start Phase 1
1. Confirm Option A and Phase 1 scope.
2. Confirm sender stays `updates@coupondonation.com` and reply-to should be `connect@coupondonation.com` (or another).
3. Confirm we can raise Resend limits beyond 100/day when needed (or keep throttle).
4. Any specific reminder you want pre-seeded (e.g. "30-day donor reactivation")?

On approval I'll implement Phase 1 in one pass: migrations → edge functions → admin UI tabs → cron schedule.
