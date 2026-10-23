# Unify and upgrade transactional emails

## Scope
- Replace the plain and sample-only renderers with one shared, table-based transactional email system.
- Preserve impact-event grouping, dedupe, the 10-minute used-event settle window, donation ledger reads, and all payment/coupon creation paths.
- Keep spendable credentials out of every email.

## Build
1. Create shared email primitives for the branded logo lockup, status label, serif headline, copy, context-specific value/timeline content, primary link button, secondary text link, and honest footer.
2. Rebuild donation confirmation, donor received/used/combined, organizer-ready, organizer-donation, fundraiser-live, invitation, notices, password reset, and OTP templates from those primitives. OTP remains deliberately minimal.
3. Route production and fixed demo sends through the same render functions. Demo messages add only the clearly marked sample-data banner.
4. Add one-click unsubscribe headers only to donor impact emails, using each message’s existing stop URL. Preserve plain-text alternatives and sender/reply-to rules.
5. Add renderer tests for subject safety, no credentials, table-only layout, required image attributes, timeline states, sample/production parity, and impact queue invariants.

## Verification
- Render every template to local HTML files and inspect desktop and 320px screenshots.
- Run targeted edge-function tests and check the preview build.
- Deploy affected email functions.
- Send exactly two requested messages to `haagrawa123@gmail.com`: donor used and organizer ready; then check and report Resend delivery status.
- Do not publish the website.

## Deliverability report
- Provide the exact replacement DMARC TXT record for the founder’s DNS handoff.
- Recommend a separate newsletter subdomain/sender reputation and list the DNS, Resend, and application changes required without making DNS changes.

## Assumptions
- The existing hands-around-heart image is the approved mark; the wordmark will be rendered as live text beside it for reliable email display.
- Existing message/update/admin/password-reset emails are also transactional and will use the same shared chrome, even where not individually named in the requested list.
