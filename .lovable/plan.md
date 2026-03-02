

## Fix Story Images + Create New Stories for All Unused Images

### What's Wrong
The 4 featured stories added to `cms_stories` have `image_url = NULL`, so they show no images in admin or on the homepage. Additionally, there are 4 extra images in the project with no stories created for them.

### What We'll Do

#### Step 1: Copy all images to `public/featured/`
Copy these files from `src/assets/featured/` to `public/featured/` so they have stable, publicly accessible URLs:
- `childrens-hope.webp`
- `rural-family-support.webp`
- `hurricane-relief.webp`
- `children-of-heroes.jpeg`
- `children-playing-hope.webp`
- `children-of-heroes-2.jpeg`
- `haiti-rural-family.webp`

Also copy the uploaded Hurricane Helene image to `public/featured/hurricane-helene-family.webp`.

#### Step 2: Update the 4 existing CMS stories with image URLs
Set `image_url` for the stories that currently have NULL:
- Children's Hope Program --> `/featured/childrens-hope.webp`
- Rural Family Support --> `/featured/rural-family-support.webp`
- Hurricane Helene Relief --> `/featured/hurricane-relief.webp`
- Children of Heroes --> `/featured/children-of-heroes.jpeg`

#### Step 3: Create 4 new CMS stories for unused images
Create new published stories using the remaining images:

| Story Name | Location | Category | Image |
|---|---|---|---|
| Children at Play | Poland | child | `/featured/children-playing-hope.webp` |
| Heroes' Legacy: Next Generation | Ukraine | child | `/featured/children-of-heroes-2.jpeg` |
| Life in Rural Haiti | Haiti | family | `/featured/haiti-rural-family.webp` |
| Hurricane Helene: Family Recovery | North Carolina, USA | emergency | `/featured/hurricane-helene-family.webp` |

Each story will have appropriate `short_story`, `full_story`, `amount_raised`, `goal`, and `donors_count` values.

### Technical Details

**Files created/copied (8 files to `public/featured/`):**
- 7 images from `src/assets/featured/`
- 1 uploaded image

**Database changes (data only, no schema):**
- UPDATE 4 existing `cms_stories` rows to set `image_url`
- INSERT 4 new `cms_stories` rows with `display_order` 16-19

**No code changes needed** -- the `HeroSection` and admin page already read `image_url` from the database.

