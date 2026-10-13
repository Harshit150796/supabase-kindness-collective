# Visitor follow-up contract

Index for the PostHog + HubSpot follow-up system. Secret values are never stored here.

## Connections
| Service | Status | Credentials (names only) |
|---|---|---|
| PostHog (US, project 661730) | Linked; browser tracking live after cookie bar "Okay" | VITE_LOVABLE_CONNECTOR_POSTHOG_API_KEY (public), POSTHOG_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_REGION |
| HubSpot (portal-wide) | Linked, contacts read verified | HUBSPOT_API_KEY via connector gateway |
| PostHog Workflows (sender) | Live, trigger `followup_email_requested`, sender connect@coupondonation.com, DNS verified. Needs a webhook check step before the email (see Guard) | — |
| PostHog personal API key (to read visits server-side) | Saved | POSTHOG_PERSONAL_API_KEY |

HubSpot key needs: crm.objects.contacts.read, crm.objects.contacts.write, crm.objects.notes.read, crm.objects.notes.write.

## Tracking (src/components/VisitorAnalytics.tsx)
- Starts only when `cd_privacy_consent.accepted` is true; bots skipped; Do-Not-Track respected; no session recording.
- Events: `$pageview` (route changes), autocaptured clicks and form submits. Input values are never captured.
- Identity: signed-in visitors `identify(user_id)`; earlier anonymous visits merge. `reset()` on sign-out. Identity is never inferred from browsing.

## Data (staff-only)
- `visitor_consents`: email, email_source, consent_status, consent_time, posthog_distinct_id, hubspot_contact_id.
- `followup_personas`: persona_key, label, evidence, signals, subject, body, version, approved.
- `followup_sends`: unique per consent + persona.
- `followup_nonces`: single-use code per email, bound to recipient + exact text (server-only).
- `admin_settings.followup_live_sending` (on), `followup_ai_writing` (on).
- Persona `unknown` never emails.

## Sending (supabase/functions/followup-dispatch, rules in _shared/followup-rules.ts)
- Called by admin-dispatch every 5 min; runs every 15. Only opted-in, approved types, once per person per type, 14-day gap, live switch.
- Sends by capturing PostHog event `followup_email_requested` (properties: email, subject, body incl. unsubscribe link). A PostHog Workflow triggered by that event sends the email.
- Opt-ins: public-submit `consent` (signup, contact, signed-in donate). Unsubscribe: /unsubscribe?f=token.
- Admin → Follow-ups: approve drafts, send log, skipped reasons, live switch (admins only).

## Send stages
waiting (30 quiet minutes) -> reserved (one per person, `followup_reserve`) -> queued (event sent with nonce) -> sent (guard passed). skipped/failed are final; uncertain (timeout or no guard call in 2h) is never resent automatically.
Before queueing: HubSpot email history must be readable and empty, consent rechecked, PostHog activity rechecked (new visit -> back to waiting). Visits are read per PostHog person, not per old visitor ID. Failed HubSpot notes retry without resending.

## Guard (closes forged-event sending)
PostHog workflow step order: Trigger -> Webhook (POST https://vbnbacowuoeeojjdrzzp.supabase.co/functions/v1/followup-guard, JSON body `{"nonce":"{{ event.properties.nonce }}","email":"{{ event.properties.email }}","subject":"{{ event.properties.subject }}","body":"{{ event.properties.body }}"}`, on error: abort) -> Email.
Guard returns 204 only for an unused, unexpired nonce matching that email and exact text; forged or replayed requests get 403. Bounce/complaint: POST `{"action":"stop","nonce","email"}` opts the person out.

## Open
- Visitor types are starter hypotheses from page names; rebuild from 30 days of real visits once traffic exists.
- Live email to the founder test address not yet confirmed.
