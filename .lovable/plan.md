# Hide "Last gift" on the homepage

The homepage's "Fundraisers open now" cards stop showing "Last gift …". Cards keep the city and state. The /stories list and the other pages that use the same card keep showing the last gift.

## Technical details
- `src/components/stories/FundraiserCard.tsx`: add an optional `showLastGift` prop (default `true`). When it's false, leave out the "Last gift" text and the dot before it.
- `src/components/landing/ImpactStories.tsx`: pass `showLastGift={false}` to every desktop `FundraiserCard`.
- Phones: check whether `FundraiserMosaic` shows a last-gift time. If it does, remove it there too.
- Ranking order is unchanged.
