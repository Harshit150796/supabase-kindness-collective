import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import {
  CURSOR_QUERY, NATIVE_DOT_IMAGES, TEXT_ENTRY_SELECTOR, TRAIL_SETTLE_PX, TRAIL_TAU, cursorColour, elementBackground, frameDt,
  opaqueBackground, trailFactor,
} from '@/lib/cursorBackground';
export { CURSOR_QUERY } from '@/lib/cursorBackground';
// null value = pointer is over the live tree or its sky backdrop (no opaque element before the hero stage).
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
      let active = false, inside = false, native = false, focused = document.hasFocus();
      let hovered: Element | null = null;
      let backgroundCache: BgCache | undefined;
      // The system pointer becomes the lead dot over the live tree (see index.css) where this browser
      // supports pointer image sets; have its images ready before the tree appears.
      const probe = (fn: string) => typeof CSS !== 'undefined' && CSS.supports?.('cursor', `${fn}(url("${NATIVE_DOT_IMAGES[0]}") 1x) 16 16, auto`);
      const nativeClass = probe('image-set') ? 'cd-native-dot' : probe('-webkit-image-set') ? 'cd-native-dot-webkit' : '';
      if (nativeClass) { html.classList.add(nativeClass); NATIVE_DOT_IMAGES.forEach(src => { new Image().src = src; }); }
      const admin = () => path.current.startsWith('/admin');
      const paint = (colour: string) => { if (root.dataset.colour !== colour) root.dataset.colour = colour; };
      const write = (i: number) => { dots[i].style.transform = `translate3d(${pos[i].x}px,${pos[i].y}px,0)`; };
      // Over the live tree the OS draws the lead dot (a blue-dot pointer image), so it never waits for the
      // tree's frames; the DOM lead dot hides and takes over again exactly at the pointer when it leaves.
      const setNative = (on: boolean) => {
        on &&= !!nativeClass;
        if (on === native) return;
        native = on;
        root.classList.toggle('cursor-native', on);
        if (!on) { pos[0].x = x; pos[0].y = y; write(0); }
      };
      // Hide the system pointer from load; dots stay invisible until the first move.
      const arm = () => {
        if (focused && !admin() && !html.classList.contains('cd-cursor-active')) html.classList.add('cd-cursor-active');
      };
      const hide = () => {
        active = false; setNative(false);
        cancelAnimationFrame(frame); frame = 0; lastTs = 0; lastNow = 0;
        if (html.classList.contains('cd-cursor-active')) html.classList.remove('cd-cursor-active');
        root.classList.remove('cursor-visible', 'cursor-pressed');
      };
      const stageBackground = (target: Element, stage: Element) => {
        for (let node: Element | null = target; node && node !== stage; node = node.parentElement) if (opaqueBackground(node)) return elementBackground(target);
        return null;
      };
      const checkTarget = (target: Element | null, now: number) => {
        if (!inside) return;
        if (!focused || admin() || !target || target.closest(`${TEXT_ENTRY_SELECTOR},iframe`)) { hide(); return; }
        root.classList.toggle('cursor-hover', !!target.closest('a,button,[role=button],label,summary,[data-cursor=hover]'));
        if (!active) pos.forEach(p => { p.x = x; p.y = y; }); // first entry: all dots at the pointer
        active = true;
        if (!html.classList.contains('cd-cursor-active')) html.classList.add('cd-cursor-active');
        root.classList.add('cursor-visible');
        if (html.classList.contains('cd-intro') && !html.classList.contains('cd-iris')) {
          const intro = document.getElementById('cd-intro');
          root.classList.remove('cursor-hover');
          setNative(false);
          if (intro) { const bg = elementBackground(intro); paint(cursorColour(bg.rgb)); }
          return;
        }
        const stage = target.closest('.hero-stage');
        if (!backgroundCache || backgroundCache.target !== target || now - backgroundCache.at > 150) {
          backgroundCache = { target, at: now, value: stage ? stageBackground(target, stage) : elementBackground(target) };
        }
        const bg = backgroundCache.value;
        setNative(!bg && !!stage && target instanceof HTMLCanvasElement && !root.classList.contains('cursor-hover'));
        if (bg) { paint(cursorColour(bg.rgb, bg.photo)); return; }
        // The live tree and its sky change colour all the time, so the cursor stays blue over them
        // instead of sampling what is underneath (reading pixels back stalled every frame on the GPU).
        paint('blue');
      };
      const tick = (ts: number) => {
        const now = performance.now();
        frame = 0;
        const dt = lastTs ? frameDt(ts - lastTs, now - lastNow) : 16; lastTs = ts; lastNow = now;
        const hadMove = moved; moved = false;
        if (recheck) { recheck = false; if (inside) { hovered = document.elementFromPoint(x, y); checkTarget(hovered, now); } }
        else if (hadMove) checkTarget(hovered, now);
        if (!active) { lastTs = 0; return; }
        let settled = !hadMove;
        for (let i = 0; i < pos.length; i++) {
          const k = trailFactor(dt, TRAIL_TAU[i]), p = pos[i];
          const oldX = p.x, oldY = p.y;
          p.x += (x - p.x) * k; p.y += (y - p.y) * k;
          if (Math.abs(x - p.x) < TRAIL_SETTLE_PX && Math.abs(y - p.y) < TRAIL_SETTLE_PX) { p.x = x; p.y = y; } else settled = false;
          if ((!native || i !== 0) && (p.x !== oldX || p.y !== oldY || hadMove)) write(i);
        }
        if (settled) lastTs = 0; else frame = requestAnimationFrame(tick);
      };
      const start = () => { if (!frame) frame = requestAnimationFrame(tick); };
      const request = () => { recheck = true; start(); };
      const move = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse' || document.hidden || !focused || admin()) return;
        const events = event.getCoalescedEvents?.(); const point = events?.[events.length - 1] ?? event;
        hovered = event.target instanceof Element ? event.target : null;
        x = point.clientX; y = point.clientY; inside = true; moved = true; start();
      };
      const leave = () => { inside = false; hide(); };
      const blur = () => { focused = false; hide(); };
      const focus = () => { focused = true; arm(); request(); };
      const visibility = () => { if (document.hidden) { inside = false; hide(); } else { focused = document.hasFocus(); arm(); } };
      const down = () => { if (active) root.classList.add('cursor-pressed'); };
      const up = () => root.classList.remove('cursor-pressed');
      const introEnd = () => { arm(); request(); };
      routeChanged.current = () => { backgroundCache = undefined; if (admin()) hide(); else { arm(); request(); } };
      const observer = new MutationObserver(() => { backgroundCache = undefined; arm(); if (inside) request(); });
      observer.observe(html, { attributes: true, attributeFilter: ['class'] });
      const scrolled = () => request();
      // Capture the fresh input before canvas raycasting/interaction listeners run.
      window.addEventListener('pointermove', move, { passive: true, capture: true });
      document.addEventListener('visibilitychange', visibility);
      window.addEventListener('scroll', scrolled, { passive: true, capture: true });
      document.addEventListener('mouseleave', leave); window.addEventListener('blur', blur); window.addEventListener('focus', focus);
      window.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
      window.addEventListener('cd:intro-iris', introEnd); window.addEventListener('cd:intro-end', introEnd);
      arm();
      dispose = () => {
        hide(); cancelAnimationFrame(frame); frame = 0; observer.disconnect(); routeChanged.current = () => {};
        if (nativeClass) html.classList.remove(nativeClass);
        window.removeEventListener('scroll', scrolled, true); window.removeEventListener('pointermove', move, true);
        document.removeEventListener('visibilitychange', visibility);
        document.removeEventListener('mouseleave', leave); window.removeEventListener('blur', blur); window.removeEventListener('focus', focus);
        window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        window.removeEventListener('cd:intro-iris', introEnd); window.removeEventListener('cd:intro-end', introEnd);
      };
    };
    setup(); query.addEventListener('change', setup);
    return () => { dispose(); query.removeEventListener('change', setup); };
  }, []);
  return createPortal(<div ref={host} className="cursor-trail" data-colour="blue" aria-hidden="true">
    {[0, 1, 2].map(index => <span key={index}><i>{(['white', 'blue', 'green'] as const).map(colour => <b key={colour} className={`cursor-layer cursor-layer-${colour}`} />)}</i></span>)}
  </div>, document.body);
}
