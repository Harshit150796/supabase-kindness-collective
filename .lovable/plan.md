# Professional OTP & Password-Reset Emails

Goal: make the verification-code email look like it came from a serious company — real logo, clean layout, a reporting address, and correct security wording — and fix the blank/"C" sender avatar in Gmail where possible.

## What changes in the email

A single shared email layout used by both the OTP code email and the password-reset email:

- **Logo at top**: the CouponDonation mark (small, ~40px, like Zoho) hosted on a public URL so every mail client renders it, with the wordmark next to it in brand green/blue and alt text fallback for image-blocking clients.
- **Clear headline + purpose**: "Your verification code" with one line stating what it is for (creating your account / signing in).
- **Code block**: large monospace, letter-spaced code on a soft emerald panel — but sized/wrapped so 6 digits never break onto a second line on narrow mobile (the current email wraps "5723 / 13").
- **Security block**:
  - expires in 10 minutes
  - never share this code with anyone; CouponDonation staff will never ask for it
  - "We will never ask for your password or payment details by email"
  - "If you didn't request this code, ignore this email — or report it to security@coupondonation.com"
- **Footer**: company name, US mailing/contact line, support email (connect@coupondonation.com), links to Terms and Privacy, and a line saying this is an automated transactional message (no unsubscribe — transactional mail must not carry one).
- **Plain-text alternative** alongside the HTML (improves inbox placement and works in text-only clients).
- Table-based, inline-styled, 600px max-width markup — no dark-mode-dependent colors, no external CSS, no web fonts.

## Sender identity / avatar in Gmail

The blank circle with "C" is not controlled by the email body. It comes from the sending domain's brand indicator. Steps:

- Keep sending from a dedicated subdomain-safe address and add a real display name.
- Gmail shows a logo avatar only with **BIMI**, which requires DMARC at `p=quarantine` or `p=reject` on coupondonation.com plus an SVG Tiny-PS logo and (for Gmail) a Verified Mark Certificate. This is DNS/registrar work outside the codebase — I will document the exact DNS records and the logo SVG requirement so you can complete it.
- Interim improvement available without BIMI: consistent `From` display name, correct SPF/DKIM/DMARC alignment via Resend, and a Google Workspace profile photo if the address is a Workspace mailbox.

## Technical details

- Add `supabase/functions/_shared/email-layout.ts` exporting `renderOtpEmail()` and `renderPasswordResetEmail()` returning `{ subject, html, text }`.
- Update `supabase/functions/send-otp/index.ts` and `supabase/functions/send-password-reset/index.ts` to use it and to pass `text` to Resend; add `Reply-To: connect@coupondonation.com` and a `List-Unsubscribe`-free transactional header set.
- Logo: upload `src/assets/logo.png` into the existing public `email-assets` storage bucket and reference that stable public URL from the templates (no inline base64 — Gmail strips it).
- No database or auth-logic changes; OTP generation, rate limiting, and expiry stay exactly as they are.
- Verify by invoking the function against a test address and reading the rendered output.

## Open item

DMARC/BIMI DNS changes must be applied by you at the domain registrar; I will supply the record values.
