

## Fix Logo Loading Lag

### Root Cause

The logo (`src/assets/logo.png`) is imported via JavaScript:
```
import logo from '@/assets/logo.png';
```

This means the browser flow is:
1. Download HTML
2. Download JS bundle
3. Execute JS, React renders the `<img>` tag
4. **Only then** does the browser start fetching the logo PNG

The `loading="eager"` and `fetchPriority="high"` attributes we added previously only affect step 4 -- they don't help because the delay is in steps 1-3.

### Fix

Add a `<link rel="preload">` tag in `index.html` so the browser starts fetching the logo at step 1, in parallel with the JS bundle. By the time React renders, the image is already cached.

### Changes

**File: `index.html`**
- Add `<link rel="preload" as="image" href="/src/assets/logo.png" />` in the `<head>` section
- Vite automatically resolves `/src/assets/logo.png` during build to the correct hashed asset path, so this works in both dev and production

This is a single-line addition that eliminates the logo loading lag entirely. No other files need changes.

