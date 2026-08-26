# Switch email reporting address to support@ and re-verify the OTP flow

## 1. Replace security@ with support@

`supabase/functions/_shared/email-layout.ts` is the only place either address appears. It currently defines two addresses:

- `SUPPORT_EMAIL = connect@coupondonation.com`
- `SECURITY_EMAIL = security@coupondonation.com`

Change: point the reporting address to `support@coupondonation.com`. It appears in four places in both emails (OTP and password reset):

- Footer "Report abuse:" link
- Security-notice bullet "Didn't request this? ... report it to ..."
- Plain-text versions of both of the above

Everything else (logo, headline, code block, expiry, footer links) stays as-is. `connect@coupondonation.com` stays as the Questions / Reply-To address unless you want that switched to support@ too.

Then redeploy `send-otp` and `send-password-reset` so both pick up the shared layout change.

## 2. Re-verify the OTP experience

- **Duplicate emails**: confirm only one code is sent per request. `send-otp` deletes prior codes for the address and enforces a 60-second rate limit; the signup path in `Auth.tsx` and the resend button in `OTPVerification.tsx` are the only callers. Verify by triggering signup once against a test address and checking the edge-function logs for a single Resend call, plus the `otp_codes` table for a single active row.
- **Signup duplicate-account guard**: re-confirm an already-registered address still gets the 409 "already registered" response and no code is sent.
- **Background**: the template is already a flat plain-white letterhead (no grey canvas, no rounded card) — matching how standard transactional email looks. I will render both templates to HTML and screenshot them at 600px and 412px to confirm nothing regressed, and share the screenshots.
- **Deliverability sanity**: confirm both emails still ship an HTML + plain-text pair and the correct From / Reply-To.

## Note on the mailbox

`support@coupondonation.com` must actually receive mail (alias to a real inbox), since it will be advertised in every verification and reset email. Nothing in code can verify that — worth sending a test message to it after deploy.
