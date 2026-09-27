# Health check for every outside service after the workspace move

## What a first look already shows
- **Supabase:** the site is still connected to the same Supabase project, so all accounts, donations and fundraisers stay where they were.
- **Saved keys still present:** Resend (email), Stripe (secret key and webhook), Square (access token, app ID, location ID, webhook key) and the AI assistant key.
- **Missing keys:** the settings for Tremendous (the service that buys the gift cards) are gone, so creating real coupons would fail. The Square "production or sandbox" setting is also missing. The code falls back to a default for that one, so I'll check which default it uses.
- **Google sign-in:** this is set up inside your Supabase account, not in Lovable, so the move shouldn't affect it. I'll still test it.

A key being saved doesn't prove it still works, so each service gets a live test.

## Checks (in order)
1. **Supabase:** load the homepage data, sign in with a test account, and confirm the server functions respond.
2. **Resend:** send one test code email to connect@coupondonation.com and confirm it arrives from support@coupondonation.com.
3. **Stripe:** open the on-page Stripe payment form and confirm it loads without errors.
4. **Square:** open the on-page Square form and confirm it loads with the live location.
5. **Google sign-in:** confirm the Google button reaches Google's sign-in screen and returns to the site.
6. **AI assistant (Coupon chat):** send a single question and confirm it answers.
7. **Tremendous:** confirm the coupon-purchasing step fails only because its keys are missing.

## Fixes
- For any missing or broken key, I'll open a secure form so you can paste the value. You won't paste keys in chat.
  - Tremendous API key, campaign ID, funding source ID and environment (from your Tremendous dashboard).
  - Square environment, set to `production`, if the check shows it's needed.
- If the AI assistant key fails after the move, I'll replace it with a new one.
- If Stripe or Square webhooks point at an old address, I'll give you the exact address to paste back into their dashboards.

## What you'll get
A short table showing each service as working, fixed or needs your action, plus anything I couldn't test (for example, a real card payment).

## Technical details
- Keys the server code uses but that aren't saved: TREMENDOUS_API_KEY, TREMENDOUS_CAMPAIGN_ID, TREMENDOUS_FUNDING_SOURCE_ID, TREMENDOUS_ENV, SQUARE_ENVIRONMENT.
- SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided automatically by Supabase.
- Tests will call the payment-config, send-otp and coupon-chat functions and check their logs.
