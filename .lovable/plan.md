
## Plan: Fix Missing Fundraiser Images on Public Page

### Root Cause

The database shows this fundraiser has a `cover_photo_url` (legacy field):
```
cover_photo_url: https://vbnbacowuoeeojjdrzzp.supabase.co/storage/v1/object/public/fundraiser-covers/...
```

But the `fundraiser_images` table has NO entries for this fundraiser (the newer image system).

The `FundraiserGallery` component only checks the `images` array from the `fundraiser_images` table. When empty, it shows "Photos coming soon" instead of falling back to `cover_photo_url`.

---

### Solution

Update both files to support fallback to the legacy `cover_photo_url`:

---

### File 1: `src/components/fundraiser/FundraiserGallery.tsx`

**Add a new prop for the legacy cover photo:**

```typescript
interface FundraiserGalleryProps {
  images: FundraiserImage[];
  isOwner: boolean;
  onAddPhotos?: () => void;
  fundraiserTitle: string;
  coverPhotoUrl?: string | null;  // ADD: Legacy fallback
}
```

**Update the empty state check to use fallback image:**

The logic at line 44-107 needs to change:
- If `images.length === 0` but `coverPhotoUrl` exists, display that image
- Only show "Photos coming soon" or upload zone if BOTH are empty

```typescript
// No images in fundraiser_images table
if (images.length === 0) {
  // Check for legacy cover_photo_url fallback
  if (coverPhotoUrl) {
    return (
      <div className="relative w-full h-64 lg:h-80">
        <img
          src={coverPhotoUrl}
          alt={fundraiserTitle}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {isOwner && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-4 right-4 gap-1.5 backdrop-blur-sm"
            onClick={onAddPhotos}
          >
            <Camera className="w-4 h-4" />
            Manage Photos
          </Button>
        )}
      </div>
    );
  }

  // No images at all - show placeholder
  if (isOwner) {
    // ... existing owner upload zone ...
  }

  // Visitor view - minimal placeholder
  return (
    <div className="w-full h-28 lg:h-32 flex items-center justify-center bg-muted/30">
      <div className="flex items-center gap-2.5 text-muted-foreground/70">
        <Camera className="w-5 h-5" />
        <span className="text-sm">Photos coming soon</span>
      </div>
    </div>
  );
}
```

---

### File 2: `src/pages/PublicFundraiser.tsx`

**Pass the legacy cover_photo_url to FundraiserGallery:**

Update line 247-252:

```typescript
<FundraiserGallery
  images={images}
  isOwner={isOwner}
  onAddPhotos={() => setShowImageModal(true)}
  fundraiserTitle={fundraiser.title}
  coverPhotoUrl={fundraiser.cover_photo_url}  // ADD: Legacy fallback
/>
```

---

### Summary

| File | Change |
|------|--------|
| `src/components/fundraiser/FundraiserGallery.tsx` | Add `coverPhotoUrl` prop, display legacy image when no `fundraiser_images` exist |
| `src/pages/PublicFundraiser.tsx` | Pass `fundraiser.cover_photo_url` to gallery component |

---

### Image Display Priority (After Fix)

1. Images from `fundraiser_images` table (primary first)
2. Legacy `cover_photo_url` field
3. Owner upload zone / Visitor "Photos coming soon" placeholder

This ensures ALL fundraisers with uploaded images display them correctly, whether they use the new table or the legacy field.
