# Coupon, the AI tree (video mascot)

Coupon is CouponDonation's mascot and appears in **every video**: launch films, social cuts, explainers and comics. It is the site's own AI guide: the homepage button reads "Talk to Coupon" ("Ask Coupon" on phones), labelled "Talk to Coupon, the AI tree" (`src/components/landing/hero/AITreeLauncher.tsx`).

![Coupon, waving](coupon-tree.png)

## The look (fixed: reuse it, never redraw it)
- Round green canopy with a face: big white eyes, ink brows, a small smile.
- Bark-green trunk (no warm browns), two branch arms with leaf hands, root feet, a soft ground shadow.
- One blue coin fruit with a "$", hanging on the right of the canopy.
- Ink outline `hsl(123 20% 7%)`, leaf `hsl(123 46% 45%)`, bark `hsl(123 22% 26%)`; blue `hsl(212 80% 42%)` appears on the coin only. This keeps it within the brand rules: green first, blue as the single accent, no warm colours.

## Files
| File | Use |
|---|---|
| `coupon-tree.js` | The animatable character. `couponTree(parent)` builds it, `setCouponTree(m, pose)` poses it each frame. Every pose is a pure function of its inputs, so frame-by-frame renders stay deterministic. Also exports `WAVE(t)`, `MASTER`, `talk()` and `blinkAt()`. |
| `coupon-tree.svg`, `coupon-tree.png` | The master art (the wave at rest), for thumbnails, stills and anything not built in code. The PNG is transparent, 680 × 820. |
| `poses.png` | Pose sheet: resting, wave, master art, pointing, cheer, talking. |
| `preview.html`, `export.mjs` | Pose sheet page and the script that regenerates the three images from the module. Run `npx vite --port 5173`, then `node video-kit/mascot/export.mjs`. |

In a composition served by the repo's Vite server:

```js
import { couponTree, setCouponTree, WAVE, talk, blinkAt } from '/video-kit/mascot/coupon-tree.js';
const coupon = couponTree(stage);                     // 320 × 380 art box
setCouponTree(coupon, { x: 1600, y: 1000, scale: 0.8, ...WAVE(t), blink: blinkAt(t, 3), mouth: talk(t, 11.2, 13.4) });
```

Arm angles: 40 resting, about 120 pointing out, 138 ± 12 waving (beside the canopy, never over the face), 150 both arms for a cheer.

## Role and voice
- A friendly guide, not a narrator who replaces the product. Coupon waves the viewer in, points at the real site, reacts (cheers when a gift lands) and waves goodbye. At minimum it opens with a hello and closes beside the end card.
- Short lines only: about 10 words at most, held on screen for about 0.3 s per word.
- Coupon's words follow the same claim rules as the site and the assistant (root `AGENTS.md`, "Legal, Claims & Security" and "Coupon System Rules"):
  - never coupon counts or sizes, timing promises, invented figures, people or testimonials;
  - never "charity", "nonprofit" or "tax-deductible";
  - never promises approval or "verified families".
- It never covers real UI copy, the hook line or the call to action. It enters with a quick pop, idles with a gentle sway and blink, and stays on its own side of the frame.
- The coupon tickets with faces in the comic films are side characters. Coupon the tree is the mascot.
