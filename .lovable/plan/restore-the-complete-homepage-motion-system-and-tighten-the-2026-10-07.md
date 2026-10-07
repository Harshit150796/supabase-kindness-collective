# Restore the complete homepage motion system and tighten the logo/95¢ transition

## Confirmed findings

- The retailer-logo strip currently renders a dedicated pause/play button beneath or beside the moving logos on narrow layouts. It was added as an explicit control and can be removed without changing the universal 48-second logo speed.
- The 95¢ section currently has only basic entrance reveals. Its earlier approved version included an animated 95¢ allocation ring, animated 95/3/2 allocation bars, staggered labels, and a drawn donation-to-use journey.
- The visible white gap follows the 95¢ section: the next statement section begins with generous vertical padding, while the lazy wrapper also keeps a fixed responsive reservation. The transition needs to retain stable page height while moving meaningful content upward.
- Homepage motion is spread across the shared reveal system, four giving-step timelines, fundraiser cards, figures and progress bars, testimonials, retailer charts, the CTA trace, and the 3D tree. These paths need one end-to-end audit rather than isolated fixes.

## Changes

### 1. Remove the unrequested logo control
- Remove the pause/play button and its local paused state from the retailer-logo strip.
- Keep the logo rail moving continuously at the existing universal **48-second** loop on phone, tablet, and desktop.
- Preserve logo sizes, hover/touch behavior, semantic colors, and the current retailer content.

### 2. Remove the white gap without destabilizing scrolling
- Tighten the bottom of the 95¢ section and the top of the following “We don't track the person…” statement so the next content is visibly pulled upward.
- Correct the 95¢ lazy reservation to match its real responsive height after the animation is restored, while preserving the existing no-collapse behavior before lazy content commits.
- Confirm no blank band appears during loading, slow loading, or after scrolling away and back.

### 3. Restore the full 95¢ animation
- Restore the animated circular 95¢ allocation visual from the earlier approved design.
- Animate the 95%, 3%, and 2% allocation bars and their labels in sequence as the section approaches the viewport.
- Restore the donation-to-recipient journey line and staggered steps while retaining the current truthful explanatory copy and the established green/blue-only design rules.
- Make the sequence reliably visible after lazy mounting and ordinary scrolling on every device, including when the operating system requests reduced motion, per the founder’s existing full-motion rule.

### 4. Audit and restore every homepage animation
Check every rendered homepage section and reconnect missing or prematurely completed effects:
- Hero: rotating headline, live 3D tree, logo fruit, ambient tree life, and chat launcher.
- Retailer strip: continuous universal-speed movement.
- Four giving steps: all four illustration timelines, captions, connectors, receipt proof, and touch feedback.
- Fundraisers and completed campaigns: heading, copy, image, and card reveals.
- Trust and transparency: ring, bars, journey, labels, and copy reveals.
- Donation flow and security: step transitions, progress, badges, and icons.
- Testimonials: heading and card entrances plus phone carousel behavior.
- Impact figures: count-ups, progress/chart growth, retailer activity, and data-driven late mounts.
- Final statement, CTA, product trace, and footer entry motion.

Use the shared reveal contract so content pre-triggers near the viewport, late-mounted content still animates, and fast scrolling never leaves content hidden. Do not alter the tree’s protected lighting, materials, colors, camera, geometry, exposure, or tone mapping.

## Verification

- Verify the pause/play button is absent and the logo rail reports a 48-second duration at 390, 768, 1024, 1180, and 1440px.
- At 390 and 1024px, scroll top-to-bottom and back while sampling every homepage section for visible opacity, transform, SVG, count, chart, or 3D progression.
- Confirm all four giving illustrations change through their intended sequences and the complete 95¢ ring/bar/journey animation plays after lazy mounting.
- Capture the 95¢ transition at phone and desktop widths and confirm the following statement occupies the former white gap without overlap or page-height collapse.
- Check no horizontal overflow, no reordered sections, and non-decreasing document height during lazy loading.
- Run the existing motion regression suite, full project tests, and confirm the preview build/runtime logs are clean.
- Do not publish. Report physical-device smoothness as unverified unless it can be directly measured.
