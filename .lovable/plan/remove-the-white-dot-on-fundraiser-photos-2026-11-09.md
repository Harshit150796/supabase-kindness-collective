# Remove the white dot on fundraiser photos

The dot in the top-left corner is the empty white badge left behind when the "Example campaign" text was removed. It shows on every example campaign.

## Changes
- Fundraiser cards (fundraisers page and laptop homepage): remove the empty white badge completely.
- Phone homepage tiles: on wide tiles the dark label shows a stray " · " or an empty pill for example campaigns; show only the collection label (e.g. "76% funded"), and no pill when there is none. Small tiles keep "Example".

## Technical details
- `src/components/stories/FundraiserCard.tsx` line 28: delete the empty `is_example` span.
- `src/components/landing/FundraiserMosaic.tsx` line 88: on wide tiles, render only `label`; skip the span when the text is empty.

Note: this hides the example marking that the founder picked on Nov 8 (example numbers are samples). Your earlier edits already removed the text; this removes the leftover badge.
