

## Fix Newsletter Deliverability & Add Logo

### Problem
1. **No logo** in the email — the logo exists at `src/assets/logo.png` but isn't referenced in the email HTML
2. **Landing in Promotions tab** — the current HTML is too marketing-heavy (banner-style layout, heavy styling, CTAs), which Gmail classifies as promotional

### Why emails land in Promotions
Gmail's AI classifies emails based on:
- Heavy HTML with marketing-style layouts → Promotions
- Multiple CTAs, large images, colorful buttons → Promotions
- Minimal HTML, conversational tone, plain structure → Primary
- Transactional/personal-style emails (like OTPs) → Primary

### Solution

**1. Host logo publicly** — The logo at `src/assets/logo.png` is bundled by Vite and not directly URL-accessible. We'll reference it from the live site: `https://www.coupondonation.com/favicon.png` (already in `/public/favicon.png`) or use the OG image.

**2. Rewrite the email template** to be minimal and conversational:
- Small logo at top (not a banner — just a tiny inline image like Gmail/Slack notifications)
- Plain text style body — short paragraphs, no colored buttons, no heavy CSS
- Single simple text link (not a styled CTA button)
- Include a `text` version alongside `html` in the Resend API call (improves deliverability significantly)
- Personal "From" name format: `Harshit from CouponDonation` instead of just `CouponDonation`

**3. Update `send-newsletter/index.ts`**:
- Add `text` field to Resend payload (plain text version of the email)
- Change the From name to feel personal
- Keep the unsubscribe footer minimal

**4. Create a new campaign and send to all 50 subscribers**:
- Reset the previous campaign status so it can be re-sent, OR create a new campaign
- New subject line: conversational, not marketing (e.g., "Quick hello from CouponDonation" instead of "Introducing CouponDonation — Turn Coupons Into Real Impact")
- Send to all 50 active subscribers

### Files changed

1. **`supabase/functions/send-newsletter/index.ts`** — Add plain `text` field to Resend API call, use personal From name, keep HTML minimal
2. **`src/pages/admin/AdminNewsletters.tsx`** — Add a "Plain Text" field to the campaign composer so admins can include a text version

### Email template approach (built into the edge function)

The edge function will wrap campaign content in a minimal template:
- Tiny logo image (32px) linked from the live site
- Content in plain `<p>` tags with default fonts (no custom CSS)
- Simple text unsubscribe link
- No background colors, no buttons, no tables-based layout

This mimics how transactional emails (OTPs, password resets) are structured, which is why they land in Primary.

