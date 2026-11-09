# Blue letter badges and Share buttons

## What changes
- **Letter badges** (the round "S" next to a person's name): change from black to the site's logo blue, the same blue as "Donation" in the logo, with a white letter. They also get a soft ring in a lighter blue, so the circle looks finished instead of flat. This covers the Organizer card, the "is organizing this fundraiser" line, co-organizers, supporters and comments on fundraiser pages.
- **Share buttons:** every Share button on fundraiser pages turns the same blue, with a slightly darker blue on hover. That includes the main Share button, the one next to Donate, the phone bottom bar, the organizer's dashboard and Copy in the share pop-up.
- Donate stays green. The dark "More fundraisers" band and the dark share preview card stay as they are.

## Note
The project's design rules currently reserve blue for "verified" marks and make Share buttons near-black. I'll update that rule so it says Share buttons and letter badges use the brand blue, to stop later changes from reverting this.

## Technical details
- Use the existing `verify` color token (`hsl(212 80% 42%)`, lighter in dark mode), with no new hard-coded colors.
- Badges: `bg-verify text-verify-foreground ring-2 ring-verify/20 ring-offset-2 ring-offset-background font-medium`. Files: PublicFundraiser.tsx (line 151), TeamSection.tsx, plus the supporter initials in DonationPanel.tsx and the comment initials in CommentsSection.tsx (those two are currently grey).
- Share and Copy buttons: replace `bg-ink text-ink-foreground hover:bg-ink/90` with `bg-verify text-verify-foreground hover:bg-verify/90` in PublicFundraiser.tsx (three places), DonationPanel.tsx, FundraiserDashboard.tsx and ShareSheet.tsx (Copy).
- Update the design-rules line about Share buttons in the root AGENTS.md.
- Check it in the browser on the fundraiser page at phone and laptop sizes. Nothing is published.
