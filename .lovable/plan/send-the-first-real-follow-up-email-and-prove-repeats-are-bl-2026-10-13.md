# Send the first real follow-up email and prove repeats are blocked

## 1. Confirm your opt-in arrived
- Find your newest "Email me helpful updates" record from the contact form and check it is linked to your visit (so the system can see which pages you looked at).
- If it is not linked (for example the cookie bar was not accepted first), tell you exactly what to redo.

## 2. Wait for the quiet period
- The system waits 30 minutes after your last page view. If that time has not passed, I wait and check again rather than skip the rule.

## 3. Run the send
- Run the follow-up sender once for real.
- Check which visitor type you matched, the exact text the AI wrote (or the base email if the AI broke a rule), and that PostHog's safety check let it through.
- Confirm the email shows as sent in PostHog and a note appears on your HubSpot contact.

## 4. Prove a second email is blocked
- Run the sender again and show it skips you (one email per 14 days, one per visitor type).
- Send a fake repeat request straight to PostHog and show the safety check stops it.

## 5. Report back
- What arrived, from which address, and whether it reached your inbox or spam. You confirm it landed in haagrawa123@gmail.com.
- Check the unsubscribe link in the email works.

Nothing is published.

## Technical details
- Read `visitor_consents` for the latest contact-source row; verify `distinct_id` present and PostHog events exist for it.
- Invoke `followup-dispatch` once; inspect `followup_sends` (sent_subject, sent_body, ai_written) and edge logs for followup-dispatch and followup-guard.
- Re-invoke dispatch and post a duplicate `followup_email_requested` event to confirm guard refusal.
