# Fundraiser page rebuild, team fundraising and safe messaging

## 1. Audit (verified)

- `/f/:slug` (PublicFundraiser.tsx) does `select *` on fundraisers, then queries `donations` and `profiles` directly from the browser.
- Database access rules: `donations` can only be read by the donor or an admin, and `profiles` only by the owner or an admin. **So visitors currently see no supporter list and a generic "Organizer" name.** The new page must read these through safe public functions instead.
- `fundraisers`: only the owner (`user_id`) can update. There are no beneficiary-name, co-organizer, messaging, comment, update or report fields or tables.
- Reusable pieces: FundraiserGallery and ImageUploadModal (gallery), ShareModal (579 lines, has QR code), `src/data/impactStories` and UpdatesTimeline (local only), SEO component, shared motion with useMotionPreference.
- Manage pages: `/fundraiser/:id` (FundraiserDashboard) and `/my-fundraisers`. Admin: `/admin/fundraisers` plus the newsletter and verification pages.
- Email: Resend through edge functions. There is a shared email layout, `email_subscribers.unsubscribe_token`, `handle-newsletter-unsubscribe` and an `email-scheduler` function. These are reused for notification emails.
- `coupons.donation_id` links each coupon to its donation, so totals for coupons created and redeemed per fundraiser can come from `donations` joined to `coupons`. Only totals are ever shown.

## 2. Schema (additive only)

New columns on `fundraisers` (all nullable or defaulted): `beneficiary_display_name text`, `show_beneficiary_name bool default false`, `allow_messages bool default true`, `story_format text default 'plain'`.

New tables. Each one gets GRANTs, RLS and timestamps:

- `fundraiser_team` (fundraiser_id, user_id null until accepted, invite_email, role organizer|co_organizer, status pending|accepted|revoked, invited_by, invite_token_hash). A trigger adds the creator as `organizer`, and the team is backfilled for existing fundraisers.
- `conversations` (fundraiser_id, supporter_id, last_message_at, status open|blocked, blocked_by). Unique on (fundraiser_id, supporter_id).
- `messages` (conversation_id, sender_id, body, original_body_hash, flags text[], status delivered|redacted|blocked).
- `conversation_reads` (conversation_id, user_id, last_read_at).
- `message_reports` and `fundraiser_reports` (reporter, target, reason, details, status, admin_notes).
- `blocked_attempts` (sender, fundraiser, matched_rules, created_at). Admin-only. Stores a hash of the blocked text plus a short excerpt with matches masked.
- `fundraiser_comments` (fundraiser_id, user_id, body, is_hidden, hidden_by) and `comment_likes` (unique comment+user), plus `comment_reports`.
- `fundraiser_updates` (fundraiser_id, author_id, title, body, image_url, notify_donors).
- `notification_queue` (recipient_user_id, kind, ref_id, scheduled_for, sent_at). Used to throttle emails.
- `messaging_preferences` (user_id, email_notifications bool). Email notifications also respect `email_subscribers.subscribed`.

Security-definer helpers:

- `is_fundraiser_team(fid, uid)` and `is_fundraiser_organizer(fid, uid)`.
- `has_completed_donation(fid, uid)`, which counts completed or succeeded donations only.
- Public read functions:
  - `get_fundraiser_public(slug)` returns the organizer's first name and city/state only, the beneficiary name only when opted in, and the team's display names.
  - `get_fundraiser_donations(fid, limit, order recent|top)` returns the name, or "Anonymous" when the donor chose that.
  - `get_fundraiser_coupon_trail(fid)` returns totals only: amount converted and amount redeemed.
  - `get_fundraiser_retailers(fid)` returns brand names only.

Access rules:

- **Conversations and messages:** readable only when you are the supporter, a team member with accepted status, or an admin. Nobody can insert directly; everything goes through an edge function using the service role.
- **Team:** only the organizer can invite or remove people. A co-organizer can update only their own row, for example to leave the team. The organizer row cannot be deleted by co-organizers.
- **Updates:** anyone can read them on active fundraisers; only team members can write.
- **Comments:** anyone can read comments that are not hidden. Adding a comment requires a completed donation to that fundraiser. Hiding a comment is limited to team members, using a column-limited update function.
- **Reports:** a signed-in user can file a report and read their own; admins can read all.
- **Key protection:** co-organizers get no update access to `fundraisers` at all, because the existing owner-only rule stays as it is. Beneficiary, recipient and payout fields therefore stay owner/admin only at the database level.

Realtime is turned on for `messages`, `conversations`, `fundraiser_comments` and `donations`. For `donations`, the browser listens through a filtered public broadcast fed by a trigger that sends only the amount, display name and anonymity flag, because donations rows themselves are not publicly readable.

## 3. Edge functions (new)

- `send-message`: requires sign-in and checks the user's token.
  1. Rejects the message if the fundraiser has messages turned off or the conversation is blocked.
  2. Rate limits: up to 5 new conversations and 30 messages per user per hour. Messages are capped at 2,000 characters.
  3. Removes HTML.
  4. Runs the safety rules on the server:
     - **Block:** Venmo, Cash App/$cashtag, Zelle, PayPal, Western Union, MoneyGram, wire, gift-card code requests, crypto words and BTC/ETH address patterns, IBAN, and routing/account number patterns. The sender sees a plain explanation and the attempt is logged.
     - **Redact:** emails and phone numbers are replaced with "[removed]", and the message is flagged.
  5. Saves the message and queues a notification.
  - Shares a `_shared/moderation.ts` file with `post-comment` and `post-update`.
