

## Fix: Featured Story Selection on Homepage

### Problem
The admin "Set as Featured" button correctly sets a story's `display_order` to 1, but the `HeroSection` ignores this. Instead, it uses a time-based rotation formula to pick a random story index each week:

```text
cmsWeekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % stories.length
```

This means the featured story chosen by the admin never actually controls the homepage.

### Solution
Update `HeroSection.tsx` to always show the story with the lowest `display_order` (the one the admin set as featured) instead of using the weekly rotation.

**Change in `src/components/landing/HeroSection.tsx`:**

Replace the weekly rotation logic (lines 44-49):
```text
const cmsWeekIndex = cmsStories && cmsStories.length > 0
    ? Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % cmsStories.length
    : 0;
const activeCMS = cmsStories && cmsStories.length > 0 ? cmsStories[cmsWeekIndex] : null;
```

With a simple pick-the-first approach:
```text
const activeCMS = cmsStories && cmsStories.length > 0 ? cmsStories[0] : null;
```

Since `useCMSStories` already orders results by `display_order`, the story at index 0 is always the one the admin set as featured (display_order = 1). This is a one-line change.

### Files Changed
- `src/components/landing/HeroSection.tsx` -- Remove the weekly rotation formula, use `cmsStories[0]` instead.

