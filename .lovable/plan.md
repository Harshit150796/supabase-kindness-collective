

## Nature-Themed Landing Page with Vine Background

### Concept
Transform the landing page to a clean white background with the company logo centered prominently in the hero, and delicate SVG vine/branch illustrations that organically grow from the logo area and trail down the page margins, framing all content sections.

### What changes

**1. Create `src/components/landing/VineBackground.tsx`** (new component)
- A fixed/absolute-positioned SVG overlay at z-0 spanning the full page height
- Contains thin, elegant SVG `<path>` elements representing vines along left and right margins
- Vines originate from the top-center (logo area) and curve outward to the margins
- Occasional tiny leaf and flower accents (simple SVG shapes) in earthy green and soft yellow/white
- Scroll-triggered "draw" animation using `stroke-dashoffset` + `stroke-dasharray` controlled by a scroll listener — vines progressively reveal as user scrolls
- Opacity set to ~25-30% so vines never compete with content
- z-index: 0 (behind all content)

**2. Update `src/components/landing/HeroSection.tsx`**
- Remove the current split-screen two-image layout (both hero-earth-heart and hero-earth-hands images)
- Remove the "Transparent & Secure Donations" connector badge
- Center the existing company logo (`src/assets/logo.png`, already used in Navbar) prominently — large size (~200-300px), with generous whitespace above and below
- Keep the Featured Story card at the bottom
- Background: pure white (`bg-white`), no gradients

**3. Update `src/pages/Index.tsx`**
- Change wrapper from `bg-background` to `bg-white`
- Import and render `<VineBackground />` as the first child inside `<main>`, positioned absolutely behind all sections
- All existing sections (LiveActivityBar, ImpactStories, TrustTransparency, etc.) remain but now sit on the clean white background

**4. Update `src/index.css`**
- Add a `draw-vine` keyframe animation for the stroke-dashoffset effect
- No changes to the color variables (the existing emerald green and deep blue tokens already match the logo colors)

### Design details

```text
┌──────────────────────────────────┐
│           [Navbar]               │
├──────────────────────────────────┤
│                                  │
│    ╭─vine─╮   [LOGO]   ╭─vine─╮ │  ← Hero: centered logo, spacious
│    │      ╰─────────────╯      │ │
│    │                           │ │
│    │     [Featured Story]      │ │
│    │                           │ │
│    │     [Live Activity]       │ │
│    ╰leaf                  leaf╯  │  ← Vines trail down margins
│    │     [Impact Stories]      │ │
│    │                           │ │
│    ╰flower              flower╯  │
│    │     [Trust Section]       │ │
│    │         ...               │ │
│    ╰───────────────────────────╯ │
│           [Footer]               │
└──────────────────────────────────┘
```

- Vine paths: 1-2px stroke, `stroke: hsl(160 84% 22%)` (existing `--primary`), opacity 0.25
- Leaves: tiny 8-12px SVG shapes in matching green
- Flowers: 6-8px simple circles/stars in soft gold (`--accent`) or white
- Total of ~4-6 vine paths (2-3 per side) to keep it minimal

### Text colors
- All section text uses existing `text-foreground` (dark charcoal) — no changes needed
- The existing color system already uses earthy green primary and dark charcoal foreground

### Files changed
- `src/components/landing/VineBackground.tsx` — New: SVG vine overlay with scroll animation
- `src/components/landing/HeroSection.tsx` — Replace split-screen images with centered logo
- `src/pages/Index.tsx` — White background, add VineBackground
- `src/index.css` — Add vine draw animation keyframe

