import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import {
  CURSOR_QUERY, FOLLOW_SPAN, HOVER_SELECTOR, NATIVE_DOT_IMAGES, NATIVE_ZONE_SELECTOR, followEasing, followProgress, TEXT_ENTRY_SELECTOR, TRAIL_SETTLE_PX, TRAIL_TAU, cursorColour, elementBackground, frameDt,
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
      // Followers (dots 1 and 2) glide on the compositor; this models where each one is right now.
      type Glide = { fx: number; fy: number; tx: number; ty: number; t0: number; anim?: Animation };
      const glides: Glide[] = dots.map(() => ({ fx: -100, fy: -100, tx: -100, ty: -100, t0: 0 }));
      const easing = typeof CSS !== 'undefined' && CSS.supports?.('transition-timing-function', 'linear(0, 1)') ? followEasing() : 'cubic-bezier(.16,1,.3,1)';
      let lastGlide = 0, glidePending = false;
      // The system pointer becomes the lead dot over the live tree (see index.css) where this browser
      // supports pointer image sets; have its images ready before the tree appears.
      const probe = (fn: string) => typeof CSS !== 'undefined' && CSS.supports?.('cursor', `${fn}(url("${NATIVE_DOT_IMAGES[0]}") 1x) 16 16, auto`);
      const nativeClass = probe('image-set') ? 'cd-native-dot' : probe('-webkit-image-set') ? 'cd-native-dot-webkit' : '';
      if (nativeClass) { html.classList.add(nativeClass); NATIVE_DOT_IMAGES.forEach(src => { new Image().src = src; }); }
      const admin = () => path.current.startsWith('/admin');
      const paint = (colour: string) => { if (root.dataset.colour !== colour) root.dataset.colour = colour; };
      const write = (i: number) => { dots[i].style.transform = `translate3d(${pos[i].x}px,${pos[i].y}px,0)`; };
      const T = (px: number, py: number) => `translate3d(${px}px,${py}px,0)`;
      const at = (g: Glide, i: number, now: number) => {
        const k = followProgress(now - g.t0, TRAIL_TAU[i]);
        return { x: g.fx + (g.tx - g.fx) * k, y: g.fy + (g.ty - g.fy) * k };
      };
      const place = (i: number) => {
        const g = glides[i]; g.anim?.cancel(); g.anim = undefined;
        g.fx = g.tx = x; g.fy = g.ty = y; g.t0 = 0; dots[i].style.transform = T(x, y);
      };
      const glide = (now: number) => {
        lastGlide = now; glidePending = false;
        for (let i = 1; i < dots.length; i++) {
          const g = glides[i];
          if (g.tx === x && g.ty === y) continue;
          const c = at(g, i, now);
          g.anim?.cancel();
          g.fx = c.x; g.fy = c.y; g.tx = x; g.ty = y; g.t0 = now;
          dots[i].style.transform = T(x, y);
          g.anim = dots[i].animate([{ transform: T(c.x, c.y) }, { transform: T(x, y) }], { duration: FOLLOW_SPAN * TRAIL_TAU[i], easing });
        }
      };
      // Over the live tree the OS draws the lead dot (a blue-dot pointer image), so it never waits for the
      // tree's frames; the DOM lead dot hides and takes over again exactly at the pointer when it leaves.
      const setNative = (on: boolean) => {
        on &&= !!nativeClass;
        if (on === native) return;
        native = on;
        root.classList.toggle('cursor-native', on);
        html.classList.toggle('cd-native-zone', on);
        if (!on) { html.classList.remove('cd-native-pressed'); pos[0].x = x; pos[0].y = y; write(0); }
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
        glides.forEach(g => { g.anim?.cancel(); g.anim = undefined; });
      };
      const stageBackground = (target: Element, stage: Element) => {
        for (let node: Element | null = target; node && node !== stage; node = node.parentElement) if (opaqueBackground(node)) return elementBackground(target);
        return null;
      };
      const checkTarget = (target: Element | null, now: number) => {
        if (!inside) return;
        if (!focused || admin() || !target || target.closest(`${TEXT_ENTRY_SELECTOR},iframe`)) { hide(); return; }
        root.classList.toggle('cursor-hover', !!target.closest(HOVER_SELECTOR));
        if (!active) { pos.forEach(p => { p.x = x; p.y = y; }); write(0); for (let i = 1; i < dots.length; i++) place(i); } // first entry: all dots at the pointer
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
        if (!backgroundCache || backgroundCache.target !== target || now - backgroundCache.at > 400) {
          backgroundCache = { target, at: now, value: stage ? stageBackground(target, stage) : elementBackground(target) };
        }
        const bg = backgroundCache.value;
        setNative(!!target.closest(NATIVE_ZONE_SELECTOR) && !root.classList.contains('cursor-hover'));
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
        if (glidePending || hadMove) glide(now);
        // Only the lead dot is stepped here; the followers glide on the compositor.
        let settled = !hadMove;
        const k = trailFactor(dt, TRAIL_TAU[0]), p = pos[0];
        const oldX = p.x, oldY = p.y;
        p.x += (x - p.x) * k; p.y += (y - p.y) * k;
        if (Math.abs(x - p.x) < TRAIL_SETTLE_PX && Math.abs(y - p.y) < TRAIL_SETTLE_PX) { p.x = x; p.y = y; } else settled = false;
        if (!native && (p.x !== oldX || p.y !== oldY || hadMove)) write(0);
        if (settled) lastTs = 0; else frame = requestAnimationFrame(tick);
      };
      const start = () => { if (!frame) frame = requestAnimationFrame(tick); };
      const request = () => { recheck = true; start(); };
      const move = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse' || document.hidden || !focused || admin()) return;
        const events = event.getCoalescedEvents?.(); const point = events?.[events.length - 1] ?? event;
        hovered = event.target instanceof Element ? event.target : null;
        x = point.clientX; y = point.clientY; inside = true; moved = true;
        // Retarget the compositor glides straight from input (bounded rate) so they never wait for a frame.
        if (active) { const now = performance.now(); if (now - lastGlide >= 8) glide(now); else glidePending = true; }
        start();
      };
      const leave = () => { inside = false; hide(); };
      const blur = () => { focused = false; hide(); };
      const focus = () => { focused = true; arm(); request(); };
      const visibility = () => { if (document.hidden) { inside = false; hide(); } else { focused = document.hasFocus(); arm(); } };
      const down = () => { if (active) { root.classList.add('cursor-pressed'); if (native) html.classList.add('cd-native-pressed'); } };
      const up = () => { root.classList.remove('cursor-pressed'); html.classList.remove('cd-native-pressed'); };
      const introEnd = () => { arm(); request(); };
      routeChanged.current = () => { backgroundCache = undefined; if (admin()) hide(); else { arm(); request(); } };
      // Ignore the cursor's own html classes so toggling them never feeds back into extra hit tests.
      const own = /\b(cd-native-zone|cd-native-pressed|cd-cursor-active)\b/g;
      const observer = new MutationObserver(records => {
        if (records.every(r => (r.oldValue ?? '').replace(own, '').trim().split(/\s+/).sort().join(' ') === html.className.replace(own, '').trim().split(/\s+/).sort().join(' '))) return;
        backgroundCache = undefined; arm(); if (inside) request();
      });
      observer.observe(html, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
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
