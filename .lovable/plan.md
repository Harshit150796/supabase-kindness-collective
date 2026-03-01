

## Featured Story Detail Page (Like Real Fundraisers)

### Overview
Create a dedicated detail page for featured stories that matches the exact look and feel of the real fundraiser pages (`/f/:slug`). When a user clicks the featured story card on the homepage, they'll land on a page with the same two-column layout, circular progress ring, donation panel, organizer info, and trust badges -- just like a real fundraiser.

### What Changes

**1. New page: `src/pages/FeaturedStoryDetail.tsx`**

A new page component modeled after `PublicFundraiser.tsx` that:
- Accepts a `storyKey` param from the URL (e.g., `/featured/childrens-hope`)
- Fetches the story data from the `featured_stories` Supabase table using the `story_key`
- Falls back to local `featuredStories` data if the DB is unavailable
- Maps `story_key` to the local image assets (same image map from `useFeaturedStories.ts`)
- Renders the same layout as `PublicFundraiser.tsx`:
  - Hero image at the top (using the local asset)
  - Title card with category badge, verified badge, and organizer info
  - Full story content section
  - Mock recent supporters list (generated from the `donors_count` field)
  - Sticky right-column donation panel with circular progress ring, amount raised/goal, donor count, days active
  - "Donate Now" button linking to `/donate`
  - Share button with share modal
  - Mobile fixed bottom CTA bar
  - Trust badges
- Back button links to homepage (`/`)

**2. Add route in `src/App.tsx`**

Add: `<Route path="/featured/:storyKey" element={<FeaturedStoryDetail />} />`

**3. Update `src/components/landing/HeroSection.tsx`**

Change the featured story link from `/story/${story.id}` to `/featured/${story.storyKey}` so clicking navigates to the new page.

**4. Update `src/hooks/useFeaturedStories.ts`**

Include `story_key` in the returned story object so `HeroSection` can build the correct link.

**5. Update `src/data/featuredStories.ts`**

Add a `storyKey` field to the `FeaturedStory` interface and each story entry (e.g., `'childrens-hope'`, `'rural-family'`, etc.) for the local fallback path.

**6. Add `full_story` data to the `featured_stories` DB table**

The table already has a `full_story` column. We'll ensure the seeded data includes extended story text so the detail page has rich content to display.

Update the 4 rows with longer `full_story` text via a migration.

### How It Works
- User sees the featured story card on the homepage
- Clicks it, navigates to `/featured/childrens-hope` (or whichever story is currently rotating)
- The detail page fetches data from `featured_stories` table by `story_key`
- Renders in the same visual format as real fundraiser pages
- "Donate Now" links to `/donate`, "Share" opens the share modal
- Mobile users see a fixed bottom bar with Donate + Share buttons

### Files Changed
- `src/pages/FeaturedStoryDetail.tsx` -- new page
- `src/App.tsx` -- add route
- `src/components/landing/HeroSection.tsx` -- update link target
- `src/hooks/useFeaturedStories.ts` -- expose `storyKey` field
- `src/data/featuredStories.ts` -- add `storyKey` to interface and data
- Database migration -- update `full_story` text for all 4 featured stories

