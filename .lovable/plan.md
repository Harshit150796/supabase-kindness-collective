# Multi-photo/video upload with a proper media tray

Turn the single "Add a photo or video" slot into a small managed gallery: up to 5 items, thumbnails you can see and delete, a clear count, and per-file upload status with a progress ring and a success check.

## What changes for the user

- **Add up to 5 items** (photos and/or short videos). The action sheet (Camera / Camcorder / Files) stays; Files now allows selecting several at once.
- **Thumbnail tray**: selected media shows as a row of square thumbnails under a big preview of the cover item.
  - Header shows the count, e.g. "2 of 5 added".
  - Each thumbnail has an X to remove it, a "Cover" badge on the first one, a play icon + duration on videos.
  - Tap a thumbnail to make it the cover (the hero used on the Review step and the fundraiser card).
  - A trailing "+" tile opens the same picker to add more.
- **Live upload status per item**: each file starts uploading to storage as soon as it's picked.
  - Circular progress ring with percentage while uploading.
  - Green check when done, "Uploaded" state.
  - Red retry state if it fails, with a Retry button and an error toast.
- **Continue is blocked** until at least one item has finished uploading (still required), and while any upload is in flight the button shows "Uploading…" so nobody submits mid-upload.
- **Size / length caps** with friendly rejection toasts:
  - Images: 10 MB each
  - Videos: 100 MB each and max 90 seconds
  - Max 5 items total; extra selections are rejected with a message naming how many slots are left.
- Review step keeps showing the cover as the hero, plus a small strip of the other thumbnails.

## Technical notes

- `src/components/apply/steps/StoryStep.tsx`
  - Replace the single `coverPhoto`/`coverPhotoPreview` props with a `media: MediaItem[]` + `setMedia` pair.
    `MediaItem = { id, file, kind: "image" | "video", previewUrl, durationSec?, status: "pending" | "uploading" | "done" | "error", progress, storagePath?, publicUrl? }`
  - Keep the three hidden inputs; add `multiple` to the library input.
  - Reuse the existing `getVideoPoster` helper for video thumbnails; read `video.duration` for the duration badge and the 90s cap.
  - New sub-components in the same folder: `MediaTray.tsx` (grid of tiles, remove/set-cover/add) and `UploadRing.tsx` (SVG progress ring + check/retry states).
- `src/lib/mediaUpload.ts` (new)
  - `uploadMediaItem(item, userId | anonKey, onProgress)` uploading to the existing `fundraiser-covers` bucket via `supabase.storage.from(...).upload()`.
  - Since supabase-js v2 doesn't emit upload progress, use an `XMLHttpRequest` PUT to the storage REST endpoint (`/storage/v1/object/fundraiser-covers/<path>`) with the session token so `xhr.upload.onprogress` drives the real percentage; fall back to the SDK call with an indeterminate ring if the token is unavailable.
  - Guests (not yet signed in at the Story step) upload under a per-draft `anon/<uuid>/…` prefix; needs an RLS policy on `storage.objects` allowing insert into that prefix, or — simpler and preferred — defer the actual upload for guests until sign-in and show the ring during the post-auth upload while keeping local previews and validation identical. Decision below.
- `src/pages/ApplyRecipient.tsx`
  - Hold `media` state; persist only metadata (not blobs) in the draft, matching today's security choice.
  - `canContinue()` case 2: `enoughWords && media.some(done) && !media.some(uploading)`.
  - `createFundraiserForUser`: first `done` item's URL → `fundraisers.cover_photo_url`; all items inserted into `fundraiser_images` with `display_order` and `is_primary` on the cover. Any items still local (guest path) upload here before insert.
- `src/components/apply/steps/ReviewStep.tsx`
  - Accept `media` instead of a single preview; hero = cover item, thumbnail strip beneath, "Edit" jumps back to Story.
- No schema migration required — `fundraiser_images` already has `image_url`, `display_order`, `is_primary`.

## Verification

Playwright on a mobile viewport: pick two files, confirm the count reads "2 of 5 added", rings complete to checks, removing one updates the count and cover, Continue stays disabled until an upload completes, and the Review step shows the cover plus the strip.
