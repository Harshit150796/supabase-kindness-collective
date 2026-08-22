# Required photo + native capture picker

Make the cover photo a required part of the story step, and replace the single silent file input with a small action sheet offering Take Photo, Record Video, and Choose from Files — matching the native chooser pattern, working on both Android and iPhone.

## What changes for the user

- The "Add a photo" section becomes **required**: labelled "Required" instead of "Optional", and the Continue button on the Story step stays disabled until a photo (or video thumbnail-capable file) is selected.
- Tapping the upload area opens a bottom sheet with three clear choices:
  - **Camera** — opens the phone camera directly to take a photo
  - **Camera (Camcorder)** — opens the camera in video mode
  - **Files** — opens the normal gallery/file browser
- On desktop, the sheet shows only "Choose from Files" (no camera-only options), so nothing feels broken.
- Selected media shows the same preview card with Change / Remove. For a video, a poster frame is generated from the first seconds so the review step still has a hero image.
- The Review step's empty "Add a photo" state keeps working, but since a photo is now required, users can only reach Review with one attached.

## Technical notes

- `src/components/apply/steps/StoryStep.tsx`
  - Add three hidden inputs instead of one:
    - photo capture: `<input type="file" accept="image/*" capture="environment">`
    - video capture: `<input type="file" accept="video/*" capture="environment">`
    - library/files: `<input type="file" accept="image/*,video/*">` (no `capture`)
  - Trigger them from a shadcn `Drawer`/`Sheet` (bottom sheet on mobile, dialog on desktop) with icon tiles laid out like the reference screenshot.
  - Detect mobile with the existing `useIsMobile` hook to decide whether to render the camera tiles.
  - Extend validation to accept video types (`video/mp4`, `video/quicktime`, `video/webm`); raise the size cap for video to 25MB while keeping 5MB for images.
  - For video selections, draw frame ~0.1s into an offscreen `<canvas>` via a hidden `<video>` element to produce a JPEG data URL for `coverPhotoPreview`, keeping the original `File` in `coverPhoto`.
  - Label copy: "Add a photo" → "Add a photo or video", badge "Required".
  - iOS note: `capture` is honoured by Safari for `image/*`/`video/*`; where it isn't, the OS falls back to its own chooser, so behaviour degrades gracefully.
- `src/pages/ApplyRecipient.tsx`
  - `canContinue()` case 2 additionally requires `!!coverPhoto` (drafts don't restore the preview by design, so a resumed draft asks for the photo again — expected, and the Story step is where it's asked).
  - Upload path already handles any file extension; the storage upload keeps `contentType` from the file so videos upload correctly.
- No backend/schema changes: `cover_photo_url` stores either the image or the video URL as today.

## Verification

Run the wizard in a mobile viewport with Playwright: confirm Continue is blocked with no media, the sheet opens with three options, a file selection produces a preview and unblocks Continue, and the Review step shows the media as the hero.
