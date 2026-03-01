
I traced this carefully and found the exact reason you’re not seeing the new featured story yet.

## What’s happening right now (root cause)

1. The homepage hero currently always shows only the first published CMS story:
   - `HeroSection.tsx` uses `cmsStories[0]` (hard-coded first item).
2. Your new “2nd featured story” (Grace) was inserted correctly, but it is not first.
3. There is also a data-order conflict:
   - `display_order = 2` is used by both “The Martinez Family” and “Grace N.”, so ordering after Amina is ambiguous.

That combination means Grace won’t surface in hero as expected.

## Implementation plan (fast, deterministic, and aligned with your “next week” intent)

### 1) Fix story ordering data (no schema change)
Use a direct data update (not migration) to make ordering deterministic:

- Keep Amina as current primary story (`display_order = 1`)
- Keep Grace as next story (`display_order = 2`)
- Move older conflicting stories to later order values so Grace is truly next
- Keep Maria archived/unpublished as requested

Also update Grace’s image to the actual 2nd provided image asset (not generic Unsplash), so content matches your instruction.

### 2) Update hero selection logic to weekly CMS rotation
Modify `src/components/landing/HeroSection.tsx` so CMS stories rotate weekly instead of always selecting index 0.

Technical approach:
- Sort CMS stories by `display_order` (and stable tie-breaker by `created_at`)
- Compute weekly index from a fixed anchor date (the first story’s created date)
- Select `cmsStories[weekIndex]`
- Keep existing fallback to `useCurrentFeaturedStory()` when no CMS stories exist

This ensures:
- Current week = Amina
- Next week = Grace
- Future weeks rotate predictably

### 3) Keep URLs and detail pages unchanged
No route changes needed now:
- `/story-detail/:id` is already correct and non-phishy
- CMSStoryDetail already uses person name correctly and works with updated records

## Files/resources involved

- `src/components/landing/HeroSection.tsx` (rotation logic update)
- CMS data updates in `public.cms_stories` (order cleanup + Grace image assignment)
- Optional static asset path setup for the “2nd of 4 images” if needed in `public/featured/...`

## Validation checklist (end-to-end)

1. Refresh homepage and confirm current hero story remains Amina this week.
2. Confirm Grace exists and opens correctly at `/story-detail/{grace_id}`.
3. Verify CMS ordering query returns deterministic sequence (Amina first, Grace second).
4. Simulate/verify next-week rotation index and confirm Grace becomes hero story.
5. Confirm hero card image for Grace uses your provided 2nd image asset.

## Why this is the best fix

- Fixes the immediate visibility confusion at the root (selection logic + order conflict).
- Preserves your planned cadence (“available next week”).
- Prevents future inconsistency when additional featured stories are added.
- Keeps changes focused and low-risk (no unnecessary schema overhaul).
