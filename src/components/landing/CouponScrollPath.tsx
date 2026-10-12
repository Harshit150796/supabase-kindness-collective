import { useEffect, useRef } from 'react';

export function CouponScrollPath() {
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const marker = useRef<SVGGElement>(null);
  useEffect(() => {
    const node = svg.current, curve = path.current, ticket = marker.current;
    const section = node?.parentElement;
    if (!node || !curve || !ticket || !section) return;
    let frame = 0, visible = false, midpoint = 0, viewportHeight = innerHeight;
    let points: number[][] = [], lengths: number[] = [], total = 0;
    const update = () => {
      frame = 0;
      if (!visible || document.hidden || !total) return;
      const progress = Math.max(0, Math.min(1, (viewportHeight * .85 - (midpoint - window.scrollY)) / (viewportHeight * .5)));
      const distance = total * progress;
      let i = 1;
      while (i < lengths.length - 1 && lengths[i] < distance) i++;
      const from = points[i - 1], to = points[i];
      if (!from || !to) return;
      const segment = lengths[i] - lengths[i - 1];
      const fraction = segment ? (distance - lengths[i - 1]) / segment : 0;
      ticket.style.transform = `translate(${from[0] + (to[0] - from[0]) * fraction}px, ${from[1] + (to[1] - from[1]) * fraction}px)`;
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
      lengths = [0]; total = 0;
      for (let i = 1; i < points.length; i++) {
        total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
        lengths.push(total);
      }
      const rect = section.getBoundingClientRect();
      midpoint = rect.top + window.scrollY + rect.height / 2;
      viewportHeight = innerHeight;
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
    <g ref={marker}><rect x="-9" y="-6" width="18" height="12" rx="2" fill="hsl(var(--foreground))" stroke="hsl(var(--background))" /><path d="M2 -4V4" stroke="hsl(var(--background))" strokeDasharray="1 2" /></g>
  </svg>;
}