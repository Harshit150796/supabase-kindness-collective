

## Fix Paul Savluc's Photo -- Keep Real Background, Crop to Face & Shoulders

### Problem
The previous edit removed Paul's background entirely, making it look artificial. The user wants the original photo kept natural with its real background, just cropped tighter to focus on face and shoulders.

### Approach

1. **Use the newly uploaded photo** (`WhatsApp_Image_paul1.JPG`) as the source -- it already has a nice composition with Paul and the castle background.
2. **AI image edit**: Crop to a 1:1 square focusing on Paul's face and upper shoulders, keeping the real background visible but with face as the dominant element. Upscale resolution for clarity. No background removal.
3. **Save** the result to `src/assets/paul-savluc.png`, replacing the current version.
4. **No code changes needed** -- the import and image element in `About.tsx` already reference this file and have proper `object-cover object-top` styling.

### Image Processing Details

The crop will target roughly the upper-right portion of the photo where Paul's face and shoulders are, creating a tight 1:1 headshot that:
- Centers on the face
- Includes shoulders (collar area of his coat)
- Keeps some of the castle/sky as natural background blur
- Does NOT remove or replace the background
- Upscales to high resolution for crisp display in the 160px circle

### Files Changed
- `src/assets/paul-savluc.png` -- replaced with properly cropped version

