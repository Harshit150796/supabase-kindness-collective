

## Redesign Hero Section: Show Transition from Broken Systems to CouponDonation

### What gets removed
- The center "Transparent & Secure Donations" badge (both desktop and mobile versions, lines 53-81)

### What gets added

A **visual narrative flow** between the two images that tells the story: "Old broken systems → CouponDonation's trustworthy approach"

**Layout concept:**
```text
┌─────────────────────┐    ──────────►    ┌─────────────────────┐
│   LEFT IMAGE        │                   │   RIGHT IMAGE       │
│   (Crumbling earth) │   Animated arrow  │   (CouponDonation)  │
│                     │   + transition    │                     │
│   Label:            │   connector       │   Label:            │
│   "The Old Way"     │                   │   "The CouponDonation│
│   Opaque · Untrace- │                   │    Way"             │
│   able · Unreliable │                   │   Transparent ·     │
│                     │                   │   Traceable · Secure│
└─────────────────────┘                   └─────────────────────┘
```

**Specific elements:**

1. **Left image caption** — Below the left image, a small label:
   - Title: "The Old Way" (in muted/destructive tone)
   - Subtitle chips: "Opaque" · "Untraceable" · "Unreliable" (red-tinted tags)

2. **Center transition arrow** — Between the two images:
   - A horizontal animated arrow (CSS `→` with a subtle pulse animation)
   - Small text above it: "We're changing this"
   - On mobile: vertical arrow pointing down

3. **Right image caption** — Below the right image, a small label:
   - Title: "The CouponDonation Way" (in primary/emerald tone)
   - Subtitle chips: "Transparent" · "Traceable" · "Secure" (green-tinted tags)

4. **Bottom tagline** — Centered below both images:
   - "Every donation tracked. Every coupon verified. Every family fed."

### Design principles
- No heavy badges or floating elements overlaying the images
- Clean typography-driven storytelling
- Left side uses muted/destructive colors to convey "broken"
- Right side uses primary/emerald colors to convey "trustworthy"
- Arrow animation draws the eye from left to right (the shift)
- Mobile: stacks vertically with downward arrow

### Files changed
- `src/components/landing/HeroSection.tsx` — Remove center badges, add captions, transition arrow, and bottom tagline

