# Plan: Cookie Policy + Banner Link Fix

## 1. Fix "See Our Privacy Policy" link
In `src/components/PrivacyConsentBanner.tsx`, the link uses `<Link to="/privacy">` but clicking it doesn't visually do anything because the banner stays mounted on top of the new page (and `/privacy` is already a valid route, so the user sees no change at the top of the viewport).

Fix:
- Change the link target to point to the new `/cookies` page for the "See Our Cookie Policy" link (more contextually correct for a cookie/privacy consent banner).
- Keep the inline `/privacy` and `/terms` links inside the paragraph.
- On any link click inside the banner, scroll to top so the user sees the destination page (`window.scrollTo({ top: 0 })`).
- Rename the standalone bottom link to **"See Our Cookie Policy"** → `/cookies`.

## 2. Create Cookie Policy page
- New file `src/pages/Cookies.tsx` modeled after `src/pages/Privacy.tsx` (same Navbar/Footer/SEO layout).
- Sections: Introduction, What Are Cookies, Types We Use (Essential, Analytics, Preference), Third-Party Cookies (Stripe, Supabase, analytics), Managing Cookies (browser settings), Changes to Policy, Contact.
- Last updated date: June 6, 2026.

## 3. Wire the route
- In `src/App.tsx`: add `const Cookies = lazy(() => import("./pages/Cookies"));` and `<Route path="/cookies" element={<Cookies />} />`.

## 4. Footer link
- In `src/components/layout/Footer.tsx`, add a "Cookie Policy" link next to Privacy Policy and Terms of Service in the bottom row.

## Out of scope
- No changes to consent storage logic, banner layout/size, or analytics behavior.
- No cookie-category opt-in toggles (this is a disclosure policy page, not a granular consent manager).
