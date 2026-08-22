# Polish the Review Step (GoFundMe-grade)

Redesign the final review screen of the recipient application (`/apply`, step 4) so it reads like a real preview of the request instead of a stack of boxes. Photo at the top, calm summary rows underneath, one clear submit.

## What the user will see

```text
┌───────────────────────────────────────────┐
│   [ cover photo, 16:9, rounded, soft ]    │  <- hero at top, tap to change
│   "Add a photo" dashed state if empty     │
├───────────────────────────────────────────┤
│  Title            (inline editable)       │
│  Suggestions ▸ chips                      │
├───────────────────────────────────────────┤
│  Category      Food & Groceries    Edit   │
│  Beneficiary   My Family           Edit   │
│  Monthly goal  $250                Edit   │
│  Location      ZIP → Austin, TX           │
│  Story         first lines…        Edit   │
├───────────────────────────────────────────┤
│  US-only voucher note + submit assurance  │
└───────────────────────────────────────────┘
```

Structure and behaviour:

1. **Cover photo hero at the top** — full-width 16:9 image with rounded corners, subtle border and a soft bottom gradient. Title overlays nothing (kept readable below). Hovering shows a small "Change photo" pill; the empty state is a single tasteful dashed panel with a camera icon, not a big block.
2. **Title directly under the photo** — quiet, borderless-looking input that becomes a focused field on click, character counter only when nearing the 80 limit, suggestion chips collapsed behind "Suggestions".
3. **One summary card instead of three** — Category, Beneficiary, Monthly goal, Location, Story as evenly spaced rows with hairline dividers and small right-aligned "Edit" links (GoFundMe pattern). Story shows a 2-line clamp.
4. **Location row keeps the ZIP input** — compact 5-digit field inline in the row; once valid, the row shows "Austin, TX" with a green check and the field shrinks to a quiet editable value. The US-only line moves to a small footnote under the card.
5. **Smoothness** — staggered fade/rise on mount, 200ms transitions on hover/focus/rows, animated check on ZIP resolve, no layout jump when the city label appears (reserved space).

## Technical notes

- Rewrite `src/components/apply/steps/ReviewStep.tsx` only; keep the exact same props (`coverPhotoPreview`, `title`, `setTitle`, `story`, `category`, `beneficiaryType`, `monthlyGoal`, `zipCode`, `setZipCode`, `locationLabel`, `onEditStory`, `onEditDetails`) so `ApplyRecipient.tsx` and its `canContinue` ZIP validation stay untouched.
- Category/Beneficiary/Goal "Edit" links reuse `onEditDetails`; the photo and story links reuse `onEditStory`.
- Semantic tokens only (`border-border`, `bg-secondary/30`, `text-primary`, etc.), existing `animate-fade-in`/`stagger-children`/`input-focus-ring` utilities, shadcn `Input`.
- No copy claims added beyond the current US-only voucher note.
- Verify with Playwright: navigate the wizard to step 4 and screenshot desktop + mobile widths.
