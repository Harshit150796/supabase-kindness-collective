# Close the two unsubscribe gaps

## 1. Point PostHog's unsubscribe link at our page

Right now the follow-up emails sent through PostHog carry PostHog's own unsubscribe link, and PostHog doesn't let us read who clicked it — so someone could opt out there and still get our emails.

- Open the live PostHog workflow (the "Helpful Updates & Insights" email step) via the PostHog API.
- Set its unsubscribe link to our page: `https://coupondonation.com/unsubscribe?f={{ event.properties.unsubscribe_token }}` (the token the dispatcher already sends with every email event).
- Verify the saved step shows our link, and confirm a click on it lands on our working unsubscribe page and adds the address to the shared opt-out list.

Result: one unsubscribe link everywhere, and every opt-out — however it happens — stops all optional emails.

## 2. Show the "Unsubscribed" date in Admin

Sending already respects the shared opt-out list; this only makes it visible.

- Admin → Follow-ups: show an "Unsubscribed" badge with the date on any person whose address is on the opt-out list (in the People/consents list and the Waiting & skipped tab).
- Admin → Newsletters (subscribers view): show the same unsubscribed date next to subscribers who opted out.
- Read-only display only — no change to sending logic.

## Technical notes

- PostHog change uses the personal API key already stored as a secret; no code changes needed for step 1.
- Step 2 reads `email_suppressions` (already admin-readable) and joins by email; small edits to `src/pages/admin/AdminFollowups.tsx` and the newsletter subscribers view.
- Nothing will be published.
