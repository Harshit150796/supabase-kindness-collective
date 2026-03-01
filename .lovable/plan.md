

## Database-Driven Featured Stories with Clickable Detail Pages

### Overview
Replace the hardcoded featured story data with a Supabase database table. The featured story on the homepage will pull its name, headline, amounts, donor counts, and goals from the database -- making it easy to update without code changes. The card will also be clickable, linking to a full detail page.

### Changes

**1. Create `featured_stories` database table**

A new table with these columns:
- `id` (uuid, primary key)
- `story_key` (text, unique) -- maps to the local image asset (e.g., "childrens-hope", "rural-family", "hurricane-relief", "children-of-heroes")
- `name` (text) -- e.g., "Children's Hope Program"
- `location` (text)
- `headline` (text)
- `short_story` (text)
- `full_story` (text) -- extended story for the detail page
- `impact` (text) -- e.g., "3 months of groceries"
- `category` (text) -- family/child/emergency/community
- `amount_raised` (numeric)
- `goal` (numeric)
- `donors_count` (integer)
- `brand_partners` (text array)
- `display_order` (integer) -- controls weekly rotation order (0-3)
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamps)

RLS: Anyone can read (public data), admins can manage.

**2. Seed the table with 4 mock stories**

Insert realistic data for the 4 featured stories with believable amounts, donor counts, full stories, recent updates, and brand partners -- all pulled from the database so nothing looks hardcoded.

**3. Create `useFeaturedStories` hook** (`src/hooks/useFeaturedStories.ts`)

- Fetches all active featured stories from the `featured_stories` table
- Maps `story_key` to the local image imports (childrens-hope.webp, etc.)
- Exports a `useCurrentFeaturedStory()` that picks the right story based on the current week
- Falls back to the existing hardcoded data if the DB fetch fails

**4. Add featured stories to `impactStories` data** (`src/data/impactStories.ts`)

Add 4 full `ImpactStory` entries (with IDs like `featured-1` through `featured-4`) so the `/story/:id` detail page can render them. These serve as the static fallback and provide the full story structure (gallery images, updates, donors, organizer info) that the detail page expects.

**5. Update `featuredStories.ts`** (`src/data/featuredStories.ts`)

- Add an `id` field to the `FeaturedStory` interface
- Assign IDs `featured-1` through `featured-4` to each story

**6. Update HeroSection** (`src/components/landing/HeroSection.tsx`)

- Use the new `useFeaturedStories` hook to fetch from DB first
- Wrap the featured story `Card` in a `Link` to `/story/{id}`
- Add hover styling (cursor pointer, subtle ring effect)
- Fall back to local data if DB is unavailable

### How It Works
- Admins (or anyone with DB access) can update the `featured_stories` table to change amounts, headlines, donor counts, etc. at any time
- The weekly rotation picks story by `display_order` matching the current week index
- The 4 images remain as local assets mapped by `story_key` -- no need to upload images to storage
- Clicking the featured card navigates to `/story/featured-1` (etc.) which shows the full detail page with gallery, updates, donation panel, and related stories

### Files Changed
- **Database**: New `featured_stories` table + seed data (migration + insert)
- `src/hooks/useFeaturedStories.ts` -- new hook
- `src/data/featuredStories.ts` -- add `id` field
- `src/data/impactStories.ts` -- add 4 featured story entries
- `src/components/landing/HeroSection.tsx` -- use DB hook, make card clickable

