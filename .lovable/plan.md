# Add photo editing inside the fundraiser panel

## Why you can't find it
The "Images & legacy editor" button sits at the top of the Fundraisers list. When you open a fundraiser, the side panel covers that button, so the panel itself has no way to edit photos.

## What changes
- **New "Images" tab** in the fundraiser panel, next to Overview, Donations and the others.
- The tab shows the cover photo and every gallery photo as thumbnails. Each photo has three buttons:
  - **Make cover**: sets it as the main photo on the public page.
  - **Remove**: deletes it, after you confirm.
  - **Move up / down**: changes the order photos appear in.
- **Upload photos** button: same limits as today (up to 3 gallery photos, 5MB each, image files only).
- **Photo button on the panel's top row**, so it's visible as soon as you open a fundraiser.
- Viewers can see the photos but can't change them. Staff and admins can edit.
- Every photo change is saved to the audit log and appears in the fundraiser's History tab.
- The old separate photo page still works, but the panel no longer depends on it.

## Technical details
- New `FundraiserImagesTab` component in `src/components/admin/`, reusing the upload helper and photo-handling logic from `AdminFundraisersLegacy.tsx`.
- Changes to `fundraiser_images` and `fundraisers.cover_photo_url` go through `adminWrite` (role-checked and audited). No new database tables.
- After each change, the panel's details and the photo list refresh.
- Check that staff can upload to the photo storage area. If storage permissions block staff, report it and add the permission only after you approve it.
- Payments, totals and the public page layout stay the same.
