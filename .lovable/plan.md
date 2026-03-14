

## Redesigning the Fundraiser Card Overlays

### The Problem
The category badge ("Food Support") and live status indicator ("Active") sit on top of the image as floating overlays, which:
- Obscures the fundraiser's photo — the most emotionally compelling element
- Looks cluttered with two badges competing for attention on a small image area
- The semi-transparent colored badges blend awkwardly with varied photo backgrounds
- On smaller cards (mobile/tablet), these overlays consume a disproportionate amount of image real estate

### Design Options

Here are 4 proven approaches from top-tier fundraising and marketplace platforms:

---

**Option A: "GoFundMe Clean" — Move metadata below the image**
Move both category and status entirely out of the image area and into the content section. The image stays clean and unobstructed.

```text
┌──────────────────────────┐
│                          │
│       FULL IMAGE         │
│     (no overlays)        │
│                          │
├──────────────────────────┤
│ Food Support · Live 🟢   │
│ Help Maria's Family...   │
│ ━━━━━━━━━━━░░░░ 67%     │
│ ♥ 24 donors   $670/$1k  │
└──────────────────────────┘
```
- Category as a subtle colored text label (not a badge)
- Status as a small green dot inline with category
- Maximizes image impact — best for emotional storytelling

---

**Option B: "Minimal Chip" — Single subtle indicator on image**
Keep only ONE tiny, minimal indicator on the image (just the live dot or a small category icon), and move everything else below.

```text
┌──────────────────────────┐
│                     🟢   │
│       FULL IMAGE         │
│                          │
│                          │
├──────────────────────────┤
│ Food Support             │
│ Help Maria's Family...   │
│ ━━━━━━━━━━━░░░░ 67%     │
│ ♥ 24 donors   $670/$1k  │
└──────────────────────────┘
```
- Just a 8px green pulsing dot in the corner (no text label)
- Category rendered as a colored pill below the image, before the title
- Clean image with just a whisper of status

---

**Option C: "Bottom Edge Strip" — Integrated category bar**
Place category as a slim strip at the very bottom edge of the image, blending with the gradient. No top overlays at all.

```text
┌──────────────────────────┐
│                          │
│       FULL IMAGE         │
│                          │
│▓▓ 🟢 Food Support ▓▓▓▓▓▓│
├──────────────────────────┤
│ Help Maria's Family...   │
│ ━━━━━━━━━━━░░░░ 67%     │
│ ♥ 24 donors   $670/$1k  │
└──────────────────────────┘
```
- Category + status in a single frosted-glass bar at the image bottom
- Leverages the existing gradient overlay area
- Compact, premium feel

---

**Option D: "Card Header Ribbon" — Category above image**
Place the category as a colored top border or ribbon above the image, outside the image area entirely.

```text
┌──────────────────────────┐
│ 🍽 Food Support    Live 🟢│  ← colored ribbon
├──────────────────────────┤
│                          │
│       FULL IMAGE         │
│     (no overlays)        │
│                          │
├──────────────────────────┤
│ Help Maria's Family...   │
│ ━━━━━━━━━━━░░░░ 67%     │
│ ♥ 24 donors   $670/$1k  │
└──────────────────────────┘
```
- Thin colored bar above image with category icon + name + live dot
- Color-coded by category (emerald for food, blue for household, etc.)
- Image completely clean, category immediately scannable

---

### Recommendation

**Option A** is the strongest choice. Here's why:
- GoFundMe, GiveDirectly, and other top platforms have moved away from image overlays
- The image is the #1 conversion driver — every pixel of obstruction reduces emotional impact
- Category and status information is secondary; users scan the image and title first
- Works perfectly across all screen sizes without responsive overlay positioning issues

### Implementation

**File changed:** `src/pages/admin/AdminFundraisers.tsx` — no change needed
**File changed:** `src/components/stories/FundraiserCard.tsx` — restructure the card layout:

1. Remove all `absolute` positioned overlays from the image section (category badge, live indicator)
2. Remove the gradient overlay (no longer needed for text readability)
3. Add a metadata row between the image and title: category pill (small, colored text with dot) + live status (green dot + "Live" text)
4. Keep the hover "Support Now" CTA on the image (it only appears on hover, so no obstruction)
5. Refine the category pill to use a small colored dot + text instead of a full badge — lighter visual weight

The card content section becomes:
- Category dot + label | Live dot (inline row)
- Location + time (existing)
- Title (existing)
- Story preview (existing)
- Progress bar + stats (existing)

