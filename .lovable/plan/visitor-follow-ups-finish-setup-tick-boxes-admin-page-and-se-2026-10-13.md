# Visitor follow-ups: finish setup, tick boxes, Admin page and sending

## 1. Connections
- Re-check HubSpot now that you updated the key. If it still says the key lacks permissions, I'll open a reconnect card so you can paste the new key.
- Open a secure form for the PostHog personal API key, so the system can read visits on our side. In PostHog: Settings → Personal API keys → Create, scope "Query: read" and "Person: read" for this project only.

## 2. "Email me helpful updates" tick box
- Added to sign-up, contact and donate forms. Always **unticked** by default; nothing changes if left unticked.
- When ticked, we save the email, where it came from (signup / contact / donate), and the time they agreed.
- Every follow-up email has a one-click unsubscribe that turns this off.

## 3. Admin → Follow-ups page
- **Visitor types**: each type with its evidence and email draft (subject + body). Edit, then Approve. Only approved drafts can send.
- **Send log**: who got what, when, and pages they had viewed.
- **Skipped**: people matched but not emailed, with the reason (not opted in, emailed in last 14 days, unsubscribed, already got this one).
- **On/off switch** for live sending, starting **off**.
- Visible to admin and staff only.

## 4. Automatic sending
- Every 15 minutes: find opted-in people with new visits, match a visitor type, and send its approved email.
- Rules: one email per person per type, never more than one every 14 days, unsubscribe honored, nothing sent while the switch is off.
- Each send is added as a note on the person's HubSpot contact (contact created if missing).
- Emails go out through PostHog's sender once its domain shows Verified; until then sends are skipped with "sender not ready".

## What stays the same
- Cookie bar unchanged; tracking still waits for consent.
- Receipts and account emails keep using the current sender.
- Visitor types can only be drafted after a few weeks of real visits; until then the page shows "not enough data yet".
- Nothing published.

## Technical details
- Additive migration: unsubscribe token + opt-out time on `visitor_consents`; staff-only read RPCs for the Admin page; audited write RPC for approve/edit/toggle.
- Tick-box writes go through the existing `public-submit` function (contact/donate) and signup flow server-side; no direct client inserts.
- New `followup-dispatch` function, triggered from the existing 5-minute `admin-dispatch` fan-out but self-throttled to every 15 minutes; reads PostHog with `POSTHOG_PERSONAL_API_KEY`; HubSpot through the gateway with dated paths in one helper; sending via PostHog Workflows API.
- Tests for the 14-day limit, once-per-type rule, off switch and unsubscribe.
