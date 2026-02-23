

## Edit Paul Savluc's Photo -- Front-Facing Angle with More Zoom

### Problem
Paul's current photo shows him at a side angle. The user wants his face adjusted to appear more front-facing (looking toward the camera), while keeping the real background intact and zooming in slightly more on the face.

### Approach

1. **Use the AI image editing API** with the current `src/assets/paul-savluc.png` as the source image
2. **Editing prompt** will instruct the model to:
   - Rotate/adjust Paul's face so he appears to be looking directly at the camera (front-facing)
   - Zoom in slightly more so the face is larger and more prominent
   - Keep the natural castle/sky background intact
   - Maintain realistic, professional quality -- no artificial look
   - Upscale to high resolution for crisp display
3. **Save** the result back to `src/assets/paul-savluc.png`
4. **No code changes needed** -- the About page already imports and displays this asset correctly

### Important Note
AI face angle adjustment has limitations -- the model will do its best to make the face appear more forward-facing while keeping things natural. If the result looks unnatural, we may need to try a different source photo or approach.

### Files Changed
- `src/assets/paul-savluc.png` -- replaced with front-facing, zoomed-in version

