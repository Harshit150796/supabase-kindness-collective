

## Fix CMS Story Click-Through: Create Detail Page for CMS Stories

### Problem
When you click the featured story card showing "Maria R." from Houston, TX on the homepage, it links to `/story/{uuid}`. But the `/story/:id` page only looks up stories from hardcoded local data (`impactStories` array), not from the `cms_stories` database table. Since Maria's UUID doesn't exist in that array, the page redirects to `/stories` instead of showing her details.

### Solution
Create a dedicated CMS story detail page that fetches story data from the `cms_stories` Supabase table and displays it in the same rich layout as the featured story detail page (hero image, full story, progress ring, donation panel, supporters, trust badges).

### Changes

**1. Create `src/pages/CMSStoryDetail.tsx`**

A new page component similar to `FeaturedStoryDetail.tsx` that:
- Accepts an `id` param from the URL (`/cms-story/:id`)
- Fetches the story from the `cms_stories` table by ID
- Renders the same two-column layout with:
  - Hero image (from `image_url`)
  - Title card with category badge, verified badge
  - Full story content
  - Mock recent supporters list (generated from `donors_count`)
  - Sticky donation panel with circular progress ring, amount/goal, donor count
  - Donate and Share buttons
  - Mobile fixed bottom CTA
  - Trust badges
- Back button links to homepage

**2. Add route in `src/App.tsx`**

Add: `<Route path="/cms-story/:id" element={<CMSStoryDetail />} />`

**3. Update `src/components/landing/HeroSection.tsx`**

Change the CMS story link from `/story/${story.id}` to `/cms-story/${story.id}` so it navigates to the new detail page instead of the hardcoded stories page.

**4. Update `src/pages/Stories.tsx`** (if CMS stories are also clickable there)

Ensure any CMS story cards on the `/stories` page also link to `/cms-story/:id` instead of `/story/:id`.

### No Database Changes Needed
The `cms_stories` table already has all the required fields (`full_story`, `amount_raised`, `goal`, `donors_count`, `category`, `image_url`, etc.) and proper RLS policies for public read access.

### Files Changed
- `src/pages/CMSStoryDetail.tsx` -- new page (modeled after FeaturedStoryDetail)
- `src/App.tsx` -- add `/cms-story/:id` route
- `src/components/landing/HeroSection.tsx` -- fix link target for CMS stories
- `src/pages/Stories.tsx` -- fix CMS story card links (if applicable)

