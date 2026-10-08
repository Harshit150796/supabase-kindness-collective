# Optimize every device without reducing motion

## Goal

Make the full site fit and perform well from small phones through tablets, laptops, desktops, and short landscape screens while keeping every approved animation active. Do not simplify, remove, or substitute visible motion based on screen size, operating-system motion settings, or guessed device power.

## Confirmed current state

- The shared motion preference already returns full motion for everyone, and the stylesheet has no reduced-motion block disabling animations.
- The homepage already contains the restored motion paths: live 3D tree, rotating headline, 48-second retailer rail, four animated giving steps, shared section reveals, 95¢ ring/bars/journey, donation flow, security badges, testimonials, live figures, retailer charts, CTA trace, and footer entrances.
- Shared reveals pre-trigger below the viewport and animate content that mounts late; lazy sections keep responsive height reservations to avoid scroll collapse.
- The tree currently starts at desktop visual quality except on software rendering, pauses only when off-screen or the tab is hidden, and reduces invisible rendering costs only after measured slow frames. Its authored model, leaf geometry, materials, lighting, camera treatment, exposure, and tone mapping remain shared across devices.
- Existing verification covered a broad 14-size responsive matrix, but it predates the latest full homepage animation restoration and therefore must be rerun rather than treated as current proof.
- Some approved motion still uses separate phone/tablet and desktop implementations, and several interactive surfaces rely on hover styling; these paths need direct touch and breakpoint verification.
- The tree chat still uses static viewport height, which can clip behind mobile browser chrome; the legacy fundraiser cover fallback also requests one 1400px image at phone widths instead of responsive variants.
- The mobile account drawer toggle does not yet guarantee the same 44px labeled target as the public navigation, and the campaign donation bar plus live-donation notice need short-landscape collision testing.

## Changes

### 1. Make the shared motion contract universal

- Audit every public, account, fundraiser, application, donation, and admin page for breakpoint, pointer, device-tier, Save-Data, visibility, lazy-loading, and legacy reduced-motion conditions that can suppress an approved animation.
- Keep full entrance reveals, count-ups, progress/ring draws, SVG timelines, carousels, marquees, panel transitions, loading shimmer, and press feedback on every viewport.
- Make late-loaded and data-driven content animate when it appears without remaining hidden, snapping in, or finishing before a user can see it.
- Preserve hover effects on pointer devices and add equivalent focus/touch feedback where the same interaction currently has no visible response.

### 2. Preserve the complete homepage animation system

- Verify and repair every homepage motion path individually: headline, tree life and interaction, logo fruit, retailer rail, all four giving illustrations, fundraiser cards, completed campaigns, 95¢ ring/bars/journey, donation steps, security icons, testimonials, figures, charts, CTA trace, statement, and footer.
- Keep the retailer rail at the same universal 48-second desktop speed with no added pause control.
- Keep all four giving illustrations visibly alive in the compact phone/tablet layout and in the desktop four-column layout.
- Keep the live tree moving on supported devices. Save-Data may retain the existing poster-first fallback, but normal phones and laptops must not receive a static substitute merely because of width or device name.

### 3. Optimize layout for phones, tablets, laptops, and desktops

- Recheck shared navigation, footers, forms, dialogs, horizontal selectors, dashboards, application steps, donation screens, public campaign pages, story pages, and empty/error/loading states at narrow, intermediate, laptop, wide, and short-landscape sizes.
- Fix horizontal overflow, clipped text, unstable reservations, fixed/sticky overlap, cramped actions, undersized touch targets, mobile input zoom, and content that becomes unreachable behind menus or donation bars.
- Switch the tree chat to dynamic mobile viewport sizing, make legacy fundraiser covers responsive, and align the account drawer control with the shared labeled 44px touch standard.
- Preserve the established desktop compositions and unique content; use responsive reflow rather than removing content.
- Keep the cookie bar unchanged.

### 4. Improve performance without visible animation loss

- Keep route-level and below-fold loading boundaries so pages do not download the 3D scene or chart code unless needed.
- Reduce only invisible costs: off-screen rendering, unnecessary rerenders, duplicate observers/listeners, oversized image delivery, and noncritical work before the first visible frame.
- Keep poster-first tree loading, resume the live scene cleanly when ready, and retain measured runtime adaptation that lowers shadow resolution/DPR before ambient density. Never thin or replace the authored tree model.
- Do not add packages and do not block native wheel or touch scrolling.

## Verification

- Run signed-out public routes and all reachable account/application shells at: 320×568, 360×780, 390×844, 412×915, 430×932, 844×390, 768×1024, 820×1180, 1024×768, 1180×820, 1280×800, 1366×768, 1440×900, 1920×1080, and 2560×1440.
- Test Chromium touch profiles plus WebKit phone/tablet profiles; repeat key checks with the OS reduced-motion preference enabled and confirm the same full motion still plays.
- Record the homepage from top to bottom and back at phone, tablet, laptop, and desktop sizes. Confirm ordered sections, non-decreasing document height, no sideways overflow, and no reveal left hidden.
- Sample each homepage animation across multiple frames so movement is proven rather than inferred from final styles. Confirm every giving step and every 95¢ element changes visibly.
- Confirm tree canvas mount, camera/tree/fruit/bird motion, off-screen pause, clean resume, and actual final quality settings through the existing motion debug view.
- Exercise touch, keyboard, mouse, resize, orientation change, short landscape, slow data, forced empty/error states, and late data arrival.
- Run the motion/responsive regression tests, full existing tests, TypeScript diagnostics, and preview build/runtime checks.
- Do not publish. Report physical-device frame rate and authenticated-only states as unverified unless they can be directly exercised.

## Technical constraints

- Preserve tree lighting, colors, materials, camera framing logic, geometry, exposure, tone mapping, and the shared authored model.
- Full motion remains the founder rule regardless of `prefers-reduced-motion`.
- Performance adaptation must be measurement-driven and reduce invisible rendering cost before ambient effects; viewport width must never select lower artwork quality.
- Preserve semantic green/blue design tokens, current content, privacy/security behavior, payment behavior, and the untouched cookie bar.