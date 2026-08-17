# Blend the navbar into the hero sky (editorial layered)

Right now the header is a solid white bar with a hard bottom border sitting directly above the 3D scene, so the sky starts with a visible seam and the nav reads as a separate widget. The fix is to let the real sky run behind the header at the top of the page, and only materialise the header as glass once the user scrolls.

## The look

- **At the top of the page:** the header has no background and no border. The live sky from the 3D scene continues straight up behind the logo and links, so the tree scene starts at the very top of the browser window. A very soft top-down light scrim (barely visible) keeps the text readable against any sky colour.
- **The seam becomes a sun-glow hairline:** instead of a grey 1px border, a thin warm gradient line (transparent -> gold -> transparent, centre-weighted) sits at the bottom edge of the header only while it is transparent. It reads as horizon light rather than a UI divider.
- **On scroll (after ~24px):** the header fades into the existing frosted glass treatment (translucent background + blur + subtle border) so navigation stays legible over white page sections. The transition is a short opacity/blur crossfade, not a jump.
- **Editorial kicker:** the small "Transforming Giving" line under the logo picks up letter-spaced uppercase micro-type so the lockup reads like a masthead, and both logo words keep their existing brand colours.
- Links and buttons keep their current text and order; over the sky they gain a soft text shadow and a slightly stronger weight so they stay crisp. The "Start Donating" button keeps its solid emerald fill — it is the one anchored, opaque element and becomes the visual focal point.

Nothing about the tree, leaves, coupons, donor labels, or hero copy changes.

## Technical notes

- `src/components/layout/Navbar.tsx`: add a `scrolled` state driven by a passive `scroll` listener (threshold 24px, `requestAnimationFrame`-throttled). Swap the `nav` classes between a transparent variant (no bg, no border, scrim + glow pseudo-layers) and the current glass variant. Both variants are absolutely-positioned layers with opacity transitions so no layout shift occurs.
- Overlap: the header must sit *over* the hero rather than above it. Add a `transparent`-aware wrapper — the nav stays `sticky top-0 z-50`, and `src/components/landing/HeroSection.tsx` gets a negative top margin equal to the nav height plus matching top padding for its overlay children, so the canvas paints under the header while the headline chip and CTAs stay clear of it.
- Nav height is currently `h-18` (72px); express the offset from a single shared constant/utility class so the two files cannot drift.
- Scrim and glow use semantic tokens / existing brand values in `index.css` — no hardcoded `text-white` or `bg-black` utilities.
- Only the landing route needs the transparent state; other pages render the header in its normal glass state, so gate the transparent variant on the hero being present (prop from `Index.tsx`) rather than on route sniffing.

## Verification

Load `/` at desktop (1280), tablet (~834) and mobile widths: confirm the sky reaches the top of the viewport with no white bar or seam, nav text is readable against the sunset sky, the glow hairline is visible only at scroll 0, the glass header appears smoothly after scrolling, and other pages (`/about`, `/donate`) still show the normal opaque header.
