import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import {
  CURSOR_QUERY, TEXT_ENTRY_SELECTOR, TRAIL_SETTLE_PX, TRAIL_TAU, elementBackground, immediateColour, samplePoster,
  stableColour, trailFactor, type ColourHysteresis, type CursorRGB,
} from '@/lib/cursorBackground';
export { CURSOR_QUERY } from '@/lib/cursorBackground';
type Sample = CursorRGB & { x: number; y: number; used?: boolean };
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
      const pos = dots.map(() => ({ x: -100, y: -100 }));
      let x = -100, y = -100, frame = 0, last = 0, moved = false, recheck = false;
      let active = false, inside = false, focused = document.hasFocus();
      let canvasTarget: HTMLCanvasElement | null = null;
      let sampled: Sample | undefined;
      const tone: ColourHysteresis = {};
      const paint = (colour: string) => { if (root.dataset.colour !== colour) root.dataset.colour = colour; };
      const near = (s: Sample) => Math.abs(s.x - x) < 2 && Math.abs(s.y - y) < 2;
      const write = (i: number) => { dots[i].style.transform = `translate3d(${pos[i].x}px,${pos[i].y}px,0)`; };
      const hide = () => {
        active = false; canvasTarget = null;
        if (html.classList.contains('cd-cursor-active')) html.classList.remove('cd-cursor-active');
        root.classList.remove('cursor-visible', 'cursor-pressed');
      };
      const checkTarget = () => {
        const target = document.elementFromPoint(x, y);
        if (!inside || !focused || html.classList.contains('cd-intro') || !target || target.closest(`${TEXT_ENTRY_SELECTOR},iframe`)) { hide(); return; }
        root.classList.toggle('cursor-hover', !!target.closest('a,button,[role=button],label,summary,[data-cursor=hover]'));
        if (!active) pos.forEach(p => { p.x = x; p.y = y; }); // first entry: all dots at the pointer
        active = true;
        if (!html.classList.contains('cd-cursor-active')) html.classList.add('cd-cursor-active');
        root.classList.add('cursor-visible');
        const poster = target.closest('.hero-stage')?.querySelector<HTMLImageElement>('[data-tree-poster] img');
        const picture = poster?.closest('picture');
        const posterVisible = poster && picture && !picture.classList.contains('opacity-0') && (target instanceof HTMLCanvasElement || target === poster || target === picture);
        canvasTarget = !posterVisible && target instanceof HTMLCanvasElement ? target : null;
        if (posterVisible) {
          const rgb = samplePoster(poster, x, y); if (rgb) paint(stableColour(tone, rgb));
        } else if (canvasTarget) {
          if (sampled && !sampled.used && near(sampled)) { sampled.used = true; paint(stableColour(tone, sampled)); }
        } else { const bg = elementBackground(target); paint(immediateColour(tone, bg.rgb, bg.photo)); }
      };
      // One rAF loop, alive only while moving or while the tail is still settling.
      const tick = (now: number) => {
        frame = 0;
        const dt = last ? now - last : 16; last = now;
        const hadMove = moved; moved = false;
        if (hadMove || recheck) { recheck = false; checkTarget(); }
        if (!active) { last = 0; return; }
        pos[0].x = x; pos[0].y = y; write(0); // lead dot is the cursor: no smoothing
        let settled = !hadMove;
        for (let i = 1; i < pos.length; i++) {
          const k = trailFactor(dt, TRAIL_TAU[i - 1]), p = pos[i];
          p.x += (x - p.x) * k; p.y += (y - p.y) * k;
          if (Math.abs(x - p.x) < TRAIL_SETTLE_PX && Math.abs(y - p.y) < TRAIL_SETTLE_PX) { p.x = x; p.y = y; } else settled = false;
          write(i);
        }
        if (settled) last = 0; else frame = requestAnimationFrame(tick);
      };
      const start = () => { if (!frame) frame = requestAnimationFrame(tick); };
      const request = () => { recheck = true; start(); };
      const move = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        const events = event.getCoalescedEvents?.(); const point = events?.[events.length - 1] ?? event;
        x = point.clientX; y = point.clientY; inside = true; moved = true; start();
      };
      const leave = () => { inside = false; hide(); };
      const blur = () => { focused = false; hide(); };
      const focus = () => { focused = true; request(); };
      const down = () => { if (active) root.classList.add('cursor-pressed'); };
      const up = () => root.classList.remove('cursor-pressed');
      const background = (event: Event) => {
        sampled = { ...(event as CustomEvent<Sample>).detail };
        if (active && canvasTarget && near(sampled)) { sampled.used = true; paint(stableColour(tone, sampled)); }
      };
      const timer = window.setInterval(() => { if (canvasTarget && active) request(); }, 100);
      const observer = new MutationObserver(() => { if (html.classList.contains('cd-intro')) hide(); });
      observer.observe(html, { attributes: true, attributeFilter: ['class'] });
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('scroll', request, { passive: true, capture: true });
      document.addEventListener('mouseleave', leave); window.addEventListener('blur', blur); window.addEventListener('focus', focus);
      window.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
      window.addEventListener('cd:cursor-bg', background); window.addEventListener('cd:intro-iris', hide); window.addEventListener('cd:intro-end', request);
      dispose = () => {
        hide(); cancelAnimationFrame(frame); frame = 0; clearInterval(timer); observer.disconnect();
        window.removeEventListener('scroll', request, true); window.removeEventListener('pointermove', move);
        document.removeEventListener('mouseleave', leave); window.removeEventListener('blur', blur); window.removeEventListener('focus', focus);
        window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        window.removeEventListener('cd:cursor-bg', background); window.removeEventListener('cd:intro-iris', hide); window.removeEventListener('cd:intro-end', request);
      };
    };
    setup(); query.addEventListener('change', setup);
    return () => { dispose(); query.removeEventListener('change', setup); };
  }, [pathname]);
  return createPortal(<div ref={host} className="cursor-trail" data-colour="blue" aria-hidden="true">
    {[0, 1, 2].map(index => <span key={index}><i>{(['white', 'blue', 'green'] as const).map(colour => <b key={colour} className={`cursor-layer cursor-layer-${colour}`} />)}</i></span>)}
  </div>, document.body);
}
