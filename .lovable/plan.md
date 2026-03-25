

## Weekly Newsletter System via Resend

You already have Resend set up with your verified `coupondonation.com` domain. Resend's free tier gives you 100 emails/day (3,000/month) -- more than enough for 100 emails/month. You can use a new sender like `newsletter@coupondonation.com` or `updates@coupondonation.com` -- no extra Resend config needed since your domain is already verified.

### What gets built

**1. Database tables (migration):**
- `email_subscribers` -- email, name, subscribed (boolean), subscribed_at, unsubscribed_at, source (manual/signup/import)
- `email_campaigns` -- subject, html_content, preview_text, sender_email, status (draft/sending/sent/failed), sent_count, total_recipients, created_at, sent_at, created_by

**2. Edge Function: `send-newsletter`**
- Accepts a campaign ID
- Fetches all active subscribers in batches of 50
- Sends via Resend API with the campaign's HTML content
- Includes an unsubscribe link in every email (CAN-SPAM compliance)
- Updates campaign status and sent_count as it progresses
- Rate-limited to stay within Resend's free tier (100/day)

**3. Edge Function: `handle-newsletter-unsubscribe`**
- Token-based unsubscribe endpoint
- Marks subscriber as unsubscribed
- Returns confirmation

**4. Admin page: `/admin/newsletters`**
- **Campaigns list**: View all campaigns with status, sent count, date
- **Compose**: Rich subject line, HTML editor (textarea with preview), sender email selector
- **Subscriber management**: View subscribers, add manually, import from existing users table, remove
- **Send**: Preview email, then send to all active subscribers
- **Stats**: Total subscribers, active, unsubscribed

**5. Unsubscribe page: `/unsubscribe`**
- Reads token from URL, confirms unsubscribe, shows branded confirmation

### Files changed

1. **New migration** -- Create `email_subscribers` and `email_campaigns` tables with RLS (admins full access, public can insert to subscribers for self-signup)
2. **New: `supabase/functions/send-newsletter/index.ts`** -- Batch email sender using Resend
3. **New: `supabase/functions/handle-newsletter-unsubscribe/index.ts`** -- Unsubscribe handler
4. **New: `src/pages/admin/AdminNewsletters.tsx`** -- Full admin campaign + subscriber management
5. **New: `src/pages/Unsubscribe.tsx`** -- Public unsubscribe page
6. **`src/App.tsx`** -- Add routes for `/admin/newsletters` and `/unsubscribe`
7. **`src/components/layout/DashboardLayout.tsx`** -- Add "Newsletters" to admin sidebar
8. **`src/pages/admin/AdminDashboard.tsx`** -- Add newsletters action card
9. **`supabase/config.toml`** -- Add `send-newsletter` and `handle-newsletter-unsubscribe` with `verify_jwt = false`

### Sender email

Since your domain `coupondonation.com` is already verified on Resend, you can send from any address on that domain. The newsletter will use `updates@coupondonation.com` (configurable per campaign). No extra Resend setup needed -- just pick the from address when composing.

### Safety guardrails
- Daily send limit enforced in the edge function (max 100/day on free tier)
- Unsubscribe link in every email (legally required)
- Duplicate send prevention via campaign status tracking
- Admin-only access to send

