# Drop "how long do you need it" — one goal, one time

## The call

Remove the "Is your need long-term?" question completely and make every request a **single, finite goal**. This is how GoFundMe and every mainstream crowdfunding platform works: one campaign, one total, closes when it's met. It removes the confusion you spotted and it removes the abuse path — nobody sits on an open-ended monthly drip they no longer need, because there is no monthly drip.

Your instinct about community organizations is right, but the cleanest version is not a second billing mode — it's just a **bigger goal and a longer horizon**. An organization asking for "$500/month for 6 months" is the same thing as asking for "$3,000 to cover 6 months of groceries for 12 families", and the second version is easier to understand, easier to verify, and self-closing. So organizations get higher amount presets and copy that invites a program-scale total, not a recurring switch.

If a recipient still needs help after their goal is met, they create a new request. That's a natural re-verification checkpoint rather than a silent forever-subscription — and it reads much better to an underwriter than open-ended collection.

## What changes in the flow

**Story step:** delete the "Is your need long-term?" yes/no card and its tooltip. Nothing replaces it.

**Goal step:** becomes a single clean question — **"How much do you need?"**

- Heading: "How much do you need?" · sub-line: "One goal. Once it's fully funded, your request closes."
- Field suffix changes from `USD / month` to `USD total`.
- Presets adapt to who it's for:
  - Yourself / My Family: **$100 · $250 · $500 · $1,000**, helper "Most personal requests are $150–$600."
  - Community Organization: **$500 · $1,500 · $3,000 · $5,000**, helper "Organizations often request $1,500–$5,000 to cover a program period — tell donors the timeframe in your story."
- Impact preview keeps working off the entered number; wording drops "monthly" ("Your goal equals ≈ 8 weeks of groceries").
- Continue rule is unchanged: a positive amount.

**Review step:** the row reads **Goal** with `$X total` instead of "Monthly goal".

**Public pages / cards / dashboards:** "$X goal" and "raised of $X" — no "per month", no "Monthly need" tag. Once `amount_raised >= goal`, the request shows **Fully funded** and stops accepting new donations, so it closes itself.

## Technical notes

- No schema change. `fundraisers.monthly_goal` keeps holding the number but now means the **total goal** everywhere; `is_long_term` stops being written (left as `false`) and every read of it in the UI is removed.
- `StoryStep.tsx`: remove the long-term block, the `isLongTerm` / `setIsLongTerm` props, and the unused tooltip state.
- `GoalStep.tsx`: drop the "each month" copy, take `beneficiaryType` to pick the preset set and helper line, change the suffix to `USD total`.
- `ApplyRecipient.tsx`: remove `isLongTerm` from state, the draft payload, the props it passes down, and the `recipient_verifications.notes` string; insert `is_long_term: false`.
- `ReviewStep.tsx`: relabel the goal row and rename the `monthlyGoal` prop to `goalAmount` for clarity.
- `PublicFundraiser.tsx`, `FundraiserCard.tsx`, `FundraiserDashboard.tsx`, `AdminFundraisers.tsx`: strip the `is_long_term` / "per month" labels; add the "Fully funded" state and disable the donate CTA when the goal is reached.
- No database, RLS, or edge-function changes.
