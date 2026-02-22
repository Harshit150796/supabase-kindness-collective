

## Sync Admin Portal with Website Content

### Problem
The admin dashboard shows 0 for all content stats (stories, testimonials, blog posts, FAQ) because the CMS database tables are completely empty. The website displays content from hardcoded fallback files (`src/data/impactStories.ts`, `src/data/testimonials.ts`, and inline arrays in `FAQ.tsx`). Additionally, the stat cards on the admin dashboard are not clickable, so you can't navigate to manage those sections directly from the stats.

### Solution

Two-part fix:

**Part 1: Seed the CMS tables with the existing hardcoded data**

Insert the hardcoded content into the database so the admin portal can see and manage it. Once in the database, the website components (which already prefer CMS data over hardcoded fallbacks) will automatically use the managed data.

- **cms_stories** -- Insert 8 impact stories from `src/data/impactStories.ts` (Maria R., Martinez Family, David & Kids, Hope Community Center, Sarah T., James & Family, Sunshine After School, Eleanor P.)
- **cms_testimonials** -- Insert 4 testimonials from `src/data/testimonials.ts` (Sarah Chen, Maria G., James Wilson, Michael Torres)
- **cms_faq** -- Insert 8 FAQ items from the hardcoded array in `FAQ.tsx`

All items will be inserted with `is_published: true` so they appear immediately on both the website and admin dashboard.

**Part 2: Make admin dashboard stat cards clickable**

Update the stat cards in `AdminDashboard.tsx` so clicking on them navigates to the corresponding management page:

| Stat Card | Navigates To |
|-----------|-------------|
| Published Stories | /admin/stories |
| Blog Posts | /admin/blog |
| Testimonials | /admin/testimonials |
| FAQ Items | /admin/faq |
| Total Users | /admin/users |
| Pending Verifications | /admin/verifications |
| Total Coupons | /admin/coupons |
| Available Coupons | /admin/coupons |

### Technical Details

**Database inserts (using Supabase insert tool, NOT migrations):**

1. `INSERT INTO cms_stories` -- 8 rows with name, location, image_url, short_story, full_story, impact, category, donors_count, amount_raised, goal, is_published=true, display_order
2. `INSERT INTO cms_testimonials` -- 4 rows with quote, name, role, role_label, location, image_url, verified, is_published=true, display_order
3. `INSERT INTO cms_faq` -- 8 rows with question, answer, category='general', is_published=true, display_order

**Code changes:**

| File | Change |
|------|--------|
| `src/pages/admin/AdminDashboard.tsx` | Add `onClick` + `cursor-pointer` to all stat cards, navigating to their respective admin pages |

### How Sync Works Going Forward

Once the data is in the CMS tables, the existing architecture handles everything:
- **Website components** (`TestimonialsSection`, `FAQ`, `ImpactStories`) already check CMS data first and fall back to hardcoded data only if CMS is empty
- **Admin pages** (`AdminStories`, `AdminTestimonials`, `AdminFAQ`, `AdminBlog`) already have full CRUD (create, edit, delete, publish/unpublish) with React Query cache invalidation
- Any changes made in admin will automatically reflect on the website since both read from the same Supabase tables

