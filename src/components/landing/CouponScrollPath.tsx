import { useEffect, useRef } from 'react';
import { journeyScrollPoint, journeyScrollProgress, journeyScrollRange, type JourneyPoint } from '@/lib/journeyScrollTiming';

export function CouponScrollPath() {
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const marker = useRef<SVGGElement>(null);
  useEffect(() => {
    const node = svg.current, curve = path.current, ticket = marker.current;
    const section = node?.parentElement;
    if (!node || !curve || !ticket || !section) return;
    let frame = 0, visible = false, start = 0, end = 1;
    let points: JourneyPoint[] = [];
    const update = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      const point = journeyScrollPoint(points, journeyScrollProgress(window.scrollY, start, end));
      if (!point) return;
      ticket.style.transform = `translate(${point[0]}px, ${point[1]}px)`;
    };
    const scroll = () => { if (visible && !document.hidden && !frame) frame = requestAnimationFrame(update); };
    const size = () => {
      const items = Array.from(section.querySelectorAll<HTMLElement>('[data-journey-step]'));
      points = items.map(item => {
        let x = item.offsetWidth / 2, y = item.offsetHeight / 2;
        let current: HTMLElement | null = item;
        while (current && current !== section) {
          x += current.offsetLeft; y += current.offsetTop;
          current = current.offsetParent instanceof HTMLElement ? current.offsetParent : null;
        }
        return [x, y];
      });
      node.setAttribute('viewBox', `0 0 ${section.clientWidth} ${section.clientHeight}`);
      curve.setAttribute('d', points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' '));
      const first = points[0], last = points[points.length - 1];
      if (!first || !last) return;
      const rect = section.getBoundingClientRect();
      const pageTop = rect.top + window.scrollY;
      ({ start, end } = journeyScrollRange(pageTop + first[1], pageTop + last[1], innerHeight));
      scroll();
    };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else if (visible) size();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) size();
      else { cancelAnimationFrame(frame); frame = 0; }
    });
    observer.observe(section);
    const resize = new ResizeObserver(size);
    resize.observe(section);
    // Upstream lazy regions can change the document position without resizing the journey itself.
    section.closest('main')?.querySelectorAll(':scope > *').forEach(element => resize.observe(element));
    size();
    addEventListener('scroll', scroll, { passive: true });
    addEventListener('resize', size, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); resize.disconnect(); removeEventListener('scroll', scroll); removeEventListener('resize', size); document.removeEventListener('visibilitychange', visibility); cancelAnimationFrame(frame); };
  }, []);
  return <svg ref={svg} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
    <path ref={path} fill="none" stroke="hsl(var(--foreground) / .45)" strokeWidth="1" strokeDasharray="2 5" />
    <g ref={marker}><rect x="-9" y="-6" width="18" height="12" rx="2" fill="hsl(var(--primary))" stroke="hsl(var(--foreground))" /><path d="M2 -4V4" stroke="hsl(var(--foreground))" strokeDasharray="1 2" /></g>
  </svg>;
}