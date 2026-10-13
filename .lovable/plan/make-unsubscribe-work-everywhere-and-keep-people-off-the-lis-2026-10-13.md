# Make unsubscribe work everywhere, and keep people off the list

## What I found
- **Three kinds of optional email** go out: newsletters and campaigns, visitor follow-ups (sent by PostHog), and impact updates about a donor's own gift. All three have an unsubscribe link. Newsletters and follow-ups use the same page; impact updates use their own "Stop impact emails" page.
- **Leaving one list doesn't stop the others.** Someone who unsubscribes from a newsletter can still get a follow-up email, and the reverse.
- **Gmail and Apple Mail's built-in "Unsubscribe" button is broken for newsletters.** It points to a page that can't receive the button's request, so the click does nothing.
- **The unsubscribe page shows an error when opened without a link** (for example from a footer or by typing it in). It always says "newsletters", even for a follow-up email.
- **Follow-up emails sent through PostHog** may also carry PostHog's own unsubscribe footer. A click there is never shared with our list today.
- Sending already skips everyone who unsubscribed through our own links, so that part works. Imports never re-add people who left.

## What I'll change
1. **One unsubscribe stops every optional email.** Newsletters, follow-ups and impact updates all stop together. Account emails people need still arrive: receipts, sign-in codes, password resets and fundraiser notices.
2. **Fix the mail-app Unsubscribe button.** Gmail and Apple Mail's button will work for newsletters and follow-ups, with no page to open.
3. **Better unsubscribe page:**
   - Clear wording: "You won't get newsletters, follow-ups or impact updates from us."
   - Without a link, it shows an email box. We send that address a one-time confirm link, so nobody can unsubscribe someone else.
   - A "Changed your mind?" note explains that ticking "Email me helpful updates" again signs you back up.
4. **Every send checks one shared "unsubscribed" list** right before sending, including PostHog's last safety check.
5. **Catch PostHog's own unsubscribes.** The follow-up sender regularly reads who unsubscribed in PostHog and adds them to our list.
6. **Admin view:** the Newsletters subscriber list and the Follow-ups page show "Unsubscribed" with the date.

## How I'll test it
- Small automated tests: an unsubscribed person is skipped for newsletters, follow-ups and impact emails, and every email includes a working link.
- Live check with your address haagrawa123@gmail.com: send a test newsletter, click Unsubscribe, then confirm a follow-up and a newsletter are both blocked. Then tick the box again so your follow-up test can continue.
- Open the unsubscribe page with a good link, a bad link, and no link, and check each message.

Nothing is published.

## Technical details
- New additive table `email_suppressions(email pk, source, created_at)` (service_role only, RLS on, no client access). Existing opt-outs (`email_subscribers.subscribed=false`, `visitor_consents.opted_out`, `impact_email_optouts`) are copied into it. Existing columns are kept and still written.
- Shared `_shared/suppression.ts` with `isSuppressed(email)` and `suppress(email, source)`. Used in send-newsletter (filter the audience), followup-dispatch (decide), followup-guard (final check), and impact-dispatch.
- New `email-unsubscribe` edge function (verify_jwt false): GET/POST with `token` | `f` | impact token handles RFC 8058 one-click POSTs. `List-Unsubscribe` headers point there in send-newsletter. Follow-up emails get the header in the PostHog email step if PostHog allows custom headers; if not, the text link stays.
- The unsubscribe page calls `email-unsubscribe`. The no-token flow sends a signed confirm link through Resend (rate-limited per email), and the success copy depends on which kind of email the link came from.
- followup-dispatch reads PostHog unsubscribes for the `helpful_updates` category through the PostHog API and suppresses those emails. If the API doesn't expose this, it reports it as a step to do by hand.
- A fresh tick of "Email me helpful updates" removes the suppression row (that's explicit new consent); fix the misleading comment in public-submit.
- Deno tests next to `_shared/followup-rules_test.ts`.
