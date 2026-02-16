

## Plan: Enhanced Admin Dashboard Overview

The admin sidebar already has all the navigation links, but the main dashboard page (`/admin`) only displays 3 quick action cards out of 10 available features. This makes it look like CMS editing capabilities don't exist.

### Changes

**File: `src/pages/admin/AdminDashboard.tsx`**

Redesign the overview page to clearly surface all admin capabilities in organized sections:

**1. Stats Row (keep existing)** -- Total Users, Pending Verifications, Total Coupons, Available Coupons

**2. Pending Verifications Alert (keep existing)** -- Yellow banner when there are pending approvals

**3. Quick Actions -- reorganized into two groups:**

**Platform Management (first row of cards):**
- Manage Users -- View and manage all users, promote to admin
- Verifications -- Approve/reject recipient applications
- Coupons -- View and manage coupon inventory
- Analytics -- View signup trends, donation charts, platform stats

**Content Management (second row of cards):**
- Site Content -- Edit hero text, CTA buttons, section titles
- Impact Stories -- Add/edit/delete stories with photos, toggle featured
- Testimonials -- Manage donor and recipient quotes
- Blog Posts -- Write and publish articles with cover images
- FAQ -- Add/edit questions and answers

Each card will have an icon, title, short description, and arrow to navigate. The CMS section will have a clear "Content Management" header so the admin immediately sees they can edit website content.

### Additional Improvements

**Add CMS stats to the stats row:** Add a new row showing content counts:
- Published Stories count
- Published Blog Posts count  
- Testimonials count
- FAQ Items count

This gives the admin a quick overview of how much content exists.

### Files Modified

| File | Change |
|------|--------|
| `src/pages/admin/AdminDashboard.tsx` | Add all 9 quick action cards organized in 2 sections, add CMS content stats row |

No new files needed -- this is purely a UI reorganization of the existing dashboard page to make all features visible and discoverable.
