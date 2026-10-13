# Visitor follow-up contract

Index for the PostHog + HubSpot follow-up system. Secret values are never stored here.

## Connections
| Service | Status | Credentials (names only) |
|---|---|---|
| PostHog (US, project 661730) | Linked; browser tracking live after cookie bar "Okay" | VITE_LOVABLE_CONNECTOR_POSTHOG_API_KEY (public), POSTHOG_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_REGION |
| HubSpot (portal-wide) | Linked, **blocked**: service key lacks scopes | HUBSPOT_API_KEY via connector gateway |
| PostHog Workflows (sender) | Not set up: enable Workflows and verify coupondonation.com sending domain in PostHog | — |
| PostHog personal API key (to read visits server-side) | Missing | POSTHOG_PERSONAL_API_KEY (to add) |

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

## Next phases
2. After a few weeks of traffic: analyze 30 days, draft one email per visitor type, approve in Admin.
3. Dispatcher, HubSpot notes, Admin → Follow-ups, opt-in tick boxes on forms.
