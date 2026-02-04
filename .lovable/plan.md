
## Plan: Fix Missing Image on Fundraiser Dashboard

### Root Cause

The `FundraiserDashboard.tsx` page does not pass the `coverPhotoUrl` prop to the `FundraiserGallery` component. We just added this prop for the public page (`PublicFundraiser.tsx`), but forgot to do the same for the owner's dashboard.

**Current code (line 350-355):**
```tsx
<FundraiserGallery
  images={images}
  isOwner={true}
  onAddPhotos={() => setShowImageModal(true)}
  fundraiserTitle={fundraiser.title}
/>
```

The `coverPhotoUrl` prop is missing, so when `fundraiser_images` is empty, the gallery shows the upload zone instead of the legacy image.

---

### Solution

Add the `coverPhotoUrl` prop to the `FundraiserGallery` component in `FundraiserDashboard.tsx`:

**File: `src/pages/FundraiserDashboard.tsx`**

Update lines 350-355:

```tsx
<FundraiserGallery
  images={images}
  isOwner={true}
  onAddPhotos={() => setShowImageModal(true)}
  fundraiserTitle={fundraiser.title}
  coverPhotoUrl={fundraiser.cover_photo_url}
/>
```

---

### Result

After this change, the dashboard will:
1. Show the uploaded image from the legacy `cover_photo_url` field
2. Display a subtle "Manage Photos" button for the owner to add more images
3. Match the behavior of the public fundraiser page

---

### File to Modify

| File | Change |
|------|--------|
| `src/pages/FundraiserDashboard.tsx` | Add `coverPhotoUrl={fundraiser.cover_photo_url}` prop (line 355) |
