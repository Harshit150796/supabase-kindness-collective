# Fix the large blank area in the homepage fundraiser section

## Verified cause
- The large white area belongs to the featured **“Support Justin After a Severe Car Accident”** card; it is not a hidden or broken fundraiser.
- The database currently has five active fundraisers. Every one has a cover photo and at least one gallery photo, including Justin.
- On desktop, Justin is the large card in the left column. The right column contains the other four fundraisers plus the “Start your own fundraiser” card across three rows.
- The outer grid stretches the Justin card to the full height of those three rows. Its donation totals are anchored to the bottom, leaving the unusually large empty area shown in the screenshot.
- There are no current build or runtime errors causing the gap.

## Fix
- Keep Justin and all five real active fundraisers; no campaign needs replacing.
- Stop the featured card from stretching to the height of the entire neighboring grid.
- Let its photo, title, organizer, progress and donation details occupy their natural compact height while preserving the featured-card emphasis.
- Keep all fundraiser photos cropped consistently and preserve the existing live totals, sorting and filters.
- Confirm the “Start your own fundraiser” card does not force unrelated campaign cards to grow.

## Verification
- Check the homepage signed out at 390px and 1440px.
- Confirm all five active fundraisers remain visible with their photos and real details.
- Confirm Justin’s card has no large empty region and its $0 raised / 0 completed donations / $1,000 goal details sit directly beneath its organizer information.
- Repeat with reduced motion enabled and confirm images remain visible.
- Check `/stories` to ensure the shared fundraiser card remains unchanged there.
