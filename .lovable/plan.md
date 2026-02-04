
## Plan: Fix Zoomed-In Images and Ensure Navigation Arrows

### Problem Analysis

1. **Image appears zoomed in**: The current CSS uses `object-cover` which crops/fills the container, cutting off parts of the image
2. **Navigation arrows**: Already implemented for multi-image galleries (lines 175-189), but only work with `fundraiser_images` table entries

### Solution

**Change the image display mode** from `object-cover` to `object-contain` with a subtle background, so the full image is visible without cropping.

---

### Implementation Details

#### File: `src/components/fundraiser/FundraiserGallery.tsx`

**Update all image containers to use `object-contain` instead of `object-cover`:**

| Section | Line | Change |
|---------|------|--------|
| Legacy fallback image | 54 | `object-cover` -> `object-contain` + add `bg-muted/50` |
| Single image | 144 | `object-cover` -> `object-contain` + add `bg-muted/50` |
| Multi-image gallery | 171 | `object-cover` -> `object-contain` + add `bg-muted/50` |
| Thumbnails | 225 | Keep `object-cover` (thumbnails should be cropped) |

**Changes:**

1. **Line 50** - Legacy fallback container:
```tsx
<div className="relative w-full h-64 lg:h-80 bg-muted/30">
```

2. **Line 54** - Legacy fallback image:
```tsx
className="w-full h-full object-contain"
```

3. **Line 140** - Single image container:
```tsx
<div className="relative w-full h-64 lg:h-80 bg-muted/30">
```

4. **Line 144** - Single image:
```tsx
className="w-full h-full object-contain"
```

5. **Line 167** - Multi-image container:
```tsx
<div className="relative w-full h-64 lg:h-80 overflow-hidden bg-muted/30">
```

6. **Line 171** - Multi-image gallery main image:
```tsx
className="w-full h-full object-contain transition-opacity duration-300"
```

---

### Visual Result

**Before:**
- Image cropped to fill container (zoomed in, parts cut off)

**After:**
- Full image visible within container
- Subtle background fills any empty space
- Image maintains original aspect ratio
- Navigation arrows already work for multiple images from `fundraiser_images` table

---

### Note on Navigation Arrows

The navigation arrows (left/right circles with chevrons) **already exist** in the code at lines 175-189. They appear automatically when there are 2+ images in the `fundraiser_images` table. 

For this specific fundraiser, it only has one legacy `cover_photo_url` image, so no arrows are needed. When fundraisers have multiple images uploaded through the new system, the arrows will appear automatically.
