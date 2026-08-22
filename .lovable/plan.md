# Collapse the account step into a sign-up popup

## What changes for the recipient

The application becomes 4 steps for everyone:

```text
1. Basics  →  2. Story & photos  →  3. Amount  →  4. Review + ZIP  →  Submit
```

- ZIP stays where it is now, on step 4 (Review). No separate location step.
- Step 3 (amount) loses the "your goal equals ~2 weeks of groceries / medical co-pays"
  impact preview and the impact progress bar. The amount input, the suggested amount
  chips, the helper line and the smart-matching card stay.
- On step 4, the button reads "Submit Fundraiser" for everyone.
  - Signed in: submits as it does today.
  - Not signed in: an account card opens as a popup right there — name, email,
    password, plus "Continue with Google" — with the existing email-OTP
    verification after that. Once verified, the fundraiser is submitted immediately
    and the user lands on the same success/share screen. No extra step, no lost data.
- The popup can be dismissed; the review step stays filled in exactly as it was, so
  they can reopen it from the same button.
- Existing-account detection still works: if the email already has an account, the
  popup switches to the "Account found — sign in to continue" state instead of
  erroring out.

## Technical notes

- `src/components/apply/steps/GoalStep.tsx`: delete the impact preview block
  (`getCategoryImpact`, `displayAmount` animation, progress bar) and its unused
  props/imports; keep amount input, presets, helper text, smart-matching switch.
  `ApplyRecipient.tsx` stops passing `category` to `GoalStep`.
- `src/pages/ApplyRecipient.tsx`:
  - `totalSteps` becomes 4 for both guests and authenticated users; drop step 5 and
    the `AccountStep` render; `stepConfig` trimmed to 4 entries.
  - `handleContinue` on step 4: authenticated → `handleAuthenticatedSubmit()`,
    guest → open the account dialog.
  - Guest submit path reuses the current `handleSendOTP` → OTP screen →
    signup → `createFundraiserForUser` chain unchanged, just triggered from the
    dialog instead of the step. Existing-email path keeps routing to `SignInPrompt`.
  - `canContinue()` for step 4 keeps requiring a valid 5-digit ZIP and a title;
    the account fields are validated inside the dialog.
- New `src/components/apply/AccountDialog.tsx`: `Dialog` on desktop / `Drawer` on
  mobile (same pattern as the media picker in `StoryStep.tsx`), wrapping the existing
  account form fields and password-strength UI extracted from `AccountStep.tsx`.
  `AccountStep.tsx` is removed once nothing references it.
- Draft autosave keys and the guest media upload behaviour are untouched.
