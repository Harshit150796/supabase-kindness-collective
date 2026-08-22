# Resequence the Recipient Application for Momentum

Right now step 1 opens with a ZIP code field — a data-entry task that feels like paperwork and asks for personal location before the person has any sense of what they're getting. Better sequencing follows a simple rule: **start with the easiest, most human question; defer administrative fields until the person is already invested.**

## Recommended order (still 4 steps, 5 for guests)

1. **"Who needs help?"** — beneficiary (Yourself / My Family / Community Organization) + assistance category.
   One tap each, zero typing, immediately feels like it's about them. Category chips also let us tailor later copy ("groceries" vs "school supplies").
2. **"Tell us your story"** — story text + optional photo + ongoing vs one-time.
   This is the step people actually care about and where commitment builds. Comes early while motivation is highest, with category-aware prompts so the box is never blank-page scary.
3. **"How much do you need each month?"** — amount chips + custom, with a category-aware typical range.
   Easier to answer once they've described their situation; the story gives them a mental anchor.
4. **"Where will you use the coupons?" + Review** — ZIP code (with the auto "City, ST" confirmation and the fixed United States (US) line), editable title, and the summary of everything above.
   ZIP lands last as a short logistics question, framed as "so we can match retailers near you" rather than an identity check. Signed-in users submit here.
5. **Create account** — guests only, unchanged.

Net effect: first screen is taps only, typing starts at step 2 with the part they want to write, and the only "form field" moments (ZIP, title) sit next to the submit button where drop-off costs least.

## Supporting UX touches

- Progress framing per step: "1 of 4 — takes about 3 minutes".
- Step 1 shows a one-line reassurance instead of the location notice ("Free to apply. Coupons only, no cash.").
- The US-only line moves to step 4 next to ZIP, where it is contextually relevant.
- Continue stays disabled until that step's minimum is met (same rules, just remapped).
- Review keeps its Edit shortcuts, now pointing at the new step numbers, plus inline ZIP edit.

## Technical notes

- `src/pages/ApplyRecipient.tsx`: reorder `stepConfig`, remap `canContinue()`, `handleContinue()`, `goToStep()` targets, and the render switch to the new step numbers. `totalSteps` stays 4 authenticated / 5 guest. Draft persistence via `saveScopedDraft` is unaffected.
- `LocationCategoryStep.tsx` splits: category + beneficiary become `BasicsStep` (step 1); ZIP + fixed-US line move into the review screen as a compact `LocationField`.
- `ReviewStep.tsx` gains the ZIP input (5-digit mask, `useZipLocation` confirmation) above the existing title field and details summary.
- `StoryStep.tsx` and `GoalStep.tsx` unchanged apart from headline/subtext copy and category-aware placeholder/range text.
- No database, RLS, or edge-function changes.
