# Make the OTP / reset emails look like standard transactional email

Yes — the white is deliberate, not random. The template renders a white "card" sitting on a light grey canvas (`#f4f4f5`), with a rounded border and shadow-like framing. That app-UI look is exactly what feels off in Gmail: most transactional email (Stripe, Google, Apple, Amazon) is a plain white page with left-aligned text and no card.

## What changes

1. **Flat white canvas** — drop the grey page background and the outer padding block; the whole email body becomes `#ffffff`.
2. **Remove the card** — no border, no 16px radius on the 600px container. Content sits directly on white with normal side padding (24px mobile-safe).
3. **Simplify the code block** — keep the 6-digit code prominent and non-wrapping, but on a light neutral (`#f6f7f8`) box with a plain 1px border and small radius instead of the emerald-tinted panel; expiry line stays underneath in muted grey.
4. **Security notice** — convert the grey filled box into plain body copy under a small uppercase heading, separated by a thin hairline rule. Same three bullets, same `security@coupondonation.com` link.
5. **Header** — keep the logo + "CouponDonation" wordmark, left-aligned, followed by a thin divider so it reads as letterhead rather than a card header.
6. **Footer** — unchanged content (automated-message note, connect@ / security@ contacts, site / Terms / Privacy), rendered as small muted grey text above a hairline rule.
7. **Reset-password button** stays emerald so the primary action still carries brand colour.

Everything else — preheader, dark-mode-safe explicit colours, `white-space: nowrap` on the code, table-based markup, `reply_to` headers — is preserved.

## Technical notes

- Single file touched: `supabase/functions/_shared/email-layout.ts` (shared by `renderOtpEmail` and `renderPasswordResetEmail`), so both emails change together.
- No changes needed in `send-otp` or `send-password-reset` beyond redeploying both functions.
- Verify by rendering both templates to HTML and screenshotting at 600px and 412px widths before deploy.
