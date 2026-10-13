# Follow-ups: check against the guide and fill the gaps

I read the guide's three prompts and compared each step to what is built. Most of the base works. Some steps are missing, and one is a real safety hole.

## Step check

| Guide step | Status |
|---|---|
| 1. Connect PostHog and HubSpot, track visits, consent tick boxes | Done |
| 1. Setup notes file kept current | Out of date (still says sending isn't set up and live is off) |
| 1. Test visit proving earlier visits stay linked to the person | Not done |
| 2. Visitor types built from real visit data, with counts and evidence | Missing. The six types were written from page names, not real visits |
| 2. "Unknown" type that never gets an email | Missing |
| 3. Wait 30 quiet minutes after a visit before deciding | Missing (checks run every 15 minutes, no wait) |
| 3. Check again just before sending that the person hasn't come back, donated or unsubscribed | Missing |
| 3. Check HubSpot for earlier emails to this person before sending | Missing |
| 3. Safety check in PostHog so only our system can trigger an email | **Missing, and serious**: anyone who copies the site's public PostHog key could make PostHog send any text to any address from connect@coupondonation.com |
| 3. Clear send stages (waiting, reserved, sent, failed, unsure) so nobody gets two emails | Partly done (one per type, 14-day gap) |
| 3. Stop on bounce, complaint or reply | Missing |
| 3. Tests for these cases and one real test email to you | Rule tests exist, but no real email has been confirmed |
| Paid identity tool and cold email (Leadpipe, lemlist) | Skipped on purpose: it emails strangers, which is not allowed for a charity using Resend or PostHog |

## What I'll build

1. **Close the safety hole.** Every email request gets a single-use signed code. In the PostHog workflow, a check step before the email asks our server "is this real?". If not, PostHog stops. Requests that are faked or reused cannot send.
2. **Wait and recheck.** Decide only after 30 quiet minutes. Recheck right before sending: still opted in, no new visit, no donation since, no earlier HubSpot email.
3. **Send stages.** Each person moves waiting, then reserved, then sent (or skipped, failed, or unsure). "Unsure" never resends by itself. A failed HubSpot note retries without sending the email again.
4. **Stop signals.** Bounces, complaints and unsubscribes from PostHog switch that person off.
5. **Visitor types from real visits.** Read the last 30 days of PostHog visits in batches and save a count. Give each type real visit numbers, its signals and one example that doesn't fit. Add "Unknown", which never gets an email. Changed drafts go back to "needs approval".
6. **Fix person matching.** After someone signs in, PostHog may track them under a new ID. Look up visits per person, not per old visitor ID, so pages aren't missed.
7. **AI writing.** The guide sends approved text word for word. You asked for AI-written emails, so I'll keep AI with its current safety rules. Admin → Follow-ups will get a switch to send the approved text unchanged instead.
8. **Update the setup notes.** Then send one real test to haagrawa123@gmail.com, show it arrived, and repeat the visit to show it can't send twice.

## What you'll need to do
- In PostHog, add the check step to the workflow (I'll give exact clicks), or let me do it through the browser.
- Confirm the test email arrived.

## Technical details
- New table `followup_nonces` (nonce, consent_id, persona_id, body hash, expires, used_at). New edge function `followup-guard` (verify_jwt off) checks HMAC signature + nonce, returns 204 or 403. The PostHog workflow gets a webhook step with on_error=abort.
- `followup_sends` gets additive columns: status adds reserved/queued/uncertain, `due_at`, `attempt_id`, `provider_receipt`. Use an atomic reserve via a security-definer RPC.
- The HogQL query moves to `person_id` and reads `$pageview` plus the last event timestamp. Due = last activity + 30 minutes.
- HubSpot engagement search for prior email notes; if history can't be read, skip.
- PostHog email events (bounced, complained, unsubscribed) go to a webhook that sets opted_out.
- A persona-analysis script saves a manifest plus personas with evidence and counts; IDs and approvals are kept on reruns.
- Deno tests: forged or replayed nonce, renewed activity, prior outreach, missing access, duplicate jobs, timeout stays uncertain, CRM-only retry.
- Nothing published.
