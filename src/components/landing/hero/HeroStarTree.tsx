import { useEffect, useMemo, useRef, useState } from 'react';
import { PHONE_BREAKPOINT, type HeroSky } from '@/lib/heroBackdrop';
import { HeroSignpost } from '@/components/landing/hero/HeroSignpost';
import { planStarTree, starTreeMarkup, STAR_TREE_SECONDS } from '@/lib/starTree';
import { useMotionPreference } from '@/hooks/useMotionPreference';

const readSky = (): HeroSky => (typeof document !== 'undefined' && document.documentElement.dataset.sky === 'day' ? 'day' : 'night');
/** The halves of the headline meet first; the firefly sets off just after. */
const START_DELAY_MS = 600;

/**
 * "One firefly plants a star tree" (src/lib/starTree.ts): plays once when the hero shows, then stays.
 * Pause animations, a later resize or a sky switch show the finished picture.
 */
export function HeroStarTree({ play }: { play: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<[number, number]>([0, 0]);
  const [sky, setSky] = useState<HeroSky>(readSky);
  const [phase, setPhase] = useState<'wait' | 'play' | 'done'>('wait');
  const gentle = useMotionPreference() === 'gentle';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize([el.clientWidth, el.clientHeight]);
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    const mo = new MutationObserver(() => setSky(readSky()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-sky'] });
    return () => { ro?.disconnect(); mo.disconnect(); };
  }, []);

  // Start once the scene shows; finish after the moment's length.
  useEffect(() => {
    if (!play || phase !== 'wait') return;
    if (gentle) { setPhase('done'); return; }
    const t = window.setTimeout(() => setPhase('play'), START_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [play, phase, gentle]);
  useEffect(() => {
    if (phase !== 'play') return;
    const t = window.setTimeout(() => setPhase('done'), STAR_TREE_SECONDS * 1000 + 200);
    return () => window.clearTimeout(t);
  }, [phase]);

  // A resize, a sky switch or Pause during the moment: show the finished picture.
  const firstLayout = useRef<string | null>(null);
  const layoutKey = `${size[0]}x${size[1]}:${sky}`;
  useEffect(() => {
    if (phase !== 'play') { firstLayout.current = null; return; }
    if (firstLayout.current === null) firstLayout.current = layoutKey;
    else if (firstLayout.current !== layoutKey) setPhase('done');
  }, [phase, layoutKey]);
  useEffect(() => { if (gentle && phase === 'play') setPhase('done'); }, [gentle, phase]);

  // Phones get the still signpost instead (founder decision, Oct 2026): no firefly moment there.
  const phone = size[0] > 0 && size[0] < PHONE_BREAKPOINT;
  const plan = useMemo(() => (phone ? null : planStarTree(size[0], size[1], sky)), [phone, size, sky]);
  const markup = useMemo(() => (plan && phase !== 'wait' ? starTreeMarkup(plan, sky, phase === 'play') : ''), [plan, sky, phase]);

  // SMIL clocks start with the document: restart this one when the moment begins.
  useEffect(() => {
    const svg = svgRef.current;
    if (phase === 'play' && svg) { try { svg.setCurrentTime(0); svg.unpauseAnimations(); } catch { /* no SMIL: the picture is already final */ } }
  }, [phase, markup]);

  return (
    <div ref={ref} className="absolute inset-0 z-20 pointer-events-none" data-star-tree={phone ? 'signpost' : plan?.layout ?? 'none'}>
      {phone && <HeroSignpost width={size[0]} height={size[1]} />}
      {markup && (
        <svg ref={svgRef} width={size[0]} height={size[1]} viewBox={`0 0 ${size[0]} ${size[1]}`} className="absolute inset-0 overflow-visible" aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />
      )}
      {plan && <p className="sr-only">We plant a tree for every $10 you give.</p>}
    </div>
  );
}
