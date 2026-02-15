

## Plan: CMS + Enhanced Admin Analytics

This plan covers two major features:
1. A **Content Management System (CMS)** so non-technical team members can edit website text, add blog posts/articles, manage impact stories, and upload images -- all from the admin dashboard
2. An **Enhanced Admin Analytics** page with visual charts for signup trends, donation metrics, role breakdowns, and a recent users table

---

### Part 1: Content Management System (CMS)

#### What is this?

A CMS lets your team update the website content (hero text, testimonials, impact stories, blog posts, images) without touching any code. They simply log into the admin dashboard, click "Content", and edit things through simple forms.

#### What content will be manageable?

| Content Type | What it controls | Currently |
|-------------|------------------|-----------|
| **Site Content** | Hero headline, subtext, CTA buttons, section titles | Hardcoded in components |
| **Impact Stories** | Stories shown on homepage and /stories page | Hardcoded in `impactStories.ts` |
| **Testimonials** | Donor/recipient quotes on landing page | Hardcoded in `testimonials.ts` |
| **Blog Posts** | News, articles, updates (NEW) | Does not exist yet |
| **FAQ Items** | Questions and answers on FAQ page | Hardcoded |

#### Database Tables (New)

**Table: `cms_content`** -- for editable site text (hero, section titles, etc.)

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| content_key | text (unique) | Identifier like "hero_title", "cta_subtitle" |
| content_value | text | The actual text content |
| content_type | text | "text", "rich_text", "image_url" |
| section | text | Grouping: "hero", "cta", "how_it_works" |
| updated_by | uuid | Who last edited |
| updated_at | timestamp | When last edited |

**Table: `cms_stories`** -- replaces hardcoded impact stories

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| name | text | Story subject name |
| location | text | City, State |
| image_url | text | Main photo |
| short_story | text | Summary shown in cards |
| full_story | text | Full story on detail page |
| impact | text | Impact badge text |
| category | text | family, child, emergency, community |
| donors_count | integer | Number of donors |
| amount_raised | numeric | Amount raised |
| goal | numeric | Fundraising goal |
| is_published | boolean | Show/hide on website |
| display_order | integer | Sort order |
| created_at | timestamp | When created |

**Table: `cms_testimonials`** -- replaces hardcoded testimonials

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| quote | text | The testimonial text |
| name | text | Person's name |
| role | text | donor, recipient, partner |
| role_label | text | "Verified Donor", etc. |
| location | text | City, State |
| image_url | text | Avatar photo |
| is_published | boolean | Show/hide |
| display_order | integer | Sort order |
| created_at | timestamp | When created |

**Table: `cms_posts`** -- blog/articles (NEW feature)

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| title | text | Post title |
| slug | text (unique) | URL-friendly identifier |
| excerpt | text | Short summary |
| content | text | Full article body (markdown) |
| cover_image_url | text | Featured image |
| author_id | uuid | Who wrote it |
| category | text | news, update, guide, story |
| tags | text[] | Searchable tags |
| is_published | boolean | Draft vs published |
| published_at | timestamp | When published |
| created_at | timestamp | When created |

**Table: `cms_faq`** -- replaces hardcoded FAQ

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| question | text | The question |
| answer | text | The answer (supports markdown) |
| category | text | Group: "general", "donation", "recipient" |
| display_order | integer | Sort order |
| is_published | boolean | Show/hide |

All tables will have RLS policies restricting write access to admin users only, with public read access for published content.

#### Admin CMS Pages (New)

These pages are added to the admin sidebar:

1. **Admin Content** (`/admin/content`) -- Edit site text
   - Grouped by section (Hero, CTA, How It Works, etc.)
   - Simple text fields with "Save" buttons
   - Preview of where the text appears

2. **Admin Stories** (`/admin/stories`) -- Manage impact stories
   - Table of all stories with publish/unpublish toggles
   - "Add Story" form with all fields
   - Edit existing stories
   - Drag to reorder

3. **Admin Testimonials** (`/admin/testimonials`) -- Manage testimonials
   - Same pattern as stories
   - Add/edit/delete/reorder

4. **Admin Blog** (`/admin/blog`) -- Create articles
   - List of posts with draft/published status
   - Rich text editor for writing posts
   - Cover image upload
   - Publish/unpublish toggle

5. **Admin FAQ** (`/admin/faq`) -- Manage FAQ items
   - Add/edit/delete questions
   - Group by category
   - Reorder

#### Frontend Changes

