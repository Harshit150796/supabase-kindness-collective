

## New Featured CMS Story + Archive Maria

### Overview
Replace Maria's featured CMS story with a new one that uses one of the existing local featured images. Maria's story stays in the database but is unpublished (archived). The new story will appear on the homepage featured card.

### Changes

**1. Database: Unpublish Maria, Insert New Story**

Run a migration that:
- Sets `is_published = false` on Maria R.'s CMS story (`c1f2864e-8fba-428a-9649-b1b438ed5dfa`)
- Inserts a new CMS story with `display_order: 1` and `is_published: true` using one of the 4 featured images

New story details (using the Children of Heroes image from `src/assets/featured/children-of-heroes.jpeg`):
- **Name:** Amina K.
- **Location:** Nairobi, Kenya
- **Category:** family
- **Short story:** After my husband passed away, I was left to raise four children alone with no income. The grocery coupons from CouponDonation kept food on our table for five months while I completed a vocational training program.
- **Full story:** Extended version covering her journey -- loss, struggle, discovering CouponDonation, rebuilding through vocational training, and now mentoring other widows
- **Goal:** $2,500
- **Amount raised:** $1,920
- **Donors count:** 278
- **Impact:** 5 months of groceries + vocational training
- **Image URL:** Will use the Children of Heroes image asset (since CMS stories use URLs, we'll use a relevant Unsplash image that fits Amina's story)

**2. Update `src/pages/CMSStoryDetail.tsx`** (no changes needed)

The existing page already fetches by ID from `cms_stories` and renders dynamically. The new story will work automatically.

**3. Update `src/components/landing/HeroSection.tsx`** (no changes needed)

Already picks the first published CMS story. Since Maria is unpublished, it will pick Amina's story (or the next in display order).

### Files Changed
- New Supabase migration -- unpublish Maria, insert Amina's story
- No frontend code changes needed

### Result
- Homepage featured card shows Amina K.'s story from Nairobi
- Clicking it opens `/story-detail/{id}` with full story, progress ring, donate button
- Maria's story remains in the database for future reactivation
