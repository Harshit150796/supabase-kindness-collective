## What's causing the "weird circle"

In `src/components/landing/hero/HeroHeadline.tsx`, the buttons sit inside a mobile-only wrapper:

```tsx
<div className="... inline-flex ... bg-background rounded-full px-2 py-1 md:bg-transparent md:p-0 ...">
```

That `bg-background rounded-full` creates the solid pill/oval ring that's showing around the Donate now button on phones. It was added earlier to stop the translucent button from looking blurry over the tree — but it reads as a stray circle.

## Plan

1. **Remove the mobile pill background** in `HeroHeadline.tsx`. Replace the wrapper with a plain flex row (no `bg-background`, no `rounded-full`, no `backdrop-blur`) so the buttons sit cleanly over the landscape on every screen size.

2. **Bring back the "Apply as Recipient" CTA** next to "Donate now", visible on both mobile and desktop:
   - Add a second `Button` (`variant="outline"`, `size="sm"`) linking to `/apply` (the existing `ApplyRecipient` page route).
   - Drop the desktop-only "How it works" button so the hero stays to two primary CTAs — Donate now (primary) and Apply as Recipient (outline) — matching the rest of the site's pairing.
   - Give the outline button a solid `bg-background` fill (not the translucent `bg-background/70 backdrop-blur-sm`) so it stays crisp over the tree on mobile without producing a halo.

3. **Keep spacing tight** so both buttons fit on a 384px-wide viewport: `gap-2`, `size="sm"`, short labels ("Donate now", "Apply as Recipient"). No layout/height changes to the hero container.

### Files touched
- `src/components/landing/hero/HeroHeadline.tsx` (only this file)

### Out of scope
- No changes to the 3D scene, live activity bar, routing, or other hero copy.
