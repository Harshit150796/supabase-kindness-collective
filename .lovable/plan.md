

## Comprehensive CMS Admin Portal Enhancement

### Current State Analysis

After a thorough review of every admin page, landing section, and CMS hook, here are the gaps identified:

**Critical Issues:**
1. AdminStories page has full CRUD but the list cards don't visually indicate they're clickable for editing -- users can't tell the edit/delete buttons are functional at a glance
2. No delete confirmation dialogs anywhere -- one misclick permanently deletes content
3. No search or filtering on any admin content page
4. No "Preview on website" links from admin pages
5. No drag-and-drop or quick reorder for display_order -- requires manual number editing
6. HeroSection uses hardcoded `featuredStory` from `src/data/impactStories.ts` instead of CMS
7. HowItWorksSection is fully hardcoded -- no CMS integration
8. CTASection text is fully hardcoded
9. Footer contact info is hardcoded
10. About page is fully hardcoded
11. No bulk actions (bulk publish/unpublish, bulk delete)
12. No character counts or content length guidance for SEO
13. No SEO metadata fields (meta title, meta description) on blog posts or stories
14. Blog post content editor has no preview -- just a raw textarea

### Plan

#### Part 1: Delete Confirmation Dialogs (All Admin Pages)

Add an `AlertDialog` confirmation before deleting any content item across all admin CRUD pages:
- AdminStories
- AdminTestimonials 
- AdminBlog
- AdminFAQ
- AdminContent

This prevents accidental data loss from a single click.

#### Part 2: Search and Filtering

Add a search bar to each admin content page so admins can quickly find items:
- **AdminStories**: Search by name, location, or category
- **AdminTestimonials**: Search by name or quote text
- **AdminBlog**: Search by title, category, or tags
- **AdminFAQ**: Search by question text or category
- **AdminContent**: Already grouped by section, add search by key name

#### Part 3: SEO Metadata Fields for Blog Posts

Add `meta_title` and `meta_description` fields to the blog post form (stored in the existing `cms_posts` table -- will need a migration to add these columns). This lets admins write custom SEO titles and descriptions for each blog post, which is critical for search rankings.

**Database migration:**
- Add `meta_title TEXT` and `meta_description TEXT` columns to `cms_posts`

#### Part 4: Blog Post Content Preview

Add a "Preview" tab in the blog post editor dialog so admins can see how the markdown content will render before publishing, instead of guessing from raw text.

#### Part 5: "Preview on Website" Links

Add a button/link on each admin page that opens the corresponding public page in a new tab:
- Stories page: Link to /stories
- Testimonials: Link to / (homepage, testimonials section)
- Blog: Link to /blog
- FAQ: Link to /faq
- Site Content: Link to /

#### Part 6: Quick Reorder with Up/Down Buttons

Replace the manual "Display Order" number input with up/down arrow buttons on each card in the list view for Stories, Testimonials, and FAQ. This makes reordering intuitive instead of requiring users to type numbers.

#### Part 7: Bulk Publish/Unpublish

Add a "Select All" checkbox and bulk action bar to Stories, Testimonials, Blog, and FAQ pages so admins can publish or unpublish multiple items at once.

#### Part 8: Character Count Guidance

Add character counts with SEO guidance to key text fields:
- Blog post titles: show count with "Recommended: 50-60 characters for SEO"
- Blog meta descriptions: "Recommended: 150-160 characters"
- Story short descriptions: show current character count
- FAQ answers: show character count

#### Part 9: HeroSection CMS Integration

Connect the hero section's featured story to CMS data. Instead of importing from the hardcoded `impactStories.ts`, use the first published CMS story (or one marked as "featured"). Falls back to the hardcoded data if no CMS stories exist.

#### Part 10: Empty State Improvements

Improve all empty states across admin pages with:
- More descriptive empty state messages
- An illustration or icon
- A prominent "Create your first..." CTA button

### Technical Details

**Database migration (cms_posts table):**
```sql
ALTER TABLE cms_posts ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE cms_posts ADD COLUMN IF NOT EXISTS meta_description TEXT;
```

**Files to modify:**

| File | Changes |
|------|---------|
| `src/pages/admin/AdminStories.tsx` | Add delete confirmation, search bar, up/down reorder buttons, bulk actions, preview link, improved empty state |
| `src/pages/admin/AdminTestimonials.tsx` | Add delete confirmation, search bar, up/down reorder buttons, bulk actions, preview link |
| `src/pages/admin/AdminBlog.tsx` | Add delete confirmation, search bar, SEO fields (meta_title, meta_description), content preview tab, character counts, bulk actions, preview link |
| `src/pages/admin/AdminFAQ.tsx` | Add delete confirmation, search bar, up/down reorder buttons, bulk actions, preview link |
| `src/pages/admin/AdminContent.tsx` | Add delete confirmation, search filter by key name |
| `src/components/landing/HeroSection.tsx` | Replace hardcoded `featuredStory` import with CMS hook, fallback to hardcoded |
| `src/hooks/useCMSContent.ts` | No changes needed -- existing hooks are sufficient |

**No changes needed for:**
- Routing (all admin routes already registered)
- RLS policies (all CMS tables already have proper admin policies)
- Storage (cms-images bucket already exists and is public)

### Implementation Priority

The changes will be implemented in this order:
1. Delete confirmations (safety first)
2. Search bars (most impactful UX improvement)
3. Preview links (quick win)
4. SEO fields + blog preview (high SEO value)
5. Character counts (SEO guidance)
6. Reorder buttons (UX polish)
7. Bulk actions (power-user feature)
8. HeroSection CMS integration (content sync)
9. Empty state improvements (polish)

