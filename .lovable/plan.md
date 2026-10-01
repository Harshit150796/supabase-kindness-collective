# Admin CRM Portal Rebuild — Plan

## A. Audit (verified this turn) and what still needs confirming

**Routes today** (all `ProtectedRoute allowedRoles=['admin']` + strict GeoGuard, rendered inside the shared user `DashboardLayout`):
`/admin` (Overview stats + action cards + payment processor toggles), `/admin/users`, `/admin/verifications`, `/admin/coupons`, `/admin/procurement`, `/admin/fundraisers`, `/admin/donations`, `/admin/analytics`, `/admin/content`, `/admin/stories`, `/admin/testimonials`, `/admin/blog`, `/admin/faq`, `/admin/newsletters`, `/admin/moderation`. Moderation is reachable from the Overview card but is missing from the sidebar.

**The "Donors" bug.** There is no Donors page or route. The only donor view in admin is the "Unique Donors" count inside `/admin/donations`, which is calculated in the browser. The likely problem is what the founder sees when clicking a "Donors" area that doesn't exist, or the Donations page loading every row. **Not yet reproduced. Phase 1 starts by reproducing it** as an admin (screenshots plus console and network logs) before any fix is named.

**Known patterns to fix** (seen in the code):
- Overview, Users and Donations load whole tables into the browser. Overview pulls every coupon row just to count "available" ones, so it breaks past 1,000 rows.
- Users loads all profiles and all roles, then joins them in the browser.
- No error states. Loading is plain text. Fundraiser edit still exposes stored `donors_count`, which can drift.
- Hardcoded colours like `text-blue-600` break the design rules.

A full per-page console, network and RLS sweep is step 1 of Phase 1.

**What a hard delete of a fundraiser would do today** (checked against the live foreign keys):
- `donations.fundraiser_id` has no ON DELETE action, so **the delete fails** if any donation references the fundraiser. Financial rows are safe by accident, not by design.
- If the fundraiser has no donations, the delete **cascades and permanently destroys**: `fundraiser_images`, `fundraiser_team`, `conversations` (plus their `messages` and `conversation_reads`), `fundraiser_comments` (plus `comment_likes`), and `fundraiser_updates`.
- `coupons` link to donations, not fundraisers. `donation_brands` cascade from donations. `gift_codes` block a donation delete.
- `content_reports`, `blocked_attempts` and `notification_queue` store `fundraiser_id` with no foreign key, so they would be left pointing at a missing fundraiser.

**How new fundraisers start:** `ApplyRecipient.tsx` inserts with `status: "active"` on one path and `"pending"` on another. Live counts: 10 active, 1 paused, 0 pending. Approval exists only as manual status edits in `/admin/fundraisers`.

**Roles:** `user_role` enum has recipient, donor and admin (`app_role` is a duplicate enum). `has_role(uuid, user_role)` is the security check.

**Email:** Resend works. Senders are `notifications@coupondonation.com` (`NOTIFY_SENDER`) and `verify@coupondonation.com`. The shared `renderNoticeEmail` layout is in `_shared/email-layout.ts`.

**Extensions:** `pg_cron`, `pg_net` and `supabase_vault` are all installed. `notify-dispatch` and `email-scheduler` are not scheduled.

## B. Portal shell
- A new `AdminLayout`, separate from the user dashboard. It has:
  - A collapsible left sidebar with these groups: Overview; Operations (Fundraisers, Donations, Donors, Recipients & Applications, Coupons, Procurement); Trust (Moderation); Work (Tasks, Notifications); Content (Site content, Stories, Testimonials, Blog, FAQ, Newsletters); Admin (Team & Access, Audit log, Settings).
  - A top bar with breadcrumbs, a Cmd/Ctrl+K command palette, a notification bell and the user menu.
- A shared `DataTable` built on the existing shadcn table. It covers:
  - Paging, sorting and filtering done on the server, with filters stored in the URL.
  - Debounced search, column visibility, saved views (`admin_saved_views`), and bulk-select actions.
  - CSV export, built on the server in chunks.
  - Sticky header, tabular numbers, skeleton, empty and error states with retry.
