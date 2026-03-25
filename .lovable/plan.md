

## Import 50 Contacts & Send Test Campaign

### What happens

1. **Parse and import contacts** — Extract all 50 email addresses from the Excel file and insert them into `email_subscribers` table with `source: 'excel_import'`
2. **Create a test campaign** — Compose a professional introductory email from CouponDonation as a draft campaign
3. **Send via admin dashboard** — Trigger the send through the existing `send-newsletter` edge function

### Contacts extracted (50 emails)

The file contains 50 business contacts including yours (`harshu.agrawal96@gmail.com`). All will be imported.

### Implementation steps

**Step 1: Write an import script** (run via `code--exec`)
- Read the Excel file with pandas
- Extract all email addresses (column 4 in each row)
- Insert into `email_subscribers` via direct psql, with `source = 'excel_import'`
- Skip duplicates (the table has a unique constraint on email)

**Step 2: Create a draft campaign**
- Insert a professional introductory email into `email_campaigns` via psql
- Subject: "Introducing CouponDonation — Turn Coupons Into Real Impact"
- HTML content: branded, clean email introducing CouponDonation with a CTA
- Sender: `updates@coupondonation.com`
- Includes automatic unsubscribe footer (added by the edge function)

**Step 3: Send the campaign**
- Invoke the `send-newsletter` edge function with the campaign ID
- The function sends in batches with 200ms delays, staying within the 100/day limit
- All 50 emails fit within the daily limit

### Spam prevention measures
- Sending from verified domain (`coupondonation.com`)
- Unsubscribe link included automatically
- Batch sending with delays (not bulk blast)
- Professional HTML content with proper formatting

### Files changed
- No code changes — this is a data operation using existing infrastructure

