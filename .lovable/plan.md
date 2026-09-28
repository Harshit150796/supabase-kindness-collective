# Re-test the verification email and fix Resend if it fails

## Steps
1. **Send one test code** to connect.coupondonation@gmail.com using the same function your sign-up page uses.
2. **Check Resend's reply**, not just "success": record the email ID Resend returns and read the function's logs.
3. **Look the email up in Resend** using that ID to see its real status (delivered, bounced, blocked, or still queued). This tells us whether the problem is the key, the sending domain, or the inbox.
4. **Check the sending domain.** If Resend says coupondonation.com isn't verified anymore, I'll give you the exact records to fix.
5. **If the key is rejected or the email isn't delivered because of the key**, I'll open a secure form so you can paste a fresh Resend key (created in the Resend dashboard, with "Sending access"). Then I'll re-send the test and repeat the checks.

## What you'll get
A plain answer: arrived, bounced, or blocked, and why. Please check the Gmail inbox and the Spam and Promotions folders for a code from support@coupondonation.com.

## Technical details
- Calls `send-otp` with `purpose: "verify"`. The 60-second limit applies per address.
- Checks delivery with Resend `GET /emails/{id}` and `GET /domains`, using the stored RESEND_API_KEY from a one-off server-side check. The key is never printed.
- If the key is replaced, use `update_secret` for RESEND_API_KEY, then redeploy `send-otp`, `send-password-reset` and `send-newsletter`.
