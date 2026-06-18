# Smoothness Pass #2 — Delayed Tree Mount + Mobile Blur Cleanup

After re-reading `Tree3DScene.tsx`, `Tree.tsx`, `Ground.tsx`, `Sky.tsx`, `HeroSection.tsx`, the hero overlays and the rest of the landing chain, here is what's still hurting mobile and what causes the "blurry tree" feeling.

## Why the tree looks blurry on mobile

1. **DPR is capped at 1.5 on a ~3.75× phone.** That means the canvas is rendered at 40% of native pixel density and then upscaled by the browser — the upscale itself is a soft blur. The previous trade-off was performance, but with the other mobile cuts (no AA, no shadows, no tone mapping, fewer leaves) we now have headroom to raise the cap.
2. **Fog is set very close: `[18, 45]`.** On mobile the camera sits at distance 16, so the back half of the canopy and the sky horizon get tinted/faded — reads as a haze/blur over the leaves.
3. **`ContactShadows` runs at `resolution=1024 blur=2.8`** every frame. On mobile that's a 1024×1024 RT updated continuously — produces a soft smudge under the trunk and costs GPU.
4. **`DustMotes` (140 animated point sprites)** in `Sky.tsx` run every frame on mobile and visually add atmospheric blur.
5. **Hero overlays use translucent chips (`bg-background/70`)** on top of the tree, which makes the area behind feel washed out.

## Why mounting the tree later helps

Currently `Tree3DScene` mounts immediately inside the hero. On a cold first paint the phone is also parsing/executing the lazy chunks, decoding fonts, hydrating React, *and* booting Three.js + GLTFLoader + the GLB model on the same main thread. The competition causes the visible jank/blink during the first 1–2 s. If we hold the canvas back until the page is idle (≈1.5 s after first paint, or on `requestIdleCallback`), the rest of the page renders cleanly and the tree appears smoothly with a fade-in.

## Changes

### A. `HeroSection.tsx` — defer tree mount
- Add a `treeReady` boolean, default `false`.
- On mount: wait for `requestIdleCallback` (fallback `setTimeout(1500)`); also gate on `document.readyState === 'complete'` so we don't compete with image/font loading.
- While `!treeReady`, render the existing gradient fallback (`from-[#BFD8E8] via-[#CFE6F5] to-[#E8F1E0]`) full-bleed so layout is identical.
- When `treeReady` flips, mount `<Tree3DScene />` inside a wrapper that animates `opacity 0 → 1` over 600 ms (`transition-opacity`).
- Keep the existing `Suspense` fallback (same gradient) so the lazy chunk load is also covered.

### B. `Tree3DScene.tsx` — sharper mobile render, less haze
- Raise mobile DPR cap from `1.5` → `Math.min(devicePixelRatio, 2)`. Combined with `antialias:false` this is still cheaper than the original `1.5 + AA` config, and the tree edges become noticeably crisper on phones.
- Push fog far on mobile: `<fog args={['#DCE6D5', 35, 90]} />` when `isMobile`, leave `[18, 45]` on desktop.
- `ContactShadows`: lower `resolution` 1024 → 256 on mobile, `blur` 2.8 → 1.5. Already saving meaningfully because mobile has `shadows={false}` on the renderer, but `ContactShadows` is a separate planar pass and was still running — keep it (visual anchor under tree) but cheap.
- Make `DustMotes` desktop-only (`{!isMobile && <DustMotes />}` inside `Sky.tsx`).

### C. `Sky.tsx` — gate DustMotes on a prop
- Accept `isMobile?: boolean` and skip `<DustMotes />` when true.

### D. `Ground.tsx` — cheaper shadow on mobile
- Already accepts `isMobile`. Reduce `ContactShadows` `resolution`/`blur` based on it (mentioned above; concretely implemented in this file because that's where `ContactShadows` lives).

### E. `HeroHeadline.tsx` — drop translucent chip when tree is behind
- The mobile pill (`bg-background/70 rounded-full`) wraps the "Donate now" button only. Switch to a solid `bg-background` so it doesn't blur/wash the canopy directly behind it. Desktop unchanged.

## Out of scope
- No business logic, no copy, no auth, no routes, no new dependencies.
- Desktop hero visuals unchanged (full fog, full ContactShadows resolution, dust motes, AA).

## Verification
1. Open the preview at 390×844; confirm hero shows the gradient for ~1.5 s, then the tree fades in smoothly.
2. Scroll up/down on mobile; confirm no blink in `LiveActivityBar`.
3. Confirm leaves/branches appear visibly sharper (higher DPR + farther fog).
4. Switch to desktop viewport; confirm fog, shadows, dust motes, AA all look identical to before.
