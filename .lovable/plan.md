# Rebuild the About page as a category-defining company story

## Direction
Rebuild `/about` from the ground up using the selected **Editorial Tech Narrative** direction:

- **Palette:** Modern Trust — deep navy, blue, teal, and crisp white, expressed through semantic site tokens.
- **Typography:** Libre Baskerville for editorial headlines and IBM Plex Sans for body copy.
- **Structure:** A premium magazine-style narrative with strong typography, crisp rules, asymmetric layouts, and generous whitespace.
- **Motion:** Refined in-view reveals and a trace-line animation that explains where a donation goes. No scroll hijacking; mobile animations remain active.

## New page story
1. **Category-defining opening**
   - Replace “Transforming Everyday Savings” with a direct statement about making donations transparent and trackable.
   - Present CouponDonation as the world’s first platform of its kind, as requested.
   - Explain the offer plainly: donors choose a fundraiser and retailer; donations become brand-specific coupons; activity remains visible and traceable.
   - Use clear donor and recipient actions without obsolete role-based signup links.

2. **A transparent trail, not a black box**
   - Build an editorial visual sequence showing:
     ```text
     Donation → Retailer choice → Coupon created → Recipient redemption → Trackable record
     ```
   - Explain what is visible at each stage without claiming features or outcomes the product does not support.

3. **What makes the model different**
   - Replace generic aid-program boxes with four operating principles: donor choice, coupon-based delivery, recipient dignity, and trackable giving.
   - Include a concise “What we do / What we do not do” statement to remove confusion about savings, meal programs, logistics, and broad partner networks.

4. **Founding thesis and leadership**
   - Retain Harshit Agrawal and Paul Savluc, their real portraits, roles, and LinkedIn links.
   - Redesign the profiles as a founder-led editorial feature rather than matching cards.
   - Rewrite biographies around the accountability gap in traditional giving, without inventing personal history.

5. **Mission, operating standard, and pathways**
   - State the mission around transparent donations, accountable distribution, donor visibility, and recipient choice.
   - Replace invented statistics and sectors with factual product capabilities.
   - Close with two clear pathways: donate to a fundraiser or create/request support.

## SEO and credibility
- Rewrite the page title, description, heading structure, and visible copy around natural search language such as **transparent donations**, **trackable giving**, **online donation platform**, **grocery coupons**, **donor transparency**, **charitable giving**, and **US communities**.
- Add AboutPage/Organization structured data using only established company facts.
- Avoid keyword stuffing, fabricated impact figures, unverified partners, tax claims, or unsupported operational claims.
- The “world’s first” wording will be presented as the company’s explicit category claim. It will not be paired with invented proof, awards, or third-party validation.

## Technical implementation
- Replace the current About page arrays, accordion, generic card grids, and hard-coded statistics with focused editorial sections.
- Load the selected fonts through the existing font-loading pattern and expose them through the design system rather than hardcoding styles throughout the page.
- Use existing Button, navigation, footer, founder assets, and semantic color tokens.
- Build motion with the project’s existing animation tools, with a calmer but still visible mode for phones reporting reduced motion.
- Preserve responsive readability and ensure the page has no horizontal overflow.

## Verification
- Capture and inspect the rebuilt page at 390px and 1280px.
- Confirm the donation-trail animation changes visibly between two timed mobile captures.
- Verify founder photos, links, primary actions, and all page sections render correctly.
- Check mobile widths from 320px through tablet and desktop for overflow or overlap.
- Confirm no console errors and a clean project build.
