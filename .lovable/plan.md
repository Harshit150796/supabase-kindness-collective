

## Add Image Upload and Management to Admin Fundraiser Editor

### Problem
The edit dialog only has a plain text input for "Cover Photo URL" — no way to upload images, view existing gallery images, or manage the `fundraiser_images` table. Admins need full image control.

### What gets built

Replace the "Cover Photo URL" text field in the edit dialog with a full image management section:

1. **Current images display** — Show all images from `fundraiser_images` table for the fundraiser being edited, with:
   - Thumbnail grid (same pattern as `ImageUploadModal`)
   - "Set as Cover" button per image
   - Delete button per image
   - Primary/cover badge on the current primary image

2. **Upload button** — File picker that uploads to the `fundraiser-covers` storage bucket and inserts into `fundraiser_images` table (max 3 images, same as existing limit)

3. **Legacy cover photo** — Keep the cover_photo_url text input as a fallback field, but show it collapsed/secondary since the gallery system is preferred

4. **RLS for admin image management** — Add policies so admins can INSERT, UPDATE, and DELETE `fundraiser_images` for any fundraiser (currently only owners can)

### Files changed

1. **Migration** — Add admin RLS policies on `fundraiser_images` for INSERT, UPDATE, DELETE
2. **`src/pages/admin/AdminFundraisers.tsx`** — Add state for fundraiser images, fetch them when opening edit dialog, add image grid with upload/delete/set-primary functionality inside the edit dialog

### Technical approach
- When `openEdit(f)` is called, also fetch `fundraiser_images` for that fundraiser ID
- Upload uses same pattern as `ImageUploadModal`: upload to `fundraiser-covers` bucket, insert row into `fundraiser_images`
- Delete removes from both storage and database
- Set primary unsets all then sets selected
- All within the existing edit `Dialog`, replacing the URL text input with a visual image manager

