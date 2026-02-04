

## Plan: Auto-Activate Fundraisers & Fix Cover Photo Upload

### Problem Summary
Two issues identified on the fundraiser dashboard:

1. **Fundraisers stuck on "Under Review"**: All new fundraisers are created with `status: "pending"` and never become active
2. **Cover photo not showing**: The uploaded cover photo is never persisted—there's no storage bucket and no upload logic

---

### Solution Overview

**Issue 1: Auto-Activate Fundraisers**
Change the fundraiser creation to set `status: "active"` immediately instead of `"pending"`.

**Issue 2: Cover Photo Upload**
Create a Supabase storage bucket for cover photos and implement upload logic during fundraiser creation.

---

### Implementation Details

#### Part 1: Auto-Activate Fundraisers

**File: `src/pages/ApplyRecipient.tsx`**

Change line 367 from:
```typescript
status: "pending",
```
to:
```typescript
status: "active",
```

This single change makes all new fundraisers go live immediately without review.

---

#### Part 2: Set Up Storage Bucket

**Create new migration file** to set up storage for cover photos:

```sql
-- Create storage bucket for fundraiser cover photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fundraiser-covers', 'fundraiser-covers', true);

-- Allow anyone to view cover photos (public bucket)
CREATE POLICY "Public can view cover photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'fundraiser-covers');

-- Allow authenticated users to upload their own cover photos
CREATE POLICY "Users can upload cover photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fundraiser-covers' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own cover photos
CREATE POLICY "Users can update own cover photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'fundraiser-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own cover photos
CREATE POLICY "Users can delete own cover photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'fundraiser-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

#### Part 3: Upload Cover Photo During Submission

**Modify `src/pages/ApplyRecipient.tsx`**

Add upload logic to `createFundraiserForUser`:

```typescript
const createFundraiserForUser = async (userId: string) => {
  let coverPhotoUrl = null;
  
  // Upload cover photo if provided
  if (coverPhoto) {
    const fileExt = coverPhoto.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError, data: uploadData } = await supabase
      .storage
      .from('fundraiser-covers')
      .upload(fileName, coverPhoto);
    
    if (uploadError) {
      console.error('Cover photo upload error:', uploadError);
      // Continue without cover photo rather than failing the whole submission
    } else {
      const { data: urlData } = supabase
        .storage
        .from('fundraiser-covers')
        .getPublicUrl(fileName);
      
      coverPhotoUrl = urlData.publicUrl;
    }
  }
  
  // Create fundraiser with cover photo URL
  const { data: fundraiserData, error: fundraiserError } = await supabase
    .from("fundraisers")
    .insert({
      user_id: userId,
      title: title,
      story: story,
      category: category,
      beneficiary_type: beneficiaryType,
      monthly_goal: parseFloat(monthlyGoal),
      is_long_term: isLongTerm || false,
      unique_slug: generateUniqueSlug(title),
      country: country,
      zip_code: zipCode,
      status: "active",  // Auto-activate
      cover_photo_url: coverPhotoUrl,  // Add uploaded photo URL
    })
    .select()
    .single();
  
  // ... rest of function
};
```

---

### Files to Change

| File | Change |
|------|--------|
| `src/pages/ApplyRecipient.tsx` | Change status from "pending" to "active", add cover photo upload logic |
| `supabase/migrations/XXXXXX_create_fundraiser_covers_bucket.sql` | Create storage bucket with RLS policies |

---

### User Experience After Fix

1. **Fundraiser Creation**:
   - User uploads cover photo during the application wizard
   - Photo is uploaded to Supabase Storage on submit
   - Fundraiser is created with `status: "active"` immediately

2. **Dashboard View**:
   - Cover photo displays in the header card
   - Status badge shows "Active" (green) instead of "Under Review" (yellow)
   - Fundraiser is immediately visible to donors on public pages

3. **Public Page**:
   - Cover photo displays in the hero section
   - Donors can donate immediately (no waiting for approval)

