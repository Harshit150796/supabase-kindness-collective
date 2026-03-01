

## Weekly Rotating Featured Story System

### Overview
Create an automatic weekly rotation of 4 featured stories on the homepage hero section, each using one of the uploaded images. The system will cycle through stories based on the current week number -- no manual intervention needed.

### The 4 Featured Stories (one per week, rotating)

1. **Week 1 -- Children's Hope** (kids playing outdoors image): A community program helping children in conflict-affected areas find joy and normalcy through play and support activities.

2. **Week 2 -- Rural Family Support** (man in shelter image): Supporting families in rural Haiti with essential food supplies and grocery coupons to help them through difficult times.

3. **Week 3 -- Hurricane Relief** (smiling man in kitchen image): Helping families in North Carolina rebuild after Hurricane Helene with grocery support and essential supplies.

4. **Week 4 -- Children of Heroes** (group of kids image): Supporting children of fallen heroes in Ukraine with nutrition, education supplies, and community care.

### How the Rotation Works
- Uses `Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % 4` to determine which story to show based on the current week
- Automatically cycles every 7 days with zero maintenance
- CMS stories still take priority if available -- this rotation serves as an improved fallback

### Technical Changes

**New/modified files:**

1. **Copy 4 images to `src/assets/featured/`** -- the uploaded photos become permanent assets

2. **Create `src/data/featuredStories.ts`** -- defines the 4 rotating stories with their images, names, locations, amounts, goals, and short descriptions

3. **Update `src/components/landing/HeroSection.tsx`** -- replace the single `featuredStory` fallback with the week-based rotation logic using `getCurrentFeaturedStory()` helper

### Files Changed
- `src/assets/featured/` -- 4 new image files
- `src/data/featuredStories.ts` -- new file with 4 story definitions and rotation helper
- `src/components/landing/HeroSection.tsx` -- use rotating story instead of static fallback

