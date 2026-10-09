import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import {
  CURSOR_QUERY, TEXT_ENTRY_SELECTOR, TRAIL_SETTLE_PX, TRAIL_TAU, elementBackground, frameDt, immediateColour, opaqueBackground,
  samplePoster, stableColour, trailFactor, type ColourHysteresis, type CursorRGB,
} from '@/lib/cursorBackground';
export { CURSOR_QUERY } from '@/lib/cursorBackground';
type Sample = CursorRGB & { x: number; y: number; used?: boolean };
// null value = pointer is over the tree picture (no opaque element before the hero stage).
type BgCache = { target: Element; at: number; value: ReturnType<typeof elementBackground> | null };
export function CursorTrail() {
  const { pathname } = useLocation();
  const host = useRef<HTMLDivElement>(null);
  const path = useRef(pathname);
  const routeChanged = useRef<() => void>(() => {});
  useEffect(() => { path.current = pathname; routeChanged.current(); }, [pathname]);
  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const html = document.documentElement, query = matchMedia(CURSOR_QUERY);
    let dispose = () => {};
    const setup = () => {
      dispose();
      if (!query.matches) return;
      const dots = Array.from(root.children) as HTMLElement[];
      const pos = dots.map(() => ({ x: -100, y: -100 }));
      let x = -100, y = -100, frame = 0, lastTs = 0, lastNow = 0, moved = false, recheck = false;
      let active = false, inside = false, focused = document.hasFocus();
      let canvasTarget: HTMLCanvasElement | null = null;
      let hovered: Element | null = null;
      let backgroundCache: BgCache | undefined;
      let posterRect: { src: string; at: number; left: number; top: number; width: number; height: number } | undefined;
      let posterStale = true;
      // Poster rect cached in viewport coordinates; refreshed only when stale, on src change or after 500ms.
      const posterViewRect = (image: HTMLImageElement, now: number) => {
        if (!posterRect || posterStale || posterRect.src !== image.currentSrc || now - posterRect.at > 500) {
          const r = image.getBoundingClientRect();
          posterRect = { src: image.currentSrc, at: now, left: r.left, top: r.top, width: r.width, height: r.height };
          posterStale = false;
        }
        return posterRect;
      };
      let sampled: Sample | undefined;
      const tone: ColourHysteresis = {};
      const admin = () => path.current.startsWith('/admin');
      const paint = (colour: string) => { if (root.dataset.colour !== colour) root.dataset.colour = colour; };
      const near = (s: Sample) => Math.abs(s.x - x) < 2 && Math.abs(s.y - y) < 2;
      const write = (i: number) => { dots[i].style.transform = `translate3d(${pos[i].x}px,${pos[i].y}px,0)`; };
      // Hide the system pointer from load; dots stay invisible until the first move.
      const arm = () => {
        if (focused && !admin() && !html.classList.contains('cd-intro') && !html.classList.contains('cd-cursor-active')) html.classList.add('cd-cursor-active');
      };
      const hide = () => {
        active = false; canvasTarget = null;
        if (html.classList.contains('cd-cursor-active')) html.classList.remove('cd-cursor-active');
        root.classList.remove('cursor-visible', 'cursor-pressed');
      };
      const stageBackground = (target: Element, stage: Element) => {
        for (let node: Element | null = target; node && node !== stage; node = node.parentElement) if (opaqueBackground(node)) return elementBackground(target);
        return null;
      };
      const checkTarget = (target: Element | null, now: number) => {
        if (!inside) return;
        if (!focused || admin() || html.classList.contains('cd-intro') || !target || target.closest(`${TEXT_ENTRY_SELECTOR},iframe`)) { hide(); return; }
        root.classList.toggle('cursor-hover', !!target.closest('a,button,[role=button],label,summary,[data-cursor=hover]'));
        if (!active) pos.forEach(p => { p.x = x; p.y = y; }); // first entry: all dots at the pointer
        active = true;
        if (!html.classList.contains('cd-cursor-active')) html.classList.add('cd-cursor-active');
        root.classList.add('cursor-visible');
        if (!backgroundCache || backgroundCache.target !== target || now - backgroundCache.at > 150) {
          const stage = target.closest('.hero-stage');
          backgroundCache = { target, at: now, value: stage ? stageBackground(target, stage) : elementBackground(target) };
        }
        const bg = backgroundCache.value;
        canvasTarget = null;
        if (bg) { paint(immediateColour(tone, bg.rgb, bg.photo)); return; }
        const stage = target.closest('.hero-stage')!;
        const poster = stage.querySelector<HTMLImageElement>('[data-tree-poster] img');
        const picture = poster?.closest('picture');
        if (poster && picture && !picture.classList.contains('opacity-0')) {
          const rgb = samplePoster(poster, x, y, posterViewRect(poster, now));
          if (rgb) paint(stableColour(tone, rgb, now));
        } else {
          canvasTarget = stage.querySelector('canvas');
          if (canvasTarget && sampled && !sampled.used && near(sampled)) { sampled.used = true; paint(stableColour(tone, sampled, now)); }
        }
      };
      const tick = (ts: number) => {
        const now = performance.now();
        frame = 0;
        const dt = lastTs ? frameDt(ts - lastTs, now - lastNow) : 16; lastTs = ts; lastNow = now;
        const hadMove = moved; moved = false;
        if (recheck) { recheck = false; if (inside) { hovered = document.elementFromPoint(x, y); checkTarget(hovered, now); } }
        else if (hadMove || tone.pending) checkTarget(hovered, now); // keep sampling while a colour hold is pending
        if (!active) { lastTs = 0; return; }
        let settled = !hadMove;
        for (let i = 0; i < pos.length; i++) {
          const k = trailFactor(dt, TRAIL_TAU[i]), p = pos[i];
          p.x += (x - p.x) * k; p.y += (y - p.y) * k;
          if (Math.abs(x - p.x) < TRAIL_SETTLE_PX && Math.abs(y - p.y) < TRAIL_SETTLE_PX) { p.x = x; p.y = y; } else settled = false;
          write(i);
        }
        if (tone.pending) settled = false; // keep the loop alive until the colour hold resolves
        if (settled) lastTs = 0; else frame = requestAnimationFrame(tick);
      };
      const start = () => { if (!frame) frame = requestAnimationFrame(tick); };
      const request = () => { recheck = true; start(); };
      const move = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        const events = event.getCoalescedEvents?.(); const point = events?.[events.length - 1] ?? event;
        hovered = event.target instanceof Element ? event.target : null;
        x = point.clientX; y = point.clientY; inside = true; moved = true; start();
      };
      const leave = () => { inside = false; hide(); };
      const blur = () => { focused = false; hide(); };
      const focus = () => { focused = true; arm(); request(); };
      const down = () => { if (active) root.classList.add('cursor-pressed'); };
      const up = () => root.classList.remove('cursor-pressed');
      const introEnd = () => { arm(); request(); };
      const background = (event: Event) => {
        sampled = { ...(event as CustomEvent<Sample>).detail };
        if (active && canvasTarget && near(sampled)) { sampled.used = true; paint(stableColour(tone, sampled, performance.now())); }
      };
      routeChanged.current = () => { backgroundCache = undefined; if (admin()) hide(); else { arm(); request(); } };
      const timer = window.setInterval(() => { if (canvasTarget && active) request(); }, 100);
      const observer = new MutationObserver(() => { if (html.classList.contains('cd-intro')) hide(); });
      observer.observe(html, { attributes: true, attributeFilter: ['class'] });
      const resize = () => { posterStale = true; };
      const scrolled = () => { posterStale = true; request(); };
      window.addEventListener('resize', resize, { passive: true });
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('scroll', scrolled, { passive: true, capture: true });
      document.addEventListener('mouseleave', leave); window.addEventListener('blur', blur); window.addEventListener('focus', focus);
      window.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
      window.addEventListener('cd:cursor-bg', background); window.addEventListener('cd:intro-iris', hide); window.addEventListener('cd:intro-end', introEnd);
      arm();
      dispose = () => {
        hide(); cancelAnimationFrame(frame); frame = 0; clearInterval(timer); observer.disconnect(); routeChanged.current = () => {};
        window.removeEventListener('scroll', scrolled, true); window.removeEventListener('pointermove', move); window.removeEventListener('resize', resize);
        document.removeEventListener('mouseleave', leave); window.removeEventListener('blur', blur); window.removeEventListener('focus', focus);
        window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        window.removeEventListener('cd:cursor-bg', background); window.removeEventListener('cd:intro-iris', hide); window.removeEventListener('cd:intro-end', introEnd);
      };
    };
    setup(); query.addEventListener('change', setup);
    return () => { dispose(); query.removeEventListener('change', setup); };
  }, []);
  return createPortal(<div ref={host} className="cursor-trail" data-colour="blue" aria-hidden="true">
    {[0, 1, 2].map(index => <span key={index}><i>{(['white', 'blue', 'green'] as const).map(colour => <b key={colour} className={`cursor-layer cursor-layer-${colour}`} />)}</i></span>)}
  </div>, document.body);
}
