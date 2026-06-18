## Plan: Stripe-Compliant Terms of Service Rewrite

### Objective
Update the `/terms` page to align with Stripe underwriting requirements by replacing high-risk crowdfunding language with zero-trust, API-locked Smart Voucher terminology.

### File to Modify
- `src/pages/Terms.tsx`

### Changes

1. **Update "Last updated" date** — Change from `January 18, 2026` to `June 18, 2026`.

2. **Rewrite Section 2 (Description of Services)** — Replace legacy "coupons, gift cards, and monetary contributions" language with the zero-trust Smart Voucher definition provided by the user.

3. **Rewrite Section 5 (Donations)** — Remove the legacy "we cannot guarantee the use of donated funds" disclaimer and replace it with the restricted digital Smart Voucher guarantee language.

4. **Add Section 5.1 (Refund Policy)** — Insert the new "Zero-Refund" clause explaining why standard cash refunds cannot be processed once funds are locked into third-party retail merchant networks.

5. **Update Section 6 (Fees and Payments)** — Append the voluntary top-up / fee-cover language clarifying the B2C revenue model.

6. **Update Section 7 (Prohibited Conduct)** — Add the sanctions and AML compliance bullet prohibiting transactions from sanctioned jurisdictions and persons subject to financial sanctions.

### Technical Details
- All changes are textual within the existing `Terms.tsx` JSX structure.
- No new routes, components, or dependencies required.
- Styling and layout remain unchanged.