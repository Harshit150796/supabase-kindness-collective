import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { CURSOR_QUERY, TEXT_ENTRY_SELECTOR, cursorColour, elementBackground, samplePoster, type CursorRGB } from '@/lib/cursorBackground';
export { CURSOR_QUERY } from '@/lib/cursorBackground';
export function CursorTrail() {
  const { pathname } = useLocation();
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const html = document.documentElement, query = matchMedia(CURSOR_QUERY);
    let dispose = () => {};
    const setup = () => {
      dispose();
      if (!query.matches || pathname.startsWith('/admin')) return;
      const dots = Array.from(root.children) as HTMLElement[];
      let x = -100, y = -100, frame = 0, active = false, inside = false, focused = document.hasFocus();
      let canvasTarget: HTMLCanvasElement | null = null;
      let sampled: (CursorRGB & { x: number; y: number }) | undefined;
      const colour = (rgb: CursorRGB, photo = false) => { root.dataset.colour = cursorColour(rgb, photo); };
      const hide = () => {
        active = false; canvasTarget = null;
        if (html.classList.contains('cd-cursor-active')) html.classList.remove('cd-cursor-active');
        root.classList.remove('cursor-visible', 'cursor-pressed');
      };
      const checkTarget = () => {
        const target = document.elementFromPoint(x, y);
        if (!inside || !focused || html.classList.contains('cd-intro') || !target || target.closest(`${TEXT_ENTRY_SELECTOR},iframe`)) { hide(); return; }
        root.classList.toggle('cursor-hover', !!target.closest('a,button,[role=button],label,summary,[data-cursor=hover]'));
        if (!active) {
          dots.forEach(dot => { dot.style.transition = 'none'; dot.style.transform = `translate3d(${x}px,${y}px,0)`; });
          void root.offsetWidth;
          dots.forEach(dot => { dot.style.transition = ''; });
        }
        active = true;
        if (!html.classList.contains('cd-cursor-active')) html.classList.add('cd-cursor-active');
        root.classList.add('cursor-visible');
        const poster = target.closest('.hero-stage')?.querySelector<HTMLImageElement>('[data-tree-poster] img');
        const picture = poster?.closest('picture');
        const posterVisible = poster && picture && !picture.classList.contains('opacity-0') && (target instanceof HTMLCanvasElement || target === poster || target === picture);
        canvasTarget = !posterVisible && target instanceof HTMLCanvasElement ? target : null;
        if (posterVisible) {
          const rgb = samplePoster(poster, x, y); if (rgb) colour(rgb);
        } else if (canvasTarget) {
          if (sampled && Math.abs(sampled.x - x) < 2 && Math.abs(sampled.y - y) < 2) colour(sampled);
        } else { const bg = elementBackground(target); colour(bg.rgb, bg.photo); }
      };
      // One-shot input batching, never a chasing animation loop.
      const flush = () => { frame = 0; checkTarget(); if (active) dots.forEach(dot => { dot.style.transform = `translate3d(${x}px,${y}px,0)`; }); };
      const schedule = () => { if (!frame) frame = requestAnimationFrame(flush); };
      const move = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        const events = event.getCoalescedEvents?.(); const point = events?.[events.length - 1] ?? event;
        x = point.clientX; y = point.clientY; inside = true; schedule();
      };
      const leave = () => { inside = false; hide(); };
      const blur = () => { focused = false; hide(); };
      const focus = () => { focused = true; schedule(); };
      const down = () => { if (active) root.classList.add('cursor-pressed'); };
      const up = () => root.classList.remove('cursor-pressed');
      const background = (event: Event) => {
        sampled = (event as CustomEvent<CursorRGB & { x: number; y: number }>).detail;
        if (active && canvasTarget && Math.abs(sampled.x - x) < 2 && Math.abs(sampled.y - y) < 2) colour(sampled);
      };
      const timer = window.setInterval(() => { if (canvasTarget && active) schedule(); }, 100);
      const observer = new MutationObserver(() => { if (html.classList.contains('cd-intro')) hide(); });
      observer.observe(html, { attributes: true, attributeFilter: ['class'] });
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('scroll', schedule, { passive: true, capture: true });
      document.addEventListener('mouseleave', leave); window.addEventListener('blur', blur); window.addEventListener('focus', focus);
      window.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
      window.addEventListener('cd:cursor-bg', background); window.addEventListener('cd:intro-iris', hide); window.addEventListener('cd:intro-end', schedule);
      dispose = () => {
        hide(); cancelAnimationFrame(frame); clearInterval(timer); observer.disconnect();
        window.removeEventListener('scroll', schedule, true); window.removeEventListener('pointermove', move);
        document.removeEventListener('mouseleave', leave); window.removeEventListener('blur', blur); window.removeEventListener('focus', focus);
        window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        window.removeEventListener('cd:cursor-bg', background); window.removeEventListener('cd:intro-iris', hide); window.removeEventListener('cd:intro-end', schedule);
      };
    };
    setup(); query.addEventListener('change', setup);
    return () => { dispose(); query.removeEventListener('change', setup); };
  }, [pathname]);
  return createPortal(<div ref={host} className="cursor-trail" data-colour="blue" aria-hidden="true">
    {[0, 1, 2].map(index => <span key={index}><i>{(['white', 'blue', 'green'] as const).map(colour => <b key={colour} className={`cursor-layer cursor-layer-${colour}`} />)}</i></span>)}
  </div>, document.body);
}
