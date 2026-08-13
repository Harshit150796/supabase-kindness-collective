# Plan: Compliance Update for "Your Security Matters" Section

## Goal
Update the `SecurityBadges` section on the homepage (and `/donate`) so it is
Stripe-underwriting compliant and reads like a polished, modern SaaS landing page.

## What changes (single file)
`src/components/landing/SecurityBadges.tsx` — the only file edited.

## Copy change
Remove the middle badge's non-compliant copy:
- DELETE label: `Verified 501(c)(3)`
- DELETE sublabel: `Tax-deductible`

Replace with:
- label: `Verified Secure Platform`
- sublabel: `Operating as a B2B technology provider, we utilize a zero-trust architecture to convert funds directly into restricted digital retail vouchers, ensuring complete transparency and zero cash disbursements.`

The other two badges (`SSL Secure` / `256-bit encryption`, `PCI Compliant` / `Secure payments`) stay unchanged.

## Layout decision (resolves the "polished SaaS" requirement)
The replacement sublabel is ~40 words; placing it as a plain card sublabel next to
two 2-word sublabels makes the middle card a tall paragraph and breaks the grid's
visual hierarchy. To keep it production-grade while keeping ALL required copy:

1. Middle card keeps the **short** sublabel `Zero cash disbursements` so the three
   cards stay visually balanced (equal-height, top-aligned).
2. The **full compliance sentence** (the long B2B / zero-trust / voucher text) is
   rendered as a centered footnote directly beneath the three-card grid — styled
   in muted foreground, `text-sm`, `text-balance`, capped at `max-w-2xl`. This is
   the "underneath as subtext" placement, just styled for balance.

This includes every word of the required copy and matches a real SaaS compliance
footnote pattern.

## Styling refinements for seamless blend (all semantic tokens, no hardcoded colors)
- Grid: add `items-stretch` so the three cards share equal height.
- Each `Card`: add `h-full` + `flex flex-col` so content aligns top; icon block stays
  centered.
- Sublabel: `text-pretty leading-relaxed` for clean wrapping.
- Footnote: a `mt-8` centered line with a subtle top divider (`border-t border-border/60`)
  to read as a compliance statement, not loose text.
- Keep existing `hover:shadow-lg transition-shadow`, `bg-primary/10` icon chip, and
  emerald `text-primary` icon color — no new color tokens.

## Verification
- Build passes (harness runs it automatically).
- Visual check via Playwright on a 1280px desktop + 390px mobile viewport: confirm
  three balanced cards, footnote reads cleanly on both, no 501(c)(3) / tax-deductible
  text remains anywhere on the section, no layout shift.

## Out of scope
- No changes to the 3D tree, other landing sections, backend, or routing.
- No changes to legal pages (already updated in a prior step).
