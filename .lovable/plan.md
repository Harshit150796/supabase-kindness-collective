

## Fix Missing Stories in Admin + Fix Hero Flash

### Problem 1: Missing Stories
The `featured_stories` table has 4 stories (Children's Hope, Rural Family Support, Hurricane Helene Relief, Children of Heroes) that are NOT in `cms_stories`. The admin page at `/admin/stories` only shows `cms_stories`, so these are invisible to admins.

### Problem 2: Hero Flash
When the homepage loads, `useCurrentFeaturedStory()` returns a local/fallback story instantly, while `useCMSStories()` loads asynchronously. This causes a visible "flash" -- the fallback story appears briefly, then gets replaced by the CMS story once it loads.

---

### Solution

#### 1. Add the 4 featured stories to `cms_stories` table
Insert the 4 missing stories into `cms_stories` as published entries so they appear in the admin stories page:
- **Children's Hope Program** (Poland) - category: child
- **Rural Family Support** (Haiti) - category: family  
- **Hurricane Helene Relief** (North Carolina, USA) - category: emergency
- **Children of Heroes** (Ukraine) - category: child

Each will get appropriate `amount_raised`, `goal`, `donors_count`, `short_story`, and `image_url` values matching the existing `featured_stories` data. They'll be added with `display_order` values after the existing stories.

#### 2. Fix the Hero Flash in `HeroSection.tsx`
Update the HeroSection to check the CMS loading state before rendering. When CMS data is still loading, show the loading/skeleton state instead of the fallback story. This prevents the flash:

- Destructure `isLoading` from `useCMSStories()`
- While loading, either show a subtle skeleton or simply don't render the featured story card until data is ready
- Once loaded, render the correct CMS story immediately without any intermediate fallback flash

### Technical Details

**Files changed:**
1. **Database insert** (no migration, data only) -- Add 4 rows to `cms_stories`
2. **`src/components/landing/HeroSection.tsx`** -- Add loading state check from `useCMSStories` to prevent flash. When `isLoading` is true, show a skeleton placeholder for the featured story card instead of the fallback story.

**No schema changes needed.** The `cms_stories` table already has all the required columns.