- `team-invite` and `team-accept`: send a hashed-token invite email through Resend; accepting checks that the signed-in email matches the invite.
- `notify-dispatch`: runs on the existing email-scheduler cron pattern or pg_cron every 5 minutes. It sends one digest per recipient after 10 minutes of inactivity in a thread, skips anyone who has unsubscribed, and includes an unsubscribe link.
- `share-fundraiser`: a public endpoint (`?slug=`). It returns HTML with og/twitter tags (title, story excerpt, cover image) and canonical tags, then sends humans to `coupondonation.com/f/:slug` via meta refresh and JS. All share buttons use this URL.

## 4. Public page architecture

```text
Desktop (ink headings, neutral/soft-green bands)
[Title]
[Gallery: arrows, dots, "1 of N", swipe]        [Sticky panel]
[Organizer for Beneficiary · Coupon-locked]     ring % (animated)
[Summary · donor count · avatar stack]          $X raised of $Y · N donations
[Story: rich text, Read more]                   Donate (green) / Share (ink)
[Donate / Share]                                5 recent · See all · See top
[Coupon trail: $ converted · $ redeemed]        Retailer chips
[Donations list + See all/See top modals]
[Share card preview + share sheet]
[Organizer & team cards · Message button]
[Updates timeline]
[Words of support: comments, likes, report]
[Created date · category · Report fundraiser]
[Three truthful trust pillars]
[Ink full-bleed "More fundraisers": location filter + carousel]
Mobile: single column, panel content inline after title, sticky Donate/Share bar.
```

Components go in `src/components/fundraiser/campaign/`: CampaignHeader, OrganizerLine, StoryBody (safe markdown subset: bold, lists, links; no HTML), DonationPanel, DonationsModal, CouponTrail, RetailerChips, SharePanel, ShareCardPreview, TeamCards, MessageDialog, UpdatesTimeline (database version), CommentsSection, ReportDialog, TrustPillars, MoreFundraisersBand, JustDonatedToast and MobileDonateBar.

All motion uses the existing shared primitives and useMotionPreference.

The badge says "Coupon-locked · Traceable" and links to a short explanation. It never claims a guarantee, protection or refund, and no share statistics are shown.

Colour: add an `--ink` token (hsl 123 20% 7%) plus `ink-foreground`. Ink is used for Share, strong headings and the dark band. Donate stays logo green, and blue is used only for verification. Recorded in AGENTS.md.

## 5. Organizer tools

- `/messages` inbox: a thread list and a conversation view with live updates, block, report, and unread counts.
- An unread badge in the Navbar, based on `conversation_reads`.
- The fundraiser dashboard (`/fundraiser/:id`) gets new tabs:
  - **Team:** invite by email, pending invites, remove (organizer only).
  - **Updates:** post with an optional image and a "notify donors" toggle.
  - **Comments:** hide or unhide.
  - **Settings:** messaging toggle, beneficiary name opt-in, story formatting.
- Co-organizers see the dashboard without the edit-details or beneficiary sections. The database enforces this too.
- Admin: a new `/admin/moderation` page with blocked attempts, flagged or redacted messages, message/comment/fundraiser reports, and resolve or hide actions. It is linked from the AdminDashboard grid.

## 6. Phases and stopping rule

1. **Data and security:** migration, helper functions, access rules, realtime and moderation module. Unit-test the safety patterns as Deno tests, and run SQL checks with three users.
2. **Public page:** rebuild using the public read functions, motion and the ink token.
3. **Organizer tools:** inbox, badge, dashboard tabs, admin moderation.
4. **Sharing:** `share-fundraiser` endpoint, share sheet (copy, Facebook, X, WhatsApp, Messenger, LinkedIn, email, SMS, Web Share, QR download), check with a crawler user-agent.
5. **End-to-end check:**
   - A signed-in supporter sends a message, and the organizer sees it arrive live.
   - The organizer receives the digest email and replies; the supporter sees the reply.
   - A message containing "venmo @x" is blocked and logged; a message with a phone number is delivered as "[removed]" and flagged.
   - A third user gets no rows back for the thread.
   - Check at 390px and 1440px.

**Stopping rule:** each phase ends with a clean build and its checks passing. If an access-rule or safety test fails, stop and fix it before starting the next phase. The work is done when every phase 5 check passes. Any check that cannot be run, such as email to a test inbox, is reported as unverified rather than claimed as done.

## 7. Risks

- **Payments:** no changes to checkout, webhooks, the Square/Stripe choice or coupon issuance. The donations realtime trigger is a separate notify-only trigger. It is wrapped in exception handling so it can never block a donation write.
- **Existing data:** additive only. The team backfill inserts rows and changes nothing existing.
- **Compliance:** messaging is the biggest risk. Mitigated by server-side blocking, logging, the admin queue and plain policy text in the message box. The pattern rules will miss some attempts; reports and admin review are the backstop.
- **Privacy:** only totals for coupon activity; no per-donation retailer shown publicly; organizer shown as first name plus city/state; beneficiary name hidden by default; email and phone numbers never shown.
- **Performance:** public read functions are indexed on fundraiser_id; the carousel and comments load when scrolled into view; realtime channels are cleaned up properly.
- **Email volume:** throttled digests, and anyone who has unsubscribed is respected.

## 8. Recommended not to build

- **Any protection or guarantee badge or refund promise:** no such program exists.
- **Share-impact statistics:** there is no real data behind them.
- **Messages between supporters, or anonymous messaging:** spam and scam risk.
- **Attachments in messages:** a channel for malware and personal data. Updates support images instead.
- **A public per-donation coupon trail:** it would expose where recipients shop. Donors see their own trail privately in their existing dashboard.
- **Letting co-organizers edit fundraiser details:** the database keeps this owner-only.
- **"Top donor" leaderboards that reveal names of anonymous donors:** the top list masks them exactly.
