# Fundraiser dashboard: Coupons, proof-of-impact emails, Used and receipts, donor impact view

## 1. Part 0 audit findings (confirmed by reading FundraiserDashboard.tsx)

| Item | Links to | Result |
|---|---|---|
| Dashboard | no link (`active: true`) | Static highlight only |
| Donations | `#donations` | Works: the donations card has `id="donations"` |
| Transfers | `#transfers` | Broken: no element has `id="transfers"`, so the click does nothing |
| Updates | `#updates` | Broken: no element has `id="updates"`. OrganizerTools is rendered at the bottom of the page with no anchor |

Cash/payout wording found:
- A **"Set up transfers"** button in the progress card. It has no click action and is a payout cue. Remove it.
- Sidebar "Transfers" with a CreditCard icon. Remove it.
- `supabase/functions/stripe-account-diagnose` is an admin Stripe-account diagnostic, not an organizer payout feature. Leave it alone and note it.
- Other "transfer" matches are not payouts: draft hand-off in `draftStorage`, drag-and-drop `dataTransfer`, and copy in Terms/moderation/WhatWeDo. I will reread Terms and WhatWeDo copy for any payout promise and report it, but not change it without approval.
- I found no code that works out withdrawal or transfer balances.

Fix: the sidebar becomes Dashboard, Donations, Coupons, Updates. Each item scrolls to a real anchor: `#donations`, `#coupons` (new section) and `#updates` (a wrapper around OrganizerTools, opening its Updates part). The mobile sidebar closes on click.

## 2. What gets built

### Schema (additive only, no triggers on coupon or donation tables)
- `coupons`: new nullable columns `revealed_at`, `revealed_by`, `used_at`, `used_source` ('owner' | 'provider'), `used_category`, `used_note`, `reveal_reminder_sent_at`.
- `coupon_reveal_log` (coupon_id, user_id, at): records every reveal. Only admins can read it.
- `coupon_receipts` (id, coupon_id, uploaded_by, storage_path, width, height, bytes, hidden_at, hidden_by, created_at). No direct client access; reads go only through server functions.
- `donor_impact_events` (id, donation_id, coupon_id, kind 'received' | 'used', unique(coupon_id, kind), created_at, emailed_at). This is the email queue. The unique key means each coupon can enter it only once per kind.
- `donation_impact_tokens` (donation_id, token_hash, expires_at, created_at). Stores the hashed guest link, valid for 30 days and refreshed with each email.
- `receipt_requests` (coupon_id unique, donor_id, conversation_id, created_at). Allows one request per coupon.
- Each new table follows the same order: create, grant, row security on, policies. All writes are denied to app users; only server functions write.

### Server actions (security-definer, each re-checks permissions and writes admin_audit_log)
- `owner_reveal_coupon(coupon_id)`: only the owner (`fundraisers.user_id`) can call it. Returns the code and link. On the first reveal it sets `revealed_at`/`revealed_by` only if they are still empty, and adds a 'received' event with ON CONFLICT DO NOTHING. Every call is logged.
- `owner_mark_coupon_used(coupon_id, category, note)`: owner only. The coupon must already be revealed. Category comes from a fixed list; the note is up to 140 characters. Adds a 'used' event.
- `get_owner_coupons(fundraiser_id)`: grouped by brand, no codes. Owner and co-organizers can call it. Shows "Coupon being prepared" for pending coupons.
- `get_donation_impact(donation_id)` for signed-in donors, and `get_donation_impact_by_token(token)` for guests. Both return the timeline, category and note, with no codes and no recipient details beyond "First L." and the fundraiser title.
- `admin_hide_receipt(receipt_id)`: audited.
- An edge function, `coupon-receipts`, handles the note check (shared moderation), receipt upload, the GPS check after upload, and short-lived signed URLs (5 minutes). It checks who is asking: the donor of that coupon's donation, the owner, an admin, or a valid guest token. Co-organizers, other donors and anyone else get a 403.
- `fundraiser-actions` gets a new action, `ask_for_receipt`. It uses the existing `send-message` path, so moderation, rate limits, block and report all apply. It sends a templated message with a donation/coupon reference, and the unique key allows one request per coupon.

### Storage
- A new private bucket, `coupon-receipts`, with a 5 MB limit. No public or client read policies; access is only through signed URLs from the edge function. Files are stored at `{fundraiser_id}/{coupon_id}/{uuid}.webp`.

### Receipt privacy pipeline
- In the browser: accept JPEG, PNG, WebP or HEIC. HEIC is decoded where the browser can; otherwise the user gets a clear "please convert to JPEG" message, because no new packages are allowed. Next comes a redaction screen to draw black boxes, with guidance: cover the address, card number, phone and name. The image is then drawn to a canvas and re-encoded as WebP (max 1600 px), which removes all metadata. Up to 3 receipts per coupon.
- On the server: before storing, the edge function rejects any file that contains EXIF/XMP data or GPS tags. WebP chunk names and JPEG markers are checked by hand, with no extra library.

