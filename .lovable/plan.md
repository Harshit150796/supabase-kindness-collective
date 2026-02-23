

## Fix Brand Selector Modal Scrolling

### Root Cause

The `BrandSelectorModal` uses a flex column layout (`DialogContent` with `flex flex-col` and `max-h-[90vh]`). The `ScrollArea` for the brand grid has `flex-1` to fill remaining space, but is missing `min-h-0`. In CSS flexbox, flex items default to `min-height: auto`, which prevents them from shrinking below their content size. This means the ScrollArea expands to fit all brands instead of constraining and scrolling.

### Fix

**File: `src/components/landing/BrandSelectorModal.tsx` (line 172)**

Change the ScrollArea from:
```
<ScrollArea className="flex-1 -mx-6 px-6">
```
To:
```
<ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
```

Adding `min-h-0` allows the flex item to shrink below its content height, which lets the Radix ScrollArea detect overflow and enable scrolling.

This is a one-line, one-class fix. No other files need changes.

