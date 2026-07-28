- Mobile audit — what I measured

Ran the live site in a real phone viewport (390×844, dpr 3, iPhone UA), captured 10 scroll screenshots, and measured load metrics, overflow, images and tap targets.

**Measured numbers**

- FCP 1.31s, LCP 2.84s, **CLS 0.198** (Google's "poor" threshold is >0.25; good is <0.1)
- Hero canvas renders at **1170×1468 px** for a 390px-wide box (dpr 3)
- ~20MB of JS transferred in dev (three/drei ~3.8MB, tree.glb 1.46MB, recharts 1.04MB loaded on the homepage)
- 17 tap targets under the 36px minimum
- Horizontal overflow detected in the brand marquee and the category chip row

### What's good

- Tree loads immediately now, no blank hero, gradient paints first so there's no flash
- Hero CTAs ("Donate now" / "Apply as Recipient") are visible above the fold
- Transparency donut + 95/3/2 breakdown reads clearly and is well-sized for mobile
- Colors are consistent with the emerald/gold system; text contrast is fine throughout
- Cookie bar is correctly compacted to one line on mobile

### What's bad (ordered by impact on a new visitor)

**1. Real user-photo problem: a driver's licence is used as a campaign cover image.**
Two fundraiser cards on the homepage show a scan of a New York State driver's licence (verification document uploaded as a campaign photo). This is exposed PII on a public page and looks unprofessional to both donors and the Stripe underwriter. Highest priority.

**2. No headline on mobile.** The `<h1>` is `sr-only`; visually a phone user sees only a tiny "COUPONDONATION IS TRANSPARENT" eyebrow and two buttons. There is no sentence explaining what the site does above the fold.

**3. Fabricated live stats.** The activity bar generates fake donor names, "8,235 donors", "$127K raised" and "Total this month $3,300" client-side with `Math.random()`. Given the account is under Stripe manual review, invented traction numbers on a donation site are a real trust and compliance risk.

**4. CLS 0.198 — visible content jumping.** Caused by lazy sections mounting with `minHeight` placeholders shorter than the real content, plus the cookie bar animating in at 400ms.

**5. Sticky navbar clips section headings.** Scrolling lands with "Where Your Money Goes" half-hidden behind the 72px sticky bar — no scroll padding is set.

**6. Hero canvas is oversized for phones.** dpr is capped at 3, so a 390px box renders 1.7 million pixels every frame. That's the residual heaviness/heat on mid-range phones; dpr 2 is visually identical at this size.

**7. Horizontal overflow.** The brand marquee and the category chip row extend past the viewport edge, so a sideways rubber-band happens on swipe.

**8. Cards are enormous.** Fundraiser cards stack one-per-screen at 4:3, so scrolling past three campaigns takes several full swipes.

**9. Smaller issues.** Starbucks logo appears twice in the marquee row; 17 tap targets below 36px (footer links, pagination dots); brand favicons served at 128px into a 16px slot; recharts (1MB) loads on the homepage.

---

## Proposed fixes

### Phase 1 — trust and correctness

- Replace/remove the licence-scan cover images on the affected fundraisers, and prevent verification documents from ever being selectable as a public campaign photo.
- Make the activity bar honest: drive counts and totals from real donation data, and when there is no data show a neutral state instead of invented names and dollar figures.

### Phase 2 — hero and above-the-fold

&nbsp;

&nbsp;

- Shorten the deferred environment lighting delay so the lighting settles before the user notices a shift, still after first paint.

### Phase 3 — layout and stability

- Set `scroll-padding-top` for the sticky navbar so headings never land behind it.
- Give each lazy section a placeholder height matching its real rendered height to cut CLS toward <0.1.
- Contain the marquee and chip rows so nothing exceeds the viewport width.
- Tighten mobile fundraiser cards (16:10 image, denser meta) so ~2 fit per screen.

### Phase 4 — polish

- Deduplicate the brand marquee logos; request 32px favicons instead of 128px.
- Raise sub-36px tap targets in the footer and pagination to 44px.
- Move recharts out of the homepage bundle (it is only used in admin analytics).

### Technical notes

Work is confined to presentation and data-source wiring: `HeroHeadline.tsx`, `Tree3DScene.tsx` (dpr only), `Index.tsx`, `LiveActivityBar.tsx`, `FundraiserCard.tsx`, `index.css`, plus removing the offending cover images. No changes to tree geometry, leaves, materials or quality.

### One decision I need from you

The fake live-activity numbers (Phase 1) are the only item that changes what visitors see as fact. Options: wire to real donation totals, keep the ticker but label it clearly as a demo, or remove the ticker entirely. Tell me which and I'll build it that way — everything else I'll proceed with as written.