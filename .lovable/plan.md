# Duplicate-email signup check: audit findings and fix

## What I checked

- `src/pages/Auth.tsx` (the `/auth` signup page) — full git history of the file
- `src/pages/ApplyRecipient.tsx` (the recipient application signup)
- `supabase/functions/check-email-exists` and `supabase/functions/send-otp`
- Database: `auth.users` vs `public.profiles` coverage

## Findings

**Nothing was removed or broken by a later change.** The git history of `Auth.tsx` shows the duplicate-email pre-check was *never* on that page — every version back to January reads the same: send OTP first, and only after the code is verified does it call signup and react to an "already registered" error.

Where things actually stand:

1. **Recipient application flow (`/apply`) — working as designed.** It calls `check-email-exists` before sending the OTP and, if the email is taken, shows "Account already exists" and routes the person to sign in. This is the mechanism you remember.

2. **Main signup page (`/auth`) — no pre-check.** A returning email gets a verification email sent, has to type the 6-digit code, and only then sees "This email is already registered." So the guard exists, but it fires at the worst possible moment: after we've spent an email and the user's time. It also depends entirely on Supabase returning the exact phrase "already registered" — if that wording changes, the user instead falls through to an auto sign-in attempt with the wrong password and gets a confusing failure.

3. **The check itself is case-sensitive.** `check-email-exists` matches `email` exactly, while Supabase auth treats addresses case-insensitively. `User@example.com` passes the pre-check even when `user@example.com` already exists, so the user still hits the late failure.

4. **Data backing the check is currently sound.** 15 auth users, 15 profiles, zero missing profiles, zero email mismatches — so looking up `profiles` is a reliable proxy today. It is still an indirect source (a user created without a profile row would be invisible to it).

## What to change

1. **Add the pre-check to `/auth` signup.** Before `sendOTP`, call `check-email-exists`. If taken: show "This email is already registered — sign in instead", switch the tab to Sign In, and keep the typed email. No OTP is sent, no wasted email.
2. **Make the check case-insensitive and authoritative.** In `check-email-exists`, normalize to lowercase and match with `ilike`, and additionally consult the auth user list via the admin API so accounts without a profile row are still detected.
3. **Keep the post-OTP guard as a backstop**, but broaden the match to cover "already registered", "already exists", and Supabase's `user_already_exists` error code, and stop the auto sign-in attempt in that case.
4. **Also guard `send-otp` server-side** with an optional `purpose: "signup"` flag: if the address already has an account, return a clear conflict response instead of sending a code — so the rule holds even if a client forgets to pre-check.

## Notes on enumeration

A pre-check does reveal whether an address has an account. That is the same trade-off already accepted at `/apply`, and it matches how GoFundMe/Stripe handle signup. Response wording stays neutral and the existing 60-second rate limit on `send-otp` stays in place, so this is not a new exposure.

## Verification

- Sign up at `/auth` with an existing address: expect an immediate "already registered" message, tab flip to Sign In, and no OTP email.
- Repeat with mixed case (`ADMIN@coupondonation.com`): same result.
- Sign up with a fresh address: OTP arrives, account is created, both roles assigned.
- Repeat the existing-address test at `/apply` to confirm no regression there.
