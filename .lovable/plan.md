# Clear, GoFundMe-style main photo on fundraiser pages

## What's wrong today
The big photo has a fade over it that washes the bottom into the page background, so the lower part looks blurred. The frame is also a short, wide strip (256px tall, 320px on laptops), so most photos get their top and bottom cut off.

## How GoFundMe does it
One large, sharp photo at the top of the story in a rounded 4:3 frame, with nothing laid over it: no fade or tint. When there are several photos, small thumbnails sit in a row underneath, and clicking one swaps the main photo. Arrows and the photo count are small and sit at the edges.

## Changes
- Remove the bottom fade from every version of the main photo (single photo, cover photo and multi-photo).
- Give the frame a 4:3 shape on every screen size instead of the short strip, with the existing rounded corners.
- Show the whole photo without cropping, as the project requires. If a photo's shape doesn't match the frame, the gap is filled with a soft, blurred copy of the same photo, so the frame never shows empty bars. The photo itself stays sharp.
- Load a larger, sharper version of the photo for big and high-resolution screens (up to 1600px wide).
- Several photos: move the thumbnails out of the box floating over the photo into a clean row underneath, GoFundMe-style. The selected thumbnail gets a green outline, and the arrows and "1 / 3" count stay small on the photo's edges.
- The "Add photos" button for organizers stays where it is.

## Technical details
- File: `src/components/fundraiser/FundraiserGallery.tsx` only.
- Delete the three `bg-gradient-to-t from-background…` overlays.
- Replace `h-64 lg:h-80` with `aspect-[4/3]`. The main `<img>` uses `object-contain`, and a `aria-hidden` background `<img>` uses `object-cover blur-2xl scale-110 opacity-60`.
- Add 1600 to the sizes and srcset, and update the width/height hints to 1200×900.
- Thumbnail strip: a normal flex row under the frame (`mt-3 gap-2 overflow-x-auto`), 64px thumbnails, with `ring-2 ring-primary` on the active one.
- I'll check it in the browser on a phone and a laptop on the fundraiser page you're viewing. Nothing is published.
