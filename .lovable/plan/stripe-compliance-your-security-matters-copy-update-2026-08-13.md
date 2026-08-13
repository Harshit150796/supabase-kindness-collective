# Stripe Compliance: "Your Security Matters" Copy Update

## Goal

Remove the non-compliant "Verified 501(c)(3) Tax-deductible" text from the front-page security section and replace it with B2B zero-trust language that satisfies Stripe underwriting, while elevating the section to a polished, modern SaaS aesthetic.

## Current State (verified)

- `src/components/landing/SecurityBadges.tsx` renders a 3-card grid: `SSL Secure` / `Verified 501(c)(3)` / `PCI Compliant`.
- The non-compliant strings live on line 6: `label: 'Verified 501(c)(3)', sublabel: 'Tax-deductible'`.
- The component is consumed by `src/pages/Index.tsx` (front page, lazy-loaded), `src/pages/Donate.tsx`, and `src/pages/donor/DonorDonate.tsx`.
- Design tokens: primary emerald `--primary: 160 84% 22%`, gold gradient, card components from shadcn. No hardcoded colors are used.

## Changes (single file: `src/components/landing/SecurityBadges.tsx`)

### 1. Replace the middle badge copy

- Remove `Verified 501(c)(3)` / `Tax-deductible`.
- New badge: icon `ShieldCheck`, label `Verified Secure Platform`.
- New sublabel (the B2B2C zero-trust copy):
  > Operating as a B2B2C technology provider, we utilize a zero-trust architecture to convert funds directly into restricted digital retail vouchers, ensuring complete transparency and zero cash disbursements.

### 2. Restructure the middle card to hold the longer copy without breaking layout

- Keep the 3-column grid on desktop.
- Middle card: badge label on top, then the B2B2C subtext as a `text-sm text-muted-foreground leading-relaxed` paragraph (multi-line is fine).
- The two flanking cards (`SSL Secure`, `PCI Compliant`) keep their current compact styling.
- Add `items-stretch` to the grid so the tall middle card lifts siblings evenly; cards already use shadcn `Card`.

### 3. Polish the section to a modern SaaS aesthetic (no new dependencies)

- Section heading: keep `Your Security Matters`, add a small uppercase `text-xs tracking-widest text-primary/70` eyebrow ("Platform Security").
- Add a subtle top divider hairline (`border-t border-border`) so it separates cleanly from the preceding `DonationFlow` section.
- Wrap the icon circle with a ring (`ring-1 ring-primary/15`) and a faint emerald tint consistent with existing tokens.
- Add `hover:-translate-y-1` and `transition-all duration-300` for a subtle lift on hover (matches the existing `hover:shadow-lg` intent but more refined).
- Constrain paragraph width (`max-w-md mx-auto`) so the long subtext reads as a clean centered block, not edge-to-edge.
- Keep all colors as semantic tokens (`text-foreground`, `text-muted-foreground`, `bg-primary/10`, `text-primary`, `border-border`). No hardcoded hex/white/black.

### 4. Responsive behavior

- Mobile (`grid-cols-1`): cards stack; middle card's paragraph wraps naturally.
- `sm:` and up: 3 columns, middle card taller — acceptable and intentional (feature-card emphasis).
- No layout shift: the grid reserves height via `items-stretch`; the existing `LazyOnView minHeight={300}` wrapper on Index remains accurate.

## Out of Scope

- No changes to `Index.tsx`, `Donate.tsx`, or `DonorDonate.tsx` (they import the component unchanged).
- No changes to the Terms/Privacy legal pages (already updated previously).
- No backend, routing, or Stripe edge-function changes.

## Verification

- `tsgo` typecheck on the edited file.
- Visual check via Playwright (desktop + mobile viewport) on `/` to confirm the section renders with the new copy, the 3 cards align, and the paragraph wraps cleanly.
- Grep `src/` to confirm zero remaining `501(c)(3)` or `Tax-deductible` references.