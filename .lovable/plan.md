

## Send Newsletter to Website Users + Email Improvements

### What needs to happen

1. **Import website users as subscribers** — Query the `profiles` table for all registered user emails, insert them into `email_subscribers` with `source: 'website_user'`, skipping duplicates
2. **Add website hyperlink to email** — Update the email HTML template in `send-newsletter/index.ts` to include a clickable link to `https://www.coupondonation.com`
3. **Add company logo as sender profile picture** — This is the Gmail/email client avatar. Resend does not support setting a sender avatar directly. The standard way is through **BIMI** (Brand Indicators for Message Identification), which requires a verified trademark and DNS record — this is a long-term setup. However, a simpler immediate fix: link the logo in the email header so it's visible in the email body, and ensure `favicon.png` is accessible at the domain root (already is)
4. **Create a new campaign and send to all subscribers** (existing Excel contacts + newly imported website users)

### Implementation steps

**Step 1**: Run a script to query `profiles` table emails and import them into `email_subscribers` via the `import-subscribers` Edge Function

**Step 2**: Update `supabase/functions/send-newsletter/index.ts`:
- Make the logo in the email header clickable, linking to the website
- Add a visible "Visit CouponDonation" text link in the email body
- Keep the minimal transactional style

**Step 3**: Create a new campaign with proper content and trigger send to all active subscribers

**Step 4**: Deploy the updated Edge Function

### About the sender profile picture

The profile picture/avatar shown next to an email in Gmail is not controlled by the email content — it's determined by:
- **Google Workspace**: If the sender email has a Google account with a profile photo
- **BIMI**: A DNS-based standard that displays a verified logo (requires VMC certificate ~$1,500/year)
- **Gravatar**: Some clients use Gravatar for the sender's email

Since `updates@coupondonation.com` likely sends through Resend (not a Google Workspace account), there's no simple way to set the avatar. The recommended approach is to register a Google Workspace account for `updates@coupondonation.com` and set a profile picture, or set up BIMI DNS records.

For now, I'll make the logo prominent and clickable in the email body itself.

### Files changed
- `supabase/functions/send-newsletter/index.ts` — Add clickable logo linking to website
- No other code changes — the rest is data operations (importing users, creating campaign, triggering send)

