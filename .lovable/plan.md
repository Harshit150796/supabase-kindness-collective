

## Plan: Ensure Fundraiser Images Display Everywhere

### Problem Analysis

I've identified the root cause and all affected locations:

**Root Cause on MyFundraisers page:**
The `/my-fundraisers` page (lines 51-56) only fetches `*` from the `fundraisers` table:
```typescript
const { data, error } = await supabase
  .from("fundraisers")
  .select("*")  // ❌ Does NOT include fundraiser_images relation
  .eq("user_id", user.id)
```

It then displays images using only `cover_photo_url` (line 151), which is the legacy field that's likely `null` for newer fundraisers that use the `fundraiser_images` table.

**All Locations Where Fundraisers Are Displayed:**

| Location | File | Current Image Logic | Status |
|----------|------|---------------------|--------|
| My Fundraisers | `src/pages/MyFundraisers.tsx` | Only uses `cover_photo_url` | BROKEN - needs fix |
| Public Fundraiser | `src/pages/PublicFundraiser.tsx` | Fetches `fundraiser_images` separately | Works correctly |
| Fundraiser Dashboard | `src/pages/FundraiserDashboard.tsx` | Fetches `fundraiser_images` separately | Works correctly |
| Stories Page | `src/pages/Stories.tsx` | Uses `FundraiserCard` with `useFundraisers` hook | Works correctly |
| Landing Impact Stories | `src/components/landing/ImpactStories.tsx` | Uses `useFundraisers` but only uses `cover_photo_url` in mapping | BROKEN - needs fix |
| Fundraiser Card | `src/components/stories/FundraiserCard.tsx` | Prefers `fundraiser_images`, falls back to `cover_photo_url` | Works correctly |

---

### Solution Overview

**Fix 1: Update MyFundraisers.tsx**
- Add `fundraiser_images` to the Supabase query using a join
- Update the interface to include the images array
- Update the image display logic to prefer images from the new table

**Fix 2: Update ImpactStories.tsx**
- Update the `mapFundraiserToStory` function to use images from `fundraiser_images` table first, falling back to `cover_photo_url`

---

### Implementation Details

#### File 1: `src/pages/MyFundraisers.tsx`

**1. Update the interface (around line 13):**
```typescript
interface FundraiserImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

interface Fundraiser {
  id: string;
  title: string;
  story: string;
  category: string;
  beneficiary_type: string;
  monthly_goal: number;
  cover_photo_url: string | null;
  status: string;
  amount_raised: number;
  donors_count: number;
  unique_slug: string | null;
  created_at: string;
  fundraiser_images?: FundraiserImage[];  // ADD THIS
}
```

**2. Update the Supabase query (around line 52):**
```typescript
const { data, error } = await supabase
  .from("fundraisers")
  .select(`
    *,
    fundraiser_images (id, image_url, is_primary)
  `)
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });
```

**3. Add helper function to get primary image:**
```typescript
const getPrimaryImage = (fundraiser: Fundraiser): string | null => {
  // Prefer image from fundraiser_images table
  const primaryImg = fundraiser.fundraiser_images?.find(img => img.is_primary)?.image_url;
  if (primaryImg) return primaryImg;
  
  // Fallback to first image in the array
  const firstImg = fundraiser.fundraiser_images?.[0]?.image_url;
  if (firstImg) return firstImg;
  
  // Final fallback to legacy cover_photo_url
  return fundraiser.cover_photo_url;
};
```

**4. Update the image rendering (around line 150-161):**
```typescript
{/* Cover image */}
<div className="w-full md:w-48 h-32 md:h-auto flex-shrink-0">
  {(() => {
    const imageUrl = getPrimaryImage(fundraiser);
    return imageUrl ? (
      <img 
        src={imageUrl} 
        alt={fundraiser.title}
        className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
      />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
        <Heart className="w-8 h-8 text-primary/30" />
      </div>
    );
  })()}
</div>
```

---

#### File 2: `src/components/landing/ImpactStories.tsx`

**Update the `mapFundraiserToStory` function (around line 56-71):**

```typescript
function mapFundraiserToStory(f: Fundraiser): UnifiedStory {
  // Prefer image from fundraiser_images table, fallback to cover_photo_url
  const primaryImage = f.fundraiser_images?.find(img => img.is_primary)?.image_url
    || f.fundraiser_images?.[0]?.image_url
    || f.cover_photo_url
    || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=300&fit=crop';
  
  return {
    id: f.id,
    name: f.title,
    location: f.country || 'United States',
    image: primaryImage,
    story: f.story,
    impact: 'Active Campaign',
    category: f.category,
    donorsCount: f.donors_count || 0,
    amountRaised: f.amount_raised || 0,
    goal: f.monthly_goal,
    type: 'fundraiser',
    slug: f.unique_slug,
  };
}
```

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/pages/MyFundraisers.tsx` | Add `FundraiserImage` interface, update query to include `fundraiser_images`, add `getPrimaryImage` helper, update image rendering |
| `src/components/landing/ImpactStories.tsx` | Update `mapFundraiserToStory` to prefer `fundraiser_images` over `cover_photo_url` |

---

### Image Priority Logic (Consistent Everywhere)

After these changes, every location will use the same priority:

1. Primary image from `fundraiser_images` table (where `is_primary = true`)
2. First image from `fundraiser_images` table
3. Legacy `cover_photo_url` field
4. Fallback placeholder (Heart icon or stock image)

---

### Visual Result

**Before (MyFundraisers):**
- Shows placeholder heart icon even when images exist in `fundraiser_images` table

**After (MyFundraisers):**
- Shows the actual uploaded photos for each fundraiser
- Consistent with how images appear on `/f/:slug`, `/stories`, and dashboard pages

