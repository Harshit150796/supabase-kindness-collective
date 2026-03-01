

## New Featured Story with Uploaded Images

### Overview
Save all 4 uploaded images into the project for future use, and create a new featured CMS story using one of them. No existing stories will be deleted or modified.

### 1. Save All 4 Images to Project

Copy all uploaded images to `src/assets/featured/` for permanent storage:
- `src/assets/featured/children-playing-hope.webp` (kids playing ring toss)
- `src/assets/featured/haiti-rural-family.webp` (man in rural shelter)
- `src/assets/featured/hurricane-helene-family.webp` (couple in kitchen)
- `src/assets/featured/children-of-heroes-2.jpeg` (group of children on couch)

### 2. Upload One Image to CMS Storage

Upload `haiti-rural-family.webp` (the 2nd image -- the man in rural Haiti) to the `cms-images` Supabase storage bucket so it has a public URL for the CMS story's `image_url`.

### 3. Create New CMS Story

Insert a new published story into `cms_stories` with `display_order: 3` (after Amina at 1 and Grace at 2). Shift existing stories at display_order >= 3 up by one.

**Story Details:**
- **Name:** Jean-Pierre L.
- **Location:** Golbotine, Haiti
- **Category:** family
- **Short story:** After the earthquake destroyed our home, my family and I had nothing. We cooked over an open fire in a makeshift shelter. CouponDonation's grocery coupons gave us consistent access to food for four months while we rebuilt. For the first time, I could focus on rebuilding instead of worrying about the next meal.
- **Full story:** Extended narrative covering Jean-Pierre's life as a farmer before the earthquake, the devastation of losing everything, the daily struggle to feed his family of five from a damaged shelter, discovering CouponDonation through a local aid worker, four months of consistent grocery support that freed him to rebuild, and his current work helping distribute aid to other displaced families in his community.
- **Goal:** $2,000
- **Amount raised:** $1,680
- **Donors count:** 245
- **Impact:** 4 months of groceries for a family of 5 during disaster recovery
- **Image:** Public URL from cms-images bucket (uploaded haiti-rural-family.webp)

### 4. Bump Existing Display Orders

Shift all existing stories with `display_order >= 3` up by 1 to make room for Jean-Pierre at position 3.

### No Frontend Changes Needed

The weekly rotation logic in `HeroSection.tsx` already cycles through all published CMS stories. The new story will automatically enter the rotation and will be accessible at `/story-detail/{id}`.

### Files Changed
- Copy 4 images to `src/assets/featured/`
- Upload 1 image to `cms-images` storage bucket
- Data update: shift display_order values and insert new story into `cms_stories`

### Result
- All 4 uploaded images saved permanently in the project for future featured stories
- Jean-Pierre's story from Haiti is live as the 3rd featured CMS story
- All existing stories (Amina, Grace, Maria archived, Martinez, etc.) remain untouched
- Hero rotation now cycles through 3 featured stories (Amina, Grace, Jean-Pierre) plus all other published CMS stories

