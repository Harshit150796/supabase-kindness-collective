# Streamline the Recipient Application (US-only)

Goal: fewer steps, less typing, and a clear "US only" framing — plus consistent capitalization of "US" across the frontend.

## Step reduction: 8 steps → 5 (4 for signed-in users)

Current: Location/Category → Beneficiary → Goal → Media → Story → Title → Review → Account

New flow:

1. **Your basics** — ZIP code + assistance category + who it's for (beneficiary), all on one screen.
2. **Monthly goal** — amount chips + custom input (smart matching stays on by default, no toggle shown).
3. **Your story** — story text + optional photo upload + "ongoing vs one-time" choice, one screen.
4. **Review & submit** — title shown as an inline editable field (pre-filled from the suggested titles), plus the existing edit shortcuts. Signed-in users submit here.
5. **Create account** — guests only (unchanged behavior, OTP flow intact).

Nothing is dropped from the data we collect; the same fields still reach the `fundraisers` and `recipient_verifications` records.

## Page 1: ZIP only, no country dropdown

- Remove the country dropdown entirely. Country is fixed to US, shown as a static, non-editable line: "United States (US) — vouchers are redeemable at US retailers only".
- ZIP is the only location input: numeric keyboard, 5-digit mask. The existing ZIP lookup instantly shows "City, ST" underneath as confirmation, so nothing else is typed. No state dropdown.
- If the lookup fails, we still accept the ZIP and simply skip the "City, ST" confirmation line; nothing blocks the user.
- Page 1 holds three things on one screen: ZIP, assistance category, and who it's for. Continue enables once ZIP is 5 digits + category + beneficiary are chosen.

## Donor-facing location

- Stories, fundraiser cards, and the public fundraiser page show "City, ST" (e.g. "Austin, TX") derived from the ZIP — never the bare ZIP, never lowercase "us".

## "US" capitalization across the frontend

- `formatCountry` returns "United States" for the `us` code and uppercases any bare 2–3 letter code, so no UI ever renders lowercase "us".
- Sweep visible strings so the abbreviation always reads `US` (never "us"/"Us"): geo toasts, advisory notices, footer, apply steps, FAQ/About/Donate copy, and story/fundraiser location labels.


## Technical notes

- `src/pages/ApplyRecipient.tsx`: rework `stepConfig`, `totalSteps` (5 guest / 4 authenticated), `canContinue()`, `handleContinue()`, and the step render switch. `country` state stays but is hard-set to `"us"`; drafts keep saving through `saveScopedDraft`.
- `src/components/apply/steps/LocationCategoryStep.tsx`: drop the `countries` array and Select, add the fixed-US line, add beneficiary options (reusing `BeneficiaryStep`'s cards) into this step.
- `src/components/apply/steps/StoryStep.tsx`: absorb the media uploader from `MediaStep`; `MediaStep`/`BeneficiaryStep` become sub-components or are removed once unused.
- `src/components/apply/steps/ReviewStep.tsx`: add the editable title input (suggested-title chips from `TitleStep` logic kept as a collapsed "suggestions" row).
- `src/lib/countryNames.ts`: uppercase fallback for codes.
- No database, RLS, or edge-function changes.
