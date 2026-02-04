
## Plan: Multi-Image Gallery for Fundraisers

### Problem Summary

The public fundraiser page (`/f/need-food-to-survive-i5nyg3`) currently shows a green heart placeholder because:
1. `cover_photo_url` is `null` - this fundraiser was created before the image upload fix
2. The current design shows a generic heart icon instead of a clear "no image" state
3. There's no way for the owner to add/edit images after creation

### Solution Overview

**Goal:** Support up to 3 images per fundraiser with a clean gallery display and owner editing capability.

---

### Part 1: Database Schema Update

Create a new `fundraiser_images` table to support multiple images:

```sql
CREATE TABLE fundraiser_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_fundraiser_images_fundraiser_id ON fundraiser_images(fundraiser_id);

-- RLS policies
ALTER TABLE fundraiser_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view images
CREATE POLICY "Public can view fundraiser images"
ON fundraiser_images FOR SELECT USING (true);

-- Owners can manage their images
CREATE POLICY "Owners can insert images"
ON fundraiser_images FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM fundraisers WHERE id = fundraiser_id AND user_id = auth.uid())
);

CREATE POLICY "Owners can delete images"
ON fundraiser_images FOR DELETE
USING (
  EXISTS (SELECT 1 FROM fundraisers WHERE id = fundraiser_id AND user_id = auth.uid())
);
```

---

### Part 2: Public Fundraiser Page - Hero Section Redesign

**File: `src/pages/PublicFundraiser.tsx`**

**When images exist:**
- Display a clean image gallery with the primary image prominently shown
- If multiple images, show thumbnail navigation below
- Maintain the 16:10 aspect ratio for consistency
- Smooth fade/slide transitions between images

**When NO images exist:**

For **public visitors (non-owners):**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│     ┌─────────────────────────────────────┐     │
│     │                                     │     │
│     │      ┌─────────────────────┐        │     │
│     │      │    📷 (muted icon)  │        │     │
│     │      └─────────────────────┘        │     │
│     │                                     │     │
│     │      No photos yet                  │     │
│     │                                     │     │
│     └─────────────────────────────────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```
- Clean, neutral gray background
- Muted camera icon
- Simple "No photos yet" text
- No distraction from the story content below

For **the fundraiser owner:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│     ┌─────────────────────────────────────┐     │
│     │                                     │     │
│     │        ┌───────────────────┐        │     │
│     │        │    📷 + icon      │        │     │
│     │        └───────────────────┘        │     │
│     │                                     │     │
│     │    [   + Add Photos (button)   ]    │     │
│     │    Upload up to 3 photos            │     │
│     │                                     │     │
│     └─────────────────────────────────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```
- Clear call-to-action to upload photos
- Explains the 3-image limit
- Button opens an upload modal

---

### Part 3: Image Upload Modal Component

**New File: `src/components/fundraiser/ImageUploadModal.tsx`**

A modal dialog that allows fundraiser owners to:
- Upload up to 3 images (drag & drop or click to select)
- Reorder images by dragging
- Set the primary/cover image
- Remove existing images

Features:
- Live preview of selected images
- Progress indicator during upload
- File validation (5MB max, image types only)
- Clear visual feedback

---

### Part 4: Update Existing Components

**Files to modify:**
1. `src/pages/PublicFundraiser.tsx` - Fetch and display gallery, detect owner, show upload CTA
2. `src/pages/FundraiserDashboard.tsx` - Show gallery in header, add "Manage Photos" button
3. `src/components/stories/FundraiserCard.tsx` - Show primary image from new table

---

### Implementation Approach

| Step | Description |
|------|-------------|
| 1 | Create `fundraiser_images` table with migration |
| 2 | Create `ImageUploadModal` component |
| 3 | Update `PublicFundraiser.tsx` to fetch images and show gallery/upload CTA |
| 4 | Update `FundraiserDashboard.tsx` to show images and management |
| 5 | Update `FundraiserCard.tsx` to use primary image from new table |
| 6 | Migrate existing `cover_photo_url` data to new table (optional) |

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/XXXXXX_create_fundraiser_images.sql` | Create new table |
| `src/components/fundraiser/ImageUploadModal.tsx` | New component |
| `src/pages/PublicFundraiser.tsx` | Add gallery + owner upload CTA |
| `src/pages/FundraiserDashboard.tsx` | Add photo management |
| `src/components/stories/FundraiserCard.tsx` | Use primary image |

---

### User Experience After Implementation

**For fundraiser owners:**
1. Visit their public page and see "Add Photos" if no images
2. Click to open upload modal
3. Drag and drop up to 3 images
4. Images are uploaded to storage and saved to `fundraiser_images` table
5. Gallery displays immediately on the public page

**For donors/visitors:**
1. See beautiful image gallery if photos exist
2. See clean "No photos yet" placeholder if no photos
3. Can still read the story and donate regardless

**On /stories page:**
1. Cards show the primary image from each fundraiser
2. Fallback to clean placeholder if no images

---

### Visual Design: Image Gallery (with images)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│    ┌───────────────────────────────────────┐    │
│    │                                       │    │
│    │          Primary Image                │    │
│    │          (16:10 aspect)               │    │
│    │                                       │    │
│    └───────────────────────────────────────┘    │
│                                                 │
│    ┌─────┐  ┌─────┐  ┌─────┐                    │
│    │ [1] │  │ [2] │  │ [3] │   ← Thumbnails     │
│    └─────┘  └─────┘  └─────┘                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

Clicking a thumbnail smoothly transitions to show that image as the primary.

