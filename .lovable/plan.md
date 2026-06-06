Restyle `PrivacyConsentBanner` to match the GoFundMe reference: a contained floating card instead of a full-width bottom bar.

**Changes to `src/components/PrivacyConsentBanner.tsx`:**

- Remove full-width `left-0 right-0` + top border styling.
- Wrap content in a centered floating card:
  - Positioned `fixed bottom-4 left-1/2 -translate-x-1/2` (or `bottom-6` with side margins on mobile).
  - `max-w-3xl w-[calc(100%-2rem)]`.
  - `rounded-2xl border border-border bg-background shadow-xl`.
  - Inner padding `p-5 md:p-6`.
- Keep the same horizontal layout: text block on the left, "Okay" button on the right.
- Keep "See Our Privacy Notice" link below the text (smaller, muted).
- Same accept logic, same localStorage key, same animation (slide-in-from-bottom).

**Out of scope:** No changes to copy, links, App.tsx mounting, or consent logic.