- **Landing page components** (`HeroSection`, `ImpactStories`, `TestimonialsSection`, etc.) will fetch content from `cms_*` tables instead of hardcoded data files
- A **custom hook** `useCMSContent(section)` will handle fetching and caching via React Query
- Fallback to current hardcoded values if CMS has no data (smooth migration)
- New `/blog` page and `/blog/:slug` page for articles

#### Storage Bucket

- Create a new `cms-images` public storage bucket for uploading images through the CMS

#### Admin Sidebar Update

Add new navigation items for admin users:

```
Overview
Users
Verifications
Coupons
Analytics
---
Content        (NEW)
Stories        (NEW)
Testimonials   (NEW)
Blog Posts     (NEW)
FAQ            (NEW)
```

---

### Part 2: Enhanced Admin Analytics

Replace the current basic stat cards with a rich, visual analytics dashboard.

#### New Sections

1. **Summary KPI Cards** (top row)
   - Total Users (with growth % vs last month)
   - Total Donations (sum of all donation amounts)
   - Active Coupons
   - Conversion Rate

2. **Signup Trend Chart** (Recharts AreaChart)
   - Shows new user registrations over time (daily/weekly/monthly)
   - Data from `profiles.created_at` grouped by date

3. **Donation Trends Chart** (Recharts BarChart)
   - Shows donation amounts over time
   - Data from `donations.created_at` and `donations.amount`

4. **Role Breakdown Pie Chart** (Recharts PieChart)
   - Visual split of donors vs recipients vs admins
   - Data from `user_roles` table

5. **Recent Users Table**
   - Last 10 signups showing name, email, date joined, roles
   - Data from `profiles` joined with `user_roles`

6. **Top Brands by Donation** (Recharts BarChart)
   - Which brands get the most donation allocations
   - Data from `donation_brands` table

7. **Coupon Status Breakdown** (Recharts PieChart)
   - Available vs Reserved vs Redeemed
   - Data from `coupons.status`

#### Data Queries

All analytics data comes from existing tables -- no new tables needed:
- `profiles` for user signups over time
- `user_roles` for role distribution
- `donations` for donation trends and totals
- `donation_brands` for brand popularity
- `coupons` for coupon status breakdown

#### Date Range Filter

Add a date range selector (Last 7 days / 30 days / 90 days / All time) at the top of the analytics page.

---

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/[ts]_create_cms_tables.sql` | All CMS tables + RLS + storage bucket |
| `src/hooks/useCMSContent.ts` | Hook to fetch/cache CMS content |
| `src/pages/admin/AdminContent.tsx` | Edit site text |
| `src/pages/admin/AdminStories.tsx` | Manage impact stories |
| `src/pages/admin/AdminTestimonials.tsx` | Manage testimonials |
| `src/pages/admin/AdminBlog.tsx` | Manage blog posts |
| `src/pages/admin/AdminFAQ.tsx` | Manage FAQ |
| `src/pages/Blog.tsx` | Public blog listing page |
| `src/pages/BlogPost.tsx` | Individual blog post page |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminAnalytics.tsx` | Complete rewrite with Recharts charts |
| `src/components/layout/DashboardLayout.tsx` | Add CMS nav items for admin |
| `src/App.tsx` | Add new routes |
| `src/components/landing/HeroSection.tsx` | Fetch from CMS with hardcoded fallback |
| `src/components/landing/ImpactStories.tsx` | Fetch from `cms_stories` with fallback |
| `src/components/landing/TestimonialsSection.tsx` | Fetch from `cms_testimonials` with fallback |
| `src/pages/FAQ.tsx` | Fetch from `cms_faq` with fallback |
| `src/components/layout/Navbar.tsx` | Add Blog link |

---

### Implementation Order

1. Database migration (all CMS tables + RLS + storage)
2. Enhanced Admin Analytics page (charts, tables, filters)
3. CMS hook and admin content pages
4. Update frontend components to read from CMS
5. Blog pages (listing + detail)
6. Seed initial CMS data from current hardcoded values

---

### How Your Team Will Use It

Once built, any admin can:
1. Log in to the admin dashboard
2. Click "Content" to edit hero text, section titles, button labels
3. Click "Stories" to add/edit/remove impact stories with photos
4. Click "Blog Posts" to write and publish articles
5. Click "Testimonials" to manage quotes
6. Click "FAQ" to add/edit questions and answers
7. All changes appear on the live site immediately -- no code changes needed

