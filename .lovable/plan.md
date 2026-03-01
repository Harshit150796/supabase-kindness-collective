

## Clean Up CMS Story URLs and Show Person's Name as Account

### Problem
1. The URL `/cms-story/c1f2864e-...` contains "cms" which looks suspicious/phishy to users
2. The organizer name shows "CouponDonation Team" instead of the person featured in the story (e.g., "Maria R.")

### Changes

**1. Rename route from `/cms-story/:id` to `/story-detail/:id`**

- Update `src/App.tsx`: change route path from `/cms-story/:id` to `/story-detail/:id`
- Update `src/components/landing/HeroSection.tsx`: change link from `/cms-story/...` to `/story-detail/...`
- Update `src/pages/CMSStoryDetail.tsx`: change the `shareUrl` from `/cms-story/` to `/story-detail/`

This removes "cms" from the URL entirely. The URL will look like:
`https://www.coupondonation.com/story-detail/c1f2864e-8fba-428a-9649-b1b438ed5dfa`

**2. Show the person's name instead of "CouponDonation Team"**

In `src/pages/CMSStoryDetail.tsx`, replace the hardcoded "CouponDonation Team" and "CD" avatar initials with the story's `name` field:
- Avatar initials: extract first letter of the person's name (e.g., "M" for "Maria R.")
- Display name: show `story.name` (e.g., "Maria R.")

### Technical Details

Files changed:
- `src/App.tsx` -- route path `/cms-story/:id` becomes `/story-detail/:id`
- `src/components/landing/HeroSection.tsx` -- link target updated
- `src/pages/CMSStoryDetail.tsx` -- share URL updated, organizer name and avatar use `story.name`

