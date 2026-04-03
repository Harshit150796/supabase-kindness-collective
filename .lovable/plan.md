

## Enhance Right-Side Hero Image & Display Quality

### Current problem
The screenshot shows the right-side image ("Veritas Et Terra") is barely visible — it appears as a thin distorted strip. The image has too much empty/light background and the central earth/logo element is too small within the frame.

### Plan

**Step 1: AI-enhance the image**
Use the Gemini image editing API (`google/gemini-3.1-flash-image-preview`) to:
- Crop/zoom into the central earth and crest logo, removing excess whitespace
- Enhance colors and contrast for web display
- Make the logo the focal point with a clean, vibrant composition that matches the left image's style

**Step 2: Replace the asset**
Save the enhanced image as `src/assets/hero-earth-hands.png`, replacing the current version.

**Step 3: Fine-tune CSS in `HeroSection.tsx`**
- Ensure `object-contain` is used so the image renders fully without distortion
- Add `image-rendering: high-quality` via inline style for sharper rendering
- Verify both images display at balanced proportions on the current 850px viewport (which hits the `md` breakpoint)

### Files changed
- `src/assets/hero-earth-hands.png` — Replaced with AI-enhanced, zoomed-in version
- `src/components/landing/HeroSection.tsx` — Minor CSS tweaks for sharper rendering

