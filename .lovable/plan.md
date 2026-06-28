# Mobile Blurring Fix Plan

## Root cause

Three overlays sit on top of the animated WebGL tree on the mobile hero and all use `backdrop-blur-xl`. Mobile GPUs re-sample and blur the underlying animated pixels every frame, which causes the surrounding text/elements to look intermittently soft, ghosted, or to "shimmer" as the tree animates. This matches the known pattern: `backdrop-blur` over animated content is the culprit, not the tree itself.

Additional minor offenders: the global `.glass` / `.glass-strong` utilities (12–20px blur) and a handful of decorative `blur-xl/2xl/3xl` halos pile onto the mobile compositor.

## Files to change

1. `src/components/landing/hero/TopDonorsPanel.tsx`
   - Line 38: `bg-background/85 backdrop-blur-xl` → `bg-background md:bg-background/85 md:backdrop-blur-xl`. Solid panel on mobile, glass only on desktop.

2. `src/components/landing/tree3d/TransparencyPopover.tsx`
   - Line 29: same gating — drop `backdrop-blur-xl` and translucency on mobile, keep on `md+`.

3. `src/components/landing/hero/AITreeChat.tsx`
   - Line 97: drop `bg-background/95 backdrop-blur-xl` on mobile; use solid `bg-background` and apply blur only at `md+`. The chat panel covers the tree on mobile anyway.

4. `src/index.css` (lines 367–379)
   - Make `.glass` and `.glass-strong` solid on small screens; only apply `backdrop-filter: blur(...)` inside a `@media (min-width: 768px)` block. Keeps the desktop aesthetic, removes the per-frame cost on phones.

5. `src/components/landing/hero/HeroHeadline.tsx`
   - Line 59: the wrapper still has `md:backdrop-blur-sm` — leave as-is (already mobile-safe), but verify no nested child reintroduces blur on mobile.

## Out of scope

- Decorative `blur-3xl` halos on `/about`, `/apply`, CTA section — not over the animated tree, low perceived cost. Leave untouched unless the issue persists.
- 3D rendering settings (DPR, leaf count, shadows) — already tuned, do not regress.
- `LiveActivityBar` pill (line 173) — already gated to `md:backdrop-blur-sm`.

## Verification

After the edits, on a mobile viewport (≤390px) the hero should show solid panels with no shimmering as the tree animates. Drive Playwright at 384×800, scroll the hero, and screenshot mid-animation to confirm crisp text edges on the donors panel, transparency popover, and AI chat.
