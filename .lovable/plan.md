

## Plan: Fix Fundraiser Dashboard UI/UX, Image Display & Add Delete Functionality

### Problem Summary

Based on my analysis:

1. **Cover photo shows placeholder instead of uploaded image**
   - The fundraiser has `cover_photo_url: null` in the database
   - No entries exist in `fundraiser_images` table for this fundraiser
   - The FundraiserDashboard doesn't use the new gallery system

2. **UI/UX issues on the dashboard**
   - The layout has awkward spacing and positioning
   - The header card shows a generic heart icon instead of photos
   - No integration with the `FundraiserGallery` component

3. **No delete option for fundraiser owners**
   - Missing UI to delete a fundraiser
   - Missing RLS policy to allow owners to delete their fundraisers

---

### Solution Overview

**Part 1: Update FundraiserDashboard to use the gallery system**
- Fetch images from `fundraiser_images` table
- Integrate the `FundraiserGallery` component in the header
- Add the `ImageUploadModal` for managing photos

**Part 2: Improve overall UI/UX**
- Better spacing and responsive layout
- Cleaner header card design
- Improved visual hierarchy

**Part 3: Add delete fundraiser functionality**
- Add RLS policy to allow owners to delete their fundraisers
- Add a "Delete Fundraiser" button with confirmation dialog
- Handle cascading deletion of images

---

### Implementation Details

#### Part 1: Database Migration - Enable Fundraiser Deletion

```sql
-- Allow users to delete their own fundraisers
CREATE POLICY "Users can delete own fundraisers"
ON fundraisers FOR DELETE
USING (auth.uid() = user_id);

-- Cleanup: Delete associated images when fundraiser is deleted
-- (Already handled by ON DELETE CASCADE on fundraiser_images)
```

#### Part 2: Update FundraiserDashboard.tsx

**Changes:**

1. **Import and state management**
   - Import `FundraiserGallery` and `ImageUploadModal` components
   - Add state for `images`, `showImageModal`, `showDeleteDialog`
   - Add `fetchImages` function

2. **Replace header card** with integrated gallery
   ```tsx
   {/* Before: Simple cover photo or heart placeholder */}
   {/* After: Full FundraiserGallery component */}
   <FundraiserGallery
     images={images}
     isOwner={true}
     onAddPhotos={() => setShowImageModal(true)}
     fundraiserTitle={fundraiser.title}
   />
   ```

3. **Add Quick Actions**
   - Keep existing: Edit, Copy link, Invite co-organizers
   - Add: **Delete Fundraiser** button (destructive styling)

4. **Add Delete Confirmation Dialog**
   ```tsx
   <AlertDialog open={showDeleteDialog}>
     <AlertDialogContent>
       <AlertDialogHeader>
         <AlertDialogTitle>Delete Fundraiser?</AlertDialogTitle>
         <AlertDialogDescription>
           This action cannot be undone. All data including photos 
           and donation history will be permanently deleted.
         </AlertDialogDescription>
       </AlertDialogHeader>
       <AlertDialogFooter>
         <AlertDialogCancel>Cancel</AlertDialogCancel>
         <AlertDialogAction onClick={handleDelete}>
           Delete
         </AlertDialogAction>
       </AlertDialogFooter>
     </AlertDialogContent>
   </AlertDialog>
   ```

5. **Improve layout spacing**
   - Adjust padding and margins for cleaner look
   - Better responsive breakpoints
   - Consistent card shadows and borders

#### Part 3: Visual Design Improvements

**Header Section (with Gallery):**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│     ┌─────────────────────────────────────────────┐     │
│     │                                             │     │
│     │        FundraiserGallery Component          │     │
│     │     (shows photos or "Add Photos" CTA)      │     │
│     │                                             │     │
│     └─────────────────────────────────────────────┘     │
│                                                         │
│  [Active ✓]                                             │
│                                                         │
│  Fundraiser Title                                       │
│  Created Jan 7, 2026 • Food & Groceries                 │
│                                                         │
│  [View ↗]  [Share]  [Edit]                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Quick Actions Card:**
```
┌─────────────────────────┐
│  Quick Actions          │
├─────────────────────────┤
│  ✏️  Edit fundraiser    │
│  📋  Copy link          │
│  📸  Manage photos      │
│  👥  Invite co-organizers│
│  ─────────────────────  │
│  🗑️  Delete fundraiser  │  ← Destructive action
└─────────────────────────┘
```

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/XXXXXX_allow_fundraiser_delete.sql` | Add DELETE policy |
| `src/pages/FundraiserDashboard.tsx` | Major refactor with gallery, delete, improved UI |

---

### Technical Changes in FundraiserDashboard.tsx

1. **New imports:**
   - `FundraiserGallery`, `ImageUploadModal`
   - `AlertDialog` components
   - `Trash2` icon

2. **New state:**
   ```typescript
   const [images, setImages] = useState<FundraiserImage[]>([]);
   const [showImageModal, setShowImageModal] = useState(false);
   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   ```

3. **New functions:**
   - `fetchImages()` - Fetch from `fundraiser_images` table
   - `handleDeleteFundraiser()` - Delete fundraiser and redirect

4. **Layout improvements:**
   - Remove old cover photo section
   - Add `FundraiserGallery` at top of page (full-width, no card wrapper)
   - Better grid spacing with `gap-6`
   - Consistent border radius (`rounded-2xl`)

---

### User Experience After Fix

1. **Existing fundraisers with no images:**
   - Show clean "No photos yet" state
   - Owner sees "Add Photos" button
   - Click opens ImageUploadModal

2. **After uploading photos:**
   - Photos display in gallery with navigation
   - Primary photo shows as main image
   - "Manage Photos" button to add/remove/reorder

3. **Delete functionality:**
   - Delete button visible in Quick Actions
   - Confirmation dialog prevents accidental deletion
   - After deletion, redirect to My Fundraisers page

4. **Overall polish:**
   - Consistent spacing and visual hierarchy
   - Responsive on mobile and desktop
   - Professional, trustworthy appearance

