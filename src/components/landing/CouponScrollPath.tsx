import { useEffect, useRef } from 'react';

export function CouponScrollPath() {
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const marker = useRef<SVGGElement>(null);
  useEffect(() => {
    const node = svg.current, curve = path.current, ticket = marker.current;
    const section = node?.parentElement;
    if (!node || !curve || !ticket || !section) return;
    let frame = 0;
    const size = () => {
      const items = Array.from(section.querySelectorAll<HTMLElement>('[data-journey-step]'));
      const parent = section.getBoundingClientRect();
      const points = items.map(item => { const rect = item.getBoundingClientRect(); return [rect.left - parent.left + 10, rect.top - parent.top + 10]; });
      node.setAttribute('viewBox', `0 0 ${parent.width} ${parent.height}`);
      curve.setAttribute('d', points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' '));
      update();
    };
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight * .8 - rect.top) / (rect.height + innerHeight * .3)));
      const point = curve.getPointAtLength(curve.getTotalLength() * progress);
      ticket.setAttribute('transform', `translate(${point.x} ${point.y})`);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(size); resize.observe(section); size();
    addEventListener('scroll', scroll, { passive: true });
    return () => { resize.disconnect(); removeEventListener('scroll', scroll); cancelAnimationFrame(frame); };
  }, []);
  return <svg ref={svg} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
    <path ref={path} fill="none" stroke="hsl(var(--primary-foreground) / .45)" strokeWidth="1" strokeDasharray="2 5" />
    <g ref={marker}><rect x="-9" y="-6" width="18" height="12" rx="2" fill="hsl(var(--brand-donation))" stroke="hsl(var(--primary-foreground))" /><path d="M2 -4V4" stroke="hsl(var(--primary-foreground))" strokeDasharray="1 2" /></g>
  </svg>;
}