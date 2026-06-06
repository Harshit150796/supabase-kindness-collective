# Privacy Consent Banner

Privacy Policy (`/privacy`) and Terms of Service (`/terms`) pages already exist. What's missing is the consent banner shown to first-time visitors. We'll add one styled like the reference image.

## What to build

1. **New component** `src/components/PrivacyConsentBanner.tsx`
   - Fixed bottom banner, full width, white background, top shadow, high z-index.
   - Left side: heading "Privacy Information" + descriptive paragraph with inline underlined links to **Privacy Policy** (`/privacy`) and **Terms of Service** (`/terms`).
   - Right side: prominent rounded "Okay" button (primary brand color — Deep Emerald).
   - Bottom row: small "See Our Privacy Policy" link centered.
   - Dismisses on click → writes `cd_privacy_consent=accepted` + timestamp to `localStorage`.
   - On mount: if consent flag already exists, render nothing. Small fade-in delay (~500ms) to avoid flashing during initial paint.
   - Fully responsive: stacks vertically on mobile, side-by-side on desktop.
   - Uses semantic design tokens (no hardcoded colors).

2. **Mount globally** in `src/App.tsx` inside `<TooltipProvider>` (outside `<BrowserRouter>` is fine since it uses `<Link>` — actually must be inside Router for Link to work, so place inside `<BrowserRouter>` alongside `<AppRoutes />`).
   - Renders on every route until accepted.

## Out of scope

- No cookie category toggles / granular consent (simple accept-only, matching the reference image).
- No backend storage — consent stays in localStorage.
- No edits to existing `/privacy` or `/terms` page content.

## Technical notes

- Storage key: `cd_privacy_consent` with value `{ accepted: true, at: ISO timestamp }`.
- Banner uses `fixed bottom-0 left-0 right-0 z-50` with `bg-background border-t shadow-lg`.
- Links use `<Link>` from `react-router-dom` with `underline` styling.
- Button uses existing `<Button>` component, `variant="default"`, `size="lg"`.
