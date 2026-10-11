import { useLayoutEffect, useRef } from 'react';
import { drawHeroBackdrop, PHONE_BREAKPOINT, type HeroSky } from '@/lib/heroBackdrop';

/**
 * The tree's own sky and ground, painted before the tree's first frame (and in place of the tree
 * without WebGL). It sits under the live canvas inside .hero-tree, so it zooms with it during the
 * opening, and it is drawn before the hero first paints, so the hero never shows another sky.
 */
export function HeroBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const root = document.documentElement;
    let frame = 0;
    const draw = () => {
      frame = 0;
      try {
        drawHeroBackdrop(canvas, root.dataset.sky === 'day' ? 'day' : 'night' as HeroSky, window.innerWidth < PHONE_BREAKPOINT);
      } catch {
        // The CSS sky and hill on .hero-stage stay underneath as a fallback.
      }
    };
    const later = () => { if (!frame) frame = requestAnimationFrame(draw); };
    draw();
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(later);
    resize?.observe(canvas);
    // Tapping the sky switches it; the live scene fades, and this follows underneath.
    const sky = new MutationObserver(later);
    sky.observe(root, { attributes: true, attributeFilter: ['data-sky'] });
    return () => { cancelAnimationFrame(frame); resize?.disconnect(); sky.disconnect(); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" data-hero-backdrop className="absolute inset-0 h-full w-full" />;
}
