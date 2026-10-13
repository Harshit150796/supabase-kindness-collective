# Visitor follow-up system (PostHog + HubSpot)

Turns website visits into one useful, approved email per visitor type, following the three-step guide you shared.

## Important limits found while planning

- **No reliable free tool identifies anonymous visitors by name and email.** Free tiers exist (RB2B free: US-only, shows LinkedIn profiles, no emails; Snitcher/Leadfeeder free: company name only). Paid tools like Leadpipe are what the guide uses.
- **Resend forbids cold email.** Its rules only allow mail to people who asked for it; sending cold mail through it risks suspension of the account that also sends your donation receipts and password codes. So Resend stays for account mail only.
- **For a charity, emailing people who never shared their address** can break US/EU privacy laws and hurt donor trust.

What we'll do instead: email everyone who **did** share their address with consent (donors, signups, contact form, newsletter), and show unidentified visitors as **companies** in Admin so your team can reach out by hand.

## Phase 1 — Connect and track
- Link PostHog and HubSpot to the app (connect cards will appear).
- Add PostHog tracking once: page views, key clicks (Donate, Start fundraiser, Share), successful forms. Typing in fields is masked; tracking only starts after the cookie bar is accepted (cookie bar itself unchanged).
- When someone signs in, donates or submits a form, link their earlier anonymous visits to them. Store where the email came from and whether/when they agreed to emails.
- Add an "Email me helpful updates" tick box (unchecked) to signup, contact and donate forms.
- Optional: RB2B free tier for company-level visitor insight in Admin (no emails sent to those).
- Setup notes file listing connections, event names and what's missing. Test visit verified in PostHog.

## Phase 2 — Find visitor types (after a few weeks of traffic)
- Read 30 days of visits in batches; find 6–10 visitor types (e.g. "returning donor-to-be", "fundraiser organizer researching", "corporate partner") with evidence.
- Draft one short email per type with one real next step and real links. Unknown visitors get no email.
- Drafts appear in Admin → Follow-ups for your approval. Nothing is sent.

## Phase 3 — Running system
- Every 15 minutes: check new identified, opted-in visits, match a visitor type, and send its **approved** email through PostHog Workflows — once per person per type, never more than one per 14 days, with unsubscribe.
- Each send and the pages viewed are logged as a note on the person's HubSpot contact (created if missing).
- Admin → Follow-ups: drafts and approvals, send log, skipped reasons, on/off switch (starts **off**).

## What you'll need to do
- Approve the PostHog and HubSpot connect cards.
- In PostHog: enable Workflows and verify the coupondonation.com sending domain (I'll give exact steps).
- Approve the email drafts in Phase 2.

## Technical details
- New tables: `visitor_consents`, `followup_personas`, `followup_sends` (unique per contact+persona), staff-only RLS, additive migration.
- `posthog-js` in browser with public token only; server function `followup-dispatch` on the existing pg_cron/Vault pattern; reads PostHog via query API, writes HubSpot via gateway on dated endpoints in one path helper.
- HubSpot uses portal-level access (writes needed for notes) — requires a HubSpot service key.
- Live sending flag off by default; no publish.
