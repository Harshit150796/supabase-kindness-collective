import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const CURSOR_QUERY = '(hover: hover) and (pointer: fine)';

export function CursorTrail() {
  const { pathname } = useLocation();
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = host.current;
    if (!root || pathname.startsWith('/admin')) return;
    const query = matchMedia(CURSOR_QUERY);
    let dispose = () => {};
    const setup = () => {
      dispose();
      if (!query.matches) return;
      const dots = Array.from(root.children) as HTMLElement[];
      const points = dots.map(() => ({ x: -100, y: -100 }));
      let x = -100, y = -100, frame = 0, last = 0, active = false;
      const move = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        x = event.clientX; y = event.clientY;
        if (!active) points.forEach(point => { point.x = x; point.y = y; });
        active = true;
        const target = event.target instanceof Element ? event.target : null;
        root.classList.toggle('cursor-hover', !!target?.closest('a,button,[role=button],input,select,textarea,label,summary,[data-cursor=hover]'));
        root.classList.toggle('cursor-light', !!target?.closest('[data-cursor=light],.bg-primary,.bg-primary-20,.bg-ink,.bg-charcoal'));
        if (!frame) frame = requestAnimationFrame(tick);
      };
      const hide = () => { active = false; root.classList.remove('cursor-visible'); cancelAnimationFrame(frame); frame = 0; last = 0; };
      const tick = (time: number) => {
        frame = 0;
        const blocked = document.documentElement.classList.contains('cd-intro');
        root.classList.toggle('cursor-visible', active && !blocked);
        if (!active || blocked) { last = 0; return; }
        const dt = last ? Math.min(64, time - last) : 16.667; last = time;
        points.forEach((point, index) => {
          const k = 1 - Math.pow(1 - [0.35, 0.16, 0.09][index], dt / 16.667);
          point.x += (x - point.x) * k; point.y += (y - point.y) * k;
          dots[index].style.transform = `translate3d(${point.x}px,${point.y}px,0)`;
        });
        frame = requestAnimationFrame(tick);
      };
      window.addEventListener('pointermove', move, { passive: true });
      document.addEventListener('mouseleave', hide);
      window.addEventListener('blur', hide);
      window.addEventListener('cd:intro-iris', hide);
      dispose = () => { hide(); window.removeEventListener('pointermove', move); document.removeEventListener('mouseleave', hide); window.removeEventListener('blur', hide); window.removeEventListener('cd:intro-iris', hide); };
    };
    setup(); query.addEventListener('change', setup);
    return () => { dispose(); query.removeEventListener('change', setup); };
  }, [pathname]);
  return <div ref={host} className="cursor-trail" aria-hidden="true"><span><i /></span><span><i /></span><span><i /></span></div>;
}