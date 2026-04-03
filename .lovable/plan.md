

## Landing Page Enhancement

### What changes

**1. Remove floating recipient photos from HeroSection**
The circular face photos scattered around the hero text (shown in your 2nd screenshot) will be completely removed. The hero becomes a clean, focused section with just the trust badge, headline, subheadline, CTAs, and the featured story card.

**2. Place the earth-heart logo in the lower half of the landing page**
The uploaded earth-heart image (tree growing from heart-shaped Earth, held by hands) will be embedded into the **CTASection** — the final call-to-action section near the bottom of the page. This is the natural "second half" placement that creates a powerful closing visual.

### Design approach

The CTASection currently has two cards (For Donors / For Companies) side by side. The redesign will:

- Add the earth-heart image as a **large, centered visual centerpiece** above the two CTA cards
- The image sits on a subtle radial gradient background that complements the cream/warm tones of the image itself
- Below the image: a concise tagline about transparency and secure donations (e.g., "100% Transparent. Secure. Direct Impact.")
- The two CTA cards remain below, now anchored by the visual weight of the logo above
- On mobile, the image scales down gracefully and stacks naturally

### Files changed

| File | Change |
|------|--------|
| `src/components/landing/HeroSection.tsx` | Remove `recipientPhotos` array and all floating photo rendering (lines 12-90). Clean hero with just text + featured story card |
| `src/components/landing/CTASection.tsx` | Add the earth-heart image as a centerpiece above the CTA cards with a "Transparent & Secure Donations" tagline |
| `src/assets/` | Copy the uploaded earth-heart image into project assets |

### Technical details

- The earth-heart image will be imported as an ES6 module from `src/assets/earth-heart-logo.png`
- The image will be displayed at ~280px on desktop, ~200px on mobile, with a subtle drop shadow and fade-in animation
- The floating photos code (lines 12-90 in HeroSection) is fully removed — no replacement needed since the hero is stronger without visual clutter
- The HeroSection retains all functional elements: trust badge, animated counter headline, subheadline, CTA buttons, "See how it works" link, and the featured story card