- Shared parts: detail drawer with tabs (or a full page for fundraisers), status badges, a confirm dialog (typed confirmation for destructive actions), toasts, and keyboard shortcuts (`g f` fundraisers, `g t` tasks, `/` search, `?` help).
- Styling: ink plus logo green, Instrument Sans for data, serif only for page titles, no yellow or gold. Dense layout on desktop, tables collapse to cards on mobile.

## C. Modules
1. **Overview:** raised today, this week and this month; donation count, active fundraisers, pending approvals, open reports and open tasks — all from completed donations through one admin RPC. A "needs attention" queue, an activity feed from the audit log and new records, and a 30-day trend chart.
2. **Fundraisers:**
   - Table filtered by status: pending, active, paused, rejected, archived, featured.
   - Detail tabs: Overview, Donations, Updates, Comments, Team, Conversations (metadata only, never message bodies by default), Reports, History.
   - Actions: approve, reject with a reason (emails the organizer), edit, pause/resume, feature with ordering, archive and restore.
   - Permanent delete only under the rules in section E.
3. **Donations:** read-only. Filters: status, date range, amount, retailer, fundraiser, provider. The detail view shows the brand split and coupon trail. CSV export. No refund or charge actions.
4. **Donors:** an `admin_donor_summary` RPC groups completed donations by donor_id, or by lower(email) for guests. It shows total given, donation count, first and last gift, and fundraisers supported. Anonymous gifts are flagged and shown as "Anonymous" by default in lists.
5. **Recipients & Applications:** the existing applications and verifications flows moved into the shell, plus auto-tasks.
6. **Moderation:** blocked attempts, content reports, flagged messages and hidden comments, with resolve and dismiss actions.
7. **Tasks:**
   - Fields: title, description, assignee, priority (urgent/high/medium/low), due date, status (to do/in progress/blocked/done), and a link to a fundraiser, donation, donor, report or application.
   - List and kanban views, "My tasks", overdue highlighted, comments on each task.
   - Auto-tasks are created by triggers on `fundraisers` (insert or change to pending), `content_reports` (insert) and `recipient_applications` and `recipient_verifications` (insert/pending). None of these are payment tables. A unique key on the source record stops duplicates.
8. **Notifications:** an in-app centre (`admin_notifications`) plus settings for which events email which recipients (`admin_notification_settings`). Default recipient: connect.coupondonation@gmail.com.
9. **Content:** the existing CMS pages moved into the shell. Their fetches get error handling and paging.
10. **Team & Access:** list team members, grant and revoke admin, staff or viewer (admin only), and an audit-log viewer with filters and before/after values.

## D. Email dispatcher
- A new edge function, `admin-notify-dispatch`. It does nothing on donations, coupons or the webhooks.
- It reads, through a service-role client, fundraisers created after the watermark and donations with status completed or succeeded created after the watermark.
- **Exactly-once:** a table `admin_email_events(kind, source_id, unique(kind, source_id), sent_at, resend_id)`. Rows are claimed with `INSERT … ON CONFLICT DO NOTHING`, then sent. Failed sends stay unsent and are retried next run. The watermark sits in `admin_dispatch_state`, with a 10-minute look-back overlap to catch late-completed donations.
- **Digest:** one event sends a single email. Two or more events send one digest email per run.
- **Contents:** donor display name ("Anonymous" when flagged), amount, fundraiser or retailer, time, and an admin link. Never donor email, phone, address or payment details.
- Sent from `CouponDonation <notifications@coupondonation.com>` to the recipient list in settings.
- **Auth:** a random dispatcher secret stored in Supabase Vault, plus the same value as an edge-function secret (`DISPATCH_SECRET`). The function rejects requests without the header. `notify-dispatch` gets the same gate, and its current open "safe to call publicly" mode is closed.
- **Schedule:** `pg_cron` every 5 minutes (288 runs a day each) calls both functions through `pg_net`, reading the secret from Vault. `email-scheduler` is scheduled the same way.
- **Verification:** send a real test digest to connect.coupondonation@gmail.com, then poll Resend `GET /emails/{id}` until `last_event = delivered`. Report the ID and status. If the status stops at "sent", report it as unverified.

## E. Safety
- **Archive, don't delete.** New `fundraisers.archived_at` and `archived_by` columns. Archiving sets status to `archived`. Public reads already filter on status (active/pending/paused/completed), so archived pages disappear from the public site. Every public RPC and RLS policy will be re-checked to confirm.
- **Permanent delete:** an `admin_hard_delete_fundraiser` RPC that is admin-only, refuses when any donation or coupon exists, requires the typed slug, and writes to the audit log.
- **Audit log:** `admin_audit_log` records actor, action, table, record id, before/after jsonb and time. It is append-only: insert only through the `admin_*` RPCs, admins can read it, nobody can update or delete it.
- **Roles:** add `staff` and `viewer` to `user_role` (additive enum values). New helpers `is_admin_staff(uid)` (admin or staff) and `is_admin_viewer(uid)` (any of the three).
  - New admin read policies are added alongside the existing admin ones.
  - All writes go through security-definer `admin_*` RPCs or edge functions that re-check the role. Staff cannot hard-delete or change roles or settings. Viewers can only read.
  - The route guard gets a new `adminAny` level.
- **Approval setting:** `admin_settings.require_fundraiser_approval`, default **false**, so behaviour stays as it is today. When the founder turns it on, an insert trigger on `fundraisers` changes new rows to `pending`.
- Additive-only database changes. Payments, webhooks, checkout, coupon issuance, the public site and the tree are untouched.

## F. Phases (tick roadmap.md at each boundary)
1. Reproduce the Donors bug and run the full admin sweep. Then: roles, audit log, `admin_settings`, `AdminLayout`, `DataTable`, command palette shell, move every existing page into the shell, and fix the bugs found.
2. Fundraisers module: archive and restore, approve and reject, feature ordering, detail tabs, approval setting.
3. Donations and Donors modules, plus the admin RPCs with paging.
4. Tasks and auto-tasks.
5. Notification centre, settings, both dispatchers, Vault secret, cron schedules, and the delivery check.
6. Remaining modules: moderation, recipients, content, team and access, audit viewer, Overview KPIs.
7. End-to-end verification.

Each phase ends with a clean build and passing checks. Edits are batched to fit within 100 actions per turn.

## G. Verification
- **Role tests**, using SQL as admin, staff, viewer and an ordinary user:
  - Staff hard delete and role change are rejected.
  - Viewer is rejected on every mutation.
  - An ordinary user is blocked from every `admin_*` RPC, every admin function and every `/admin` route.
- **Donors bug:** screenshots before and after.
- **Every module** exercised as an admin with a minted session where possible. Steps that can't be signed in for this external backend are marked unverified.
- **Email:** Resend delivered check as described in D.

## H. Risks and recommendations
- **Sign-in for checks:** an admin session can't be minted automatically for this external backend, so logged-in browser checks may be unverified. SQL role tests stand in for them.
- **Adding enum values** can't be undone without care, but it is additive and safe.
- **Cron cost:** three 5-minute jobs use a little database time. Recommendation: one combined cron that calls a single dispatcher fanning out to all three.
- **Late-completed donations:** the look-back overlap plus unique markers prevent misses and duplicates.
- **Gmail filtering:** Gmail may filter the digest. Check that SPF and DKIM pass.
- **Not recommended:**
  - Showing message bodies to staff (privacy; keep it admin-only and audited).
  - Bulk hard delete.
  - Editing stored `amount_raised` or `donors_count` (show the computed totals instead and keep the 4 discrepancies as a task).
  - Admin refunds or charges.
  - Building a separate "staff" app instead of using roles.
- **Mismatched pending path:** `ApplyRecipient` inserts `pending` on one path. Flag it to the founder and leave it unchanged.
