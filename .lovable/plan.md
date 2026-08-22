# Merge "Is your need long-term?" into the Goal step

## How this works on other platforms

On GoFundMe / Fundly-style platforms, the norm is **one campaign, one total goal**, run for a limited stretch and then closed. Recurring/monthly asks exist (Patreon, GoFundMe's "monthly giving" nudge, church/mutual-aid funds) but they are the exception, and they're always framed as *ongoing support*, not a one-off target. Most people asking for help with groceries, rent, medical bills post a **one-time** goal.

Our product is closer to the recurring case than most, because coupons are issued in monthly $5/$10 batches — but not every recipient needs help forever. Someone recovering from a single hospital bill needs one round; a single parent on a tight budget needs monthly help.

So: the two questions are genuinely the same question asked twice, badly. Today the yes/no toggle sits in the Story step and only ends up in an admin notes string, while the money question always says "each month" even for people with a one-time need.

## What to change

Delete the standalone "Is your need long-term?" yes/no from the Story step. Ask it once, at the top of the Goal step, as the framing for the amount:

**"How often do you need this help?"** — two cards:

- **Just once** — "A one-time need, like a single bill or a rough month."
- **Every month** — "An ongoing need while things stabilize."

Then the amount field below adapts:

| Choice | Heading | Field label | Chips | Helper line |
|---|---|---|---|---|
| Just once | "How much do you need in total?" | USD total | $100 / $250 / $500 / $1,000 | "Most one-time requests are $150–$600." |
| Every month | "How much do you need each month?" | USD / month | $50 / $100 / $200 / $500 | "Families like yours typically request $100–$300 per month." |

The impact preview ("≈ 4 weeks of groceries") keeps working off the entered number either way; only the wording around it changes ("Your goal equals" vs "Your monthly goal equals").

Continue stays disabled until both the frequency and a positive amount are set (a small tightening of today's rule, which only checks the amount).

## Downstream framing

- Review step shows "One-time need · $400 total" or "Ongoing need · $200 / month" in the summary row, with the Edit link pointing at the Goal step.
- Public fundraiser page and cards read "Goal $400" for one-time and "$200 / month" for ongoing, so donors know what they're funding.
- Ongoing campaigns get a "Monthly need" tag; one-time campaigns close out once the goal is fully couponed instead of collecting forever — good for the Stripe/compliance story too, since it caps open-ended collection.

## Technical notes

- `is_long_term` (boolean on `fundraisers`) already exists and is written on submit — it becomes the source of truth for this choice, no schema change. `monthly_goal` stays the amount column; it means "total" when `is_long_term` is false and "per month" when true, and every display site reads the flag to label it.
- `StoryStep.tsx`: remove the toggle block, its `isLongTerm`/`setIsLongTerm` props, and the now-unused tooltip state.
- `GoalStep.tsx`: takes `isLongTerm` / `setIsLongTerm`, renders the frequency cards, and switches heading/suffix/chips/helper text off it.
- `ApplyRecipient.tsx`: move the props, and require `isLongTerm !== null` plus a positive amount in `canContinue()` for the Goal step. The verification `notes` string keeps recording it.
- `ReviewStep.tsx`, `PublicFundraiser.tsx`, `FundraiserCard.tsx`, `FundraiserDashboard.tsx`: label the amount from `is_long_term`.
- No database, RLS, or edge-function changes.
