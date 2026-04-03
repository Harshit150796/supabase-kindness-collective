

## Remove Backgrounds from Hero Images & Blend into Website

### What needs to happen

Both hero images (`hero-earth-heart.png` and `hero-earth-hands.png`) currently have solid/colored backgrounds that clash with the website's clean gradient background. We need to:

1. **Remove backgrounds from both images** using AI image editing — isolate just the central earth/logo artwork with full transparency
2. **Re-export as transparent PNGs** so they blend seamlessly into the website's `from-secondary/30 via-background to-background` gradient
3. **Adjust CSS for seamless blending** — add subtle effects so the images feel native to the page

### Step-by-step

**Step 1: AI background removal — Left image (earth-heart)**
- Use the AI image editing tool (`google/gemini-3.1-flash-image-preview`) with the prompt: "Remove the background completely, keep only the central earth with heart artwork. Make the background fully transparent. Output as PNG with transparency."
- Save result to `src/assets/hero-earth-heart.png`

**Step 2: AI background removal — Right image (earth-hands)**  
- Same approach for the second image: remove all background, isolate the central earth/crest/logo artwork
- Save result to `src/assets/hero-earth-hands.png`

**Step 3: CSS refinements in HeroSection.tsx**
- Keep `object-contain` and `drop-shadow-2xl` (the shadow will now naturally ground transparent images against the gradient)
- Add a subtle CSS `filter` for slight warmth/contrast boost so the images feel cohesive with the site's color palette
- Ensure both images render at equal visual weight with balanced sizing

### Files changed
- `src/assets/hero-earth-heart.png` — Replaced with background-removed version
- `src/assets/hero-earth-hands.png` — Replaced with background-removed version
- `src/components/landing/HeroSection.tsx` — Minor CSS tweaks for blending (filter, shadow adjustments)

