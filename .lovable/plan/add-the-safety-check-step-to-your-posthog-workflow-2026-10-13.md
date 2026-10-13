# Add the safety check step to your PostHog workflow

## What I'll do
1. **Add the check step for you.** I'll use the PostHog key already saved for this project to open your live workflow (trigger "followup_email_requested") and put a check step between the trigger and the email. Before each email, the step asks our server "is this real?". If the answer is no, or the check fails, PostHog stops and sends nothing.
2. **Confirm the order.** I'll read the workflow back and check it says: Trigger, then Check, then Email.
3. **Prove it blocks fakes.** I'll send a made-up request with no valid code and show PostHog stops it at the check step. Nothing goes out.
4. **Send one real test.** I'll send one real follow-up to haagrawa123@gmail.com, check it passes the check and shows as Sent in Admin → Follow-ups, with a note in HubSpot. Then I'll send the same request again and show it's blocked as a repeat.
5. **Update the setup notes.** I'll mark the safety step and the live test as done.

## If the saved key can't edit workflows
PostHog may refuse because the key can only read data. If that happens, I'll give you 6 short clicks to add the step yourself (about 2 minutes). Or you can make a new key with workflow edit access, and I'll finish the job.

## What you'll need to do
- Check your inbox for the test email and tell me if it arrived.

## Technical details
- PostHog API: `GET/PATCH /api/projects/661730/hog_flows/{id}`. Insert a `function` action (webhook template) POSTing to `.../functions/v1/followup-guard` with body `{nonce,email,subject,body}` from event properties, `on_error: abort`, and edges trigger → guard → email.
- Forged test: capture `followup_email_requested` with a random nonce, then read the workflow's run logs to confirm it was aborted.
- Real test: run followup-dispatch for the founder consent, then check `followup_sends.status = 'sent'` and that the nonce is used. Replay the same event and expect a 403 from the check.
- Nothing published.
