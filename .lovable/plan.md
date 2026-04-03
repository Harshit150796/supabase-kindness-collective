## Replace Hero Top Section with Split-Screen Image Layout

### What gets removed

The entire top portion of the HeroSection currently showing:

- "Trusted by 50,000+ donors worldwide" badge
- "15,000 families fed this month. Help us reach 20,000." headline
- "Your donation becomes real grocery coupons..." subheadline
  &nbsp;
- Floating recipient photos around the hero

The Featured Story card at the bottom of the hero will be preserved.

### What gets added

A **split-screen two-column layout** replacing the removed content:

- **Left side (50%)**: The Earth-heart logo image (`Gemini_Generated_Image_ybn3e3ybn3e3ybn3-2.png`) displayed prominently
- **Right side (50%)**: Reserved as a placeholder for the second image (which you'll provide next)
- **Center connector**: A small "Transparency & Secure Donations" badge/tag between the two images to visually convey the transition concept

On mobile, the layout stacks vertically (image on top, placeholder below).

### Implementation

1. **Copy the uploaded image** to `src/assets/hero-earth-heart.png`
2. **Rewrite `HeroSection.tsx**`:
  - Remove: `recipientPhotos` array, `AnimatedCounter` component, trust badge, headline, subheadline, all CTA buttons, floating photos
  - Add: Two-column grid (`grid-cols-2` on md+) with the Earth-heart image on the left, a placeholder on the right
  - Add: A centered overlay tag reading "Transparent & Secure Donations" with a subtle design
  - Keep: The Featured Story card section and its loading skeleton at the bottom

### Files changed

- `src/components/landing/HeroSection.tsx` — Major rewrite of the top section
- `src/assets/hero-earth-heart.png` — New asset (copied from upload)