### Dispatcher
- `admin-dispatch` (the existing 5-minute job) gets a step that calls a new `impact-dispatch` function, protected by the same secret. It groups un-emailed events by donation and kind, then sends ONE email per donation per run listing all of those coupons. It marks `emailed_at` and respects `email_subscribers.subscribed` and `messaging_preferences`. Anonymous donors still receive their emails. The recipient address is `donations.donor_email`.
- Reminder: coupons revealed more than 7 days ago, not marked used, with `reveal_reminder_sent_at` still empty, get one in-app notification plus one email to the owner, and the column is then set. No new scheduled job.
- Gift-card provider signal: we have Tremendous order/reward IDs. The plan is to check Tremendous's API for a redemption status on rewards (I will confirm this from their docs while building). If it exists, the dispatcher polls only coupons that are revealed, not used and come from Tremendous, and sets Used with `used_source='provider'`. Codes entered by hand have no signal. No item or location data is ever promised.

### Email templates (in the shared email layout)
- `renderGiftArrivedEmail`: the CouponDonation hands-and-Earth logo in the header (a stable public PNG on coupondonation.com), and a "Delivered" moment with the date and time in ET, labelled. Then one card per coupon with brand, value and fundraiser title, a 4-step timeline (Donated → Coupon created → Received → Used: pending), and the buttons "See your impact" and "Send a thank-you". It never includes the code. Plain-text version included.
- `renderCouponUsedEmail`: category, note, "View receipt" (links to the impact page, never an attachment) and the timeline with Used completed.
- `renderUseReminderEmail` for the owner.
- Copy follows the brand voice: specific and calm, with no claims about what was bought.

### UI
- FundraiserDashboard: the new sidebar, and a new `#coupons` section (`OwnerCouponsSection`) grouped by brand, with logo, value and status. Buttons: Reveal code → code with Copy, the link, and "Received · time". Then "Mark used" opens a dialog with category, note and optional receipts (with the redaction tool). Co-organizers see statuses with "Code visible to the fundraiser owner".
- Donor: DonationCouponsModal and My Impact get a per-donation impact view: timeline, category, note, receipt thumbnails through signed URLs, "Send a thank-you" and "Ask for a receipt" (turned off once used).
- A guest page at `/impact/:token` shows the same view read-only. Messaging there asks the guest to sign in with the same verified email, reusing the Gold Coins guest-claim pattern.
- Messages: conversations started from a donation show a "Re: $20 DoorDash coupon · donation of {date}" reference chip.
- Admin: the fundraiser drawer's Coupons tab shows reveal/used state and receipts with a Hide action.

## 3. How each rule will be proven (on test data inside self-cancelling transactions, or labelled test rows deleted afterwards)
- **Reveal recorded once:** call reveal 3 times as the test owner. `revealed_at` stays the same, the reveal log has 3 rows and there is 1 'received' event. A co-organizer or random user calling reveal is denied.
- **One email per donation per run:** a test donation split into four $5 coupons, all revealed, then one dispatcher run in dry-run mode (only the test address is allowed) produces one grouped email and 4 events marked. A second run sends nothing.
- **GPS stripped:** a test JPEG with GPS tags. Show its tags before (exiftool via nix in the sandbox), run it through the same canvas re-encode in Playwright, upload, download the stored file and show no tags. Also show the server rejecting the original unprocessed file.
- **Receipt access:** test donor A and the owner get signed URLs. Donor B, a co-organizer, a random user and a signed-out caller get 403. A hidden receipt is denied to everyone except admins.
- **Tokens:** a token opens only its own donation, another donation's id returns nothing, an expired token is rejected, and the raw token is never stored (hash only).
- Build clean, no new triggers, webhooks/checkout/coupon creation unchanged.

## 4. Sample emails
Render #1 and #2 with sample data clearly marked "SAMPLE" in the subject and body, and send only to connect.coupondonation@gmail.com. Report both Resend IDs and their `last_event`; only "delivered" counts as a pass.

## 5. Risks and recommendations
- **HEIC:** without new packages, Chrome and Firefox can't decode HEIC. I recommend a "convert first" message there, or approve one small decoder.
- **Signed-in screens:** the backend can't create test sign-ins (external_unmanaged), so the owner, donor and co-organizer screens will be checked through server-side tests on made-up accounts, and the screens themselves will be reported as unverified.
- **Tremendous redemption status** may not exist or may be unreliable. If so, Used stays owner-reported only.
- **The open "available" decision** (the automatic code-buying step) is still pending. Those coupons can't be revealed until it's resolved.
- **Recommendation:** count the 7-day reminder from the reveal, as you described, and make the guest link valid for 30 days, with each new email issuing a fresh link.
- **Copy cleanup:** I'll report any payout or "transfer" promise found in Terms or WhatWeDo for your approval instead of editing it.
