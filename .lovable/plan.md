

## Add 2nd Featured CMS Story Using "Children's Hope" Image

### Overview
Insert a new CMS story as the 2nd featured story, using the `childrens-hope.webp` image. Since CMS stories use URLs (not local assets), we'll use a fitting Unsplash image that matches the children's hope theme.

### New Story Details
- **Name:** Grace N.
- **Location:** Kampala, Uganda
- **Category:** children
- **Short story:** When I lost my teaching job during the school closures, my three children went from eating two meals a day to barely one. CouponDonation's grocery coupons carried us through six months until I found work again. Now my children are back in school and thriving.
- **Full story:** Extended narrative covering Grace's journey as a single mother and former teacher -- losing her job, watching her children go hungry, discovering CouponDonation through a church community board, receiving consistent grocery support for six months, eventually finding a new position at a community school, and now volunteering to help other families apply for support.
- **Goal:** $3,000
- **Amount raised:** $2,340
- **Donors count:** 312
- **Impact:** 6 months of groceries for a family of 4
- **Image URL:** A relevant Unsplash image matching children/hope theme
- **display_order:** 2, **is_published:** true

### Database Change
A single `INSERT` into `cms_stories` using the data insert tool (not a migration, since this is data, not schema).

### No Frontend Changes Needed
The homepage currently shows only the first published CMS story (display_order 1 = Amina K.). The new story will be available at `/story-detail/{id}` and can be promoted to the featured slot later by adjusting display_order. It will also appear in any story listings that query published CMS stories.

### Files Changed
- None -- data-only insert into `cms_stories` table

