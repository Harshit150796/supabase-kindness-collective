# Responsive and performance pass — October 6

No website publication, sample emails, new packages, cookie-bar edits, payment-path edits, or tree lighting/material/geometry/exposure/tone-mapping edits.

## Root-cause changes
- Removed the global tree GLB preload. Homepage, scene, chat and all page routes use lazy imports. Removed forced Three/chart vendor chunk assignments; scene and chart code remain behind their consuming components.
- Homepage renders a local 57 KB WebP tree poster immediately; the scene mounts after two animation frames. Reduced-motion and Save-Data visitors retain the poster. Existing offscreen render suspension remains. Camera distance now accounts for canvas aspect and the canopy/orbit envelope.
- `/about` previously transferred ~4,003 KB, including globally loaded app/3D code and an oversized founder image. Replaced the founder image with responsive local 400/800px WebP sources (12/27 KB), lazy-loaded with explicit dimensions.
- Moved Top Donors below the hero below `lg`; enlarged hero/chat controls and safe-area spacing.
- Compact four-step story below `lg`; desktop sticky story retained. Testimonials become a horizontal snap carousel below `md`; security cards stack below `lg`. Fundraiser filters are one scrolling snap row.
- Shared reveals start at 10% visibility, take 350ms, and cap delay at 80ms. Content begins mostly visible instead of disappearing; reduced-motion skips reveals. Retailer figures never initially display synthetic zero values.
- Fundraiser queries have an abort timeout, bounded retry and explicit error/retry state, including failures in secondary RPCs. Currency formatting coerces numeric strings before applying the thousands separator.
- Deferred sections reserve breakpoint-specific intrinsic height. Shared form controls use 16px on small/coarse-pointer screens; shared buttons, relevant links, navbar menu and footer links have 44px minimum touch height. Navbar tagline is hidden below `sm` and 12px above; desktop navigation starts at `xl` to prevent 1024px crowding.
- Short-viewport donor action bar measured 53px, retaining 44px controls. Donation-success content wraps. A narrow-screen application overflow traced to Sonner's fixed-width toast container was fixed without hiding page overflow.

## Exactly what was consolidated
- Removed TrustTransparency's second four-step journey; WhatWeDo retains the complete journey and illustrations.
- Removed repeated 95% ring/bar/line presentations; retained one `95¢` allocation statement and the operating/payment allocation explanation.
- Removed homepage ProofFigures and the separate standalone BrandLeaderboard placement. One figures section now embeds retailer allocations, all from the same `get_landing_stats()` snapshot.
- Preserved unique retailer visualisation, donation interaction/demo, testimonials, fundraising stories, trust/security content, closing invitation and tree. No unique section was silently deleted.

## Figures definition and defect
The old received/claimed display depended on legacy status/redemption transitions. The current flow records `revealed_at` and `used_at`; the completed test donation has both. The aggregate now counts these explicitly, excluding void/returned records: **1 received and 1 marked used**, verified through the public browser RPC and rendered text.

One aggregate snapshot showed **$1,484 completed donations**, **$20 credential-issued coupon value**, and **$1,214 retailer allocations**. These are different stages, now labelled and defined, not presented as interchangeable totals. Recipient-reported use is explicitly not independent proof of purchase. Only public aggregates are exposed.

## Browser evidence
Signed-out Chromium checked public routes and protected-route redirects. A 14-size × 10-route sweep completed (140 checks), followed by a broader completed 33-route × 14-size matrix (462 checks), plus narrow-screen rechecks after fixes. Required sizes: 320×568, 360×780, 390×844, 430×932, 844×390, 768×1024, 820×1180, 1024×768, 1180×820, 1280×800, 1366×768, 1440×900, 1920×1080, 2560×1440.

Stepped homepage recordings used 85% viewport increments, never full-page screenshots. Viewed both phone/tablet contact sheets: story art stays with captions, no full-screen sticky gaps below lg, testimonials visible, figures distinguish received/used, and footer wordmark has comfortable padding. Live WebGL screenshots at 320, 390 and 768 show the canopy/logos inside canvas bounds and CTA separation. This proves sampled frames, not every position of a full orbit.

Earlier comparable local measurements: phone **16,768px / 19.87 screens → 11,088px / 13.14 screens**; tablet **15,405px / 15.04 → 10,793px / 10.54 screens**. Final phone height remained 11,088px. A later tablet measurement encountered a transient route/viewport reset and was discarded; the completed, visually reviewed 768px recording is the valid evidence. User-supplied live baselines (~16,400/~15,100px) are from different conditions.

Browser network checks on `/cookies`, `/about`, and `/f/help-feed-my-family-this-month-7kvke2` found **no Three, tree GLB, scene or Recharts requests**. Reduced-motion homepage rendered no canvas. Simulated fundraiser fetch failure displayed the error state; Retry recovered the real campaign. The repaired `/apply` had no horizontal overflow at 320, 360, 390, 1440 and 1920 after fixing its entrance-animation scrollable overflow as well as the toast.

## Tests and limits
- All **42 existing Deno tests passed**, plus **2 new regression tests** (44 total), zero failures.
- Automatic preview build logs reported clean builds after edits. A separate TypeScript-only check was not run; do not equate build success with that check.
- Before-change transferred resources at 390px (KB, JS / all): `/` **1,116.9 / 2,749.9**; `/cookies` **1,122.5 / 2,712.4**; public fundraiser **1,148.6 / 2,738.4**; `/about` **1,127.9 / 4,003.3**.
- **After-change production compressed transfer totals and the <350KB JS target are unverified.** Localhost is Vite development; its raw/module transfers are not comparable. The harness performs builds; no separate manual build or website publish was performed.
- **Authenticated owner/donor/admin screens remain unverified**: external unmanaged auth. Redirect checks do not prove those screens.
- Chromium touch emulation is not a physical iPhone Safari focus/zoom test. Shared computed form sizes were checked; native Web Share availability is platform-dependent.
- Live landscape WebGL screenshot succeeded after retry and dismissing the cookie overlay; full rotating landscape orbit framing remains unverified.
- Matrix checks inspect initial render, not every authenticated modal or later route state. Cookie-bar controls were excluded from touch audits and left untouched as requested.
- Supabase reported pre-existing security findings; the aggregate migration introduced none. No unrelated policy/payment fixes were attempted.

Final matrix: 462 initial-render checks across all 14 sizes, zero runtime errors; no overflow outside the subsequently repaired application panel. Post-fix application rechecks passed at 320/360/390/1440/1920. Early narrow-width link failures passed the rerun. Tested primary touch targets were at least 44px and phone form inputs at least 16px. This is not a claim about untested authenticated controls.
