# Merge ZIP into the amount step + account popup for guests

## The new flow (4 steps for everyone)

```text
1. Basics  →  2. Story & photos  →  3. Amount + ZIP  →  4. Review  →  Submit
```

- **Step 3** now asks for the amount and the ZIP code together. The separate account
  step (old step 5) is gone, so guests and signed-in users both see 4 steps.
- The **"your goal equals ~2 weeks of groceries"** impact estimate is removed from
  step 3. The amount input, the suggested amount chips, the helper hint, the impact
  progress bar and the smart coupon matching card all stay.
- **Step 4 (Review)** no longer has a ZIP input. It shows a read-only
  "Location — Austin, TX 78701" line with an Edit link that jumps back to step 3.

## The account popup (guests only)

A single account card, shown as a popup over the current step — sign up with name /
email / password, "Continue with Google", plus a "Already have an account? Sign in"
switch. It appears at two moments:

1. **Leaving step 3**, once amount + ZIP are filled and they tap Continue. This is
   the psychological moment they're most likely to convert.
   - Sign up (or sign in) there → they land on the review step already signed in.
   - Dismiss it → they still move on to the review step; nothing is lost.
2. **On Submit from step 4**, if they're still a guest. Same card, and on success the
   fundraiser is submitted immediately and they go to the success/share screen.

Everything they typed stays exactly where it was while the popup is open or after it
is dismissed. Signed-in users never see the popup.

Email verification stays as it is today: after the sign-up form, the 6-digit code
screen appears, and once verified the fundraiser is created. If the email already has
an account, the popup switches to the "Account found — sign in to continue" state
instead of erroring.

## Two suggestions for you to decide later (not in this build)

- After a guest dismisses the popup on step 3, we could show a small inline
  "Save my progress" line on the review step so they know an account is coming.
- The popup could show a one-line reminder of what they're about to submit
  (title + goal), which usually lifts sign-up completion a few points.

## Technical notes

- `GoalStep.tsx`: delete `getCategoryImpact`, the impact estimate block and its
  `category` prop; add a ZIP input (5-digit numeric, `inputMode="numeric"`) with the
  `useZipLocation` city/state resolution line beneath it. Keeps presets, helper text,
  progress bar and smart-matching switch.
- `ReviewStep.tsx`: replace the ZIP input with a read-only location row +
  `onEditLocation` callback; drop `setZipCode`.
- `ApplyRecipient.tsx`:
  - `totalSteps` = 4 always; `stepConfig` trimmed to 4 entries with step 3 subtext
    mentioning ZIP; remove the `AccountStep` render and step-5 branches.
  - `canContinue()` case 3 requires `monthlyGoal > 0` **and** `/^\d{5}$/` ZIP;
    case 4 requires a non-empty title only.
  - `handleContinue`: step 3 + guest → open account dialog (with a
    `pendingAction: "advance"`); step 4 + guest → open dialog with
    `pendingAction: "submit"`; step 4 + authenticated → `handleAuthenticatedSubmit()`.
  - Dialog dismiss with `pendingAction: "advance"` advances to step 4.
  - After OTP verification: if the pending action was "advance", sign in and go to
    step 4; if "submit", keep the existing `handleOTPVerified` submit path.
  - `SignInPrompt` / `handleSignInAndContinue` reused, branching on the same
    pending action.
- New `src/components/apply/AccountDialog.tsx`: `Dialog` on desktop, `Drawer` on
  mobile (same responsive pattern as the media picker in `StoryStep.tsx`), wrapping
  the account fields and password-strength UI lifted from `AccountStep.tsx`.
  `AccountStep.tsx` is deleted once unreferenced.
- Draft autosave keys, media upload and submission payloads unchanged.
