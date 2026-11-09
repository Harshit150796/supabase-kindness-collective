# Show people's names with a capital first letter everywhere

## Why it looks different today
The organizer typed their name as "sophie", and that is what's saved. Some spots show it exactly as saved ("sophie" next to the photo, in the Organizer card), while the round initial badge capitalizes just its single letter ("S"). Other spots, like the share preview, tidy the name separately. So one name shows up in two different styles.

## Fix
- Add one shared name formatter that gives each word a capital first letter ("sophie" becomes "Sophie", "mary ann" becomes "Mary Ann"). The rest of each word is left as typed, so names like "McDonald" or "DeShawn" stay correct.
- Use it everywhere a person's name appears on public and signed-in pages: the fundraiser page (organizer line, Organizer card, team/co-organizers, supporters, comments, updates), fundraiser cards, the share sheet, messages, profiles and People, and the organizer's own dashboard.
- Use the same rule in the link-preview text ("organized by Sophie") so shared links match.
- What's saved stays the same: this only changes how names are shown. Admin pages keep showing the name exactly as typed, so the team can see what was actually entered.

## Technical details
- New `src/lib/personName.ts` exporting `displayName(name)`. It trims, collapses spaces and uppercases the first letter after a start, space, hyphen or apostrophe. Mirror the same logic in `supabase/functions/_shared/share-preview.ts`, where it's used for the organizer name.
- Apply it in the files that render names: PublicFundraiser, TeamSection, CommentsSection, DonationPanel, ShareSheet, FundraiserCard, Messages, PublicProfile, ProfileBits, People, FundraiserDashboard, MyFundraisers.
- Add `supabase/functions/_shared/person-name_test.ts`: "sophie" gives "Sophie", "mary-ann o'neil" gives "Mary-Ann O'Neil", "McDonald" stays "McDonald", and empty input stays empty.
- Redeploying share-fundraiser needs your OK; nothing is published.
