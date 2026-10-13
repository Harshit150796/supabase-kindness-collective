# Visitor follow-up contract

Index for the PostHog + HubSpot follow-up system. Secret values are never stored here.

## Connections
| Service | Status | Credentials (names only) |
|---|---|---|
| PostHog (US, project 661730) | Linked; browser tracking live after cookie bar "Okay" | VITE_LOVABLE_CONNECTOR_POSTHOG_API_KEY (public), POSTHOG_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_REGION |
| HubSpot (portal-wide) | Linked, contacts read verified | HUBSPOT_API_KEY via connector gateway |
| PostHog Workflows (sender) | Not set up: enable Workflows and verify coupondonation.com sending domain in PostHog | — |
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
- `admin_settings.followup_live_sending` = false (live sends off).

## Sending (supabase/functions/followup-dispatch, rules in _shared/followup-rules.ts)
- Called by admin-dispatch every 5 min; runs every 15. Only opted-in, approved types, once per person per type, 14-day gap, live switch.
- Sends by capturing PostHog event `followup_email_requested` (properties: email, subject, body incl. unsubscribe link). A PostHog Workflow triggered by that event sends the email.
- Opt-ins: public-submit `consent` (signup, contact, signed-in donate). Unsubscribe: /unsubscribe?f=token.
- Admin → Follow-ups: approve drafts, send log, skipped reasons, live switch (admins only).
