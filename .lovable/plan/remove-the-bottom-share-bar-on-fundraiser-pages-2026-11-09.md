# Remove the bottom Share bar on fundraiser pages

## Change
- Remove the bar pinned to the bottom of fundraiser pages on phones and tablets entirely, buttons and all.
- The Share button under the progress panel and the one next to Donate in the page stay, so people can still share and donate from the page itself.
- Real fundraisers also lose the pinned Donate button from that bar; their Donate button in the main panel stays.
- The "just donated" notice that sat above the bar moves down to the bottom edge.

## Technical details
- `src/pages/PublicFundraiser.tsx`: delete the `campaign-sticky-actions` block (lines 238–243). Change the "just donated" toast's bottom offset from `5rem` to `1.5rem` (keep `lg:bottom-8`).
- `src/index.css`: delete the two `.campaign-sticky-actions` rules (lines 657–658).
- Check any bottom page padding that was reserved for the bar, and remove it if it exists.
- Check the page at tablet and phone widths. Nothing is published.
