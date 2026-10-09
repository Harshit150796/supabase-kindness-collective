import { useEffect } from 'react';
import { addAfterEffect, useThree } from '@react-three/fiber';
import { CURSOR_QUERY, CURSOR_SAMPLE_INTERVAL } from '@/lib/cursorBackground';
// Lazy-tree-only, read-only: never render, invalidate or change a context setting.
export function CursorPixelProbe() {
  const renderer = useThree(state => state.gl);
  useEffect(() => {
    const query = matchMedia(CURSOR_QUERY), canvas = renderer.domElement, gl = renderer.getContext();
    const pixel = new Uint8Array(4);
    let x = -1, y = -1, last = -Infinity;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const events = event.getCoalescedEvents?.();
      const point = events?.[events.length - 1] ?? event;
      x = point.clientX; y = point.clientY;
    };
    window.addEventListener('pointermove', move, { passive: true });
    const unsubscribe = addAfterEffect(() => {
      if (!query.matches || !document.documentElement.classList.contains('cd-cursor-active') || document.hidden) return;
      const now = performance.now();
      if (now - last < CURSOR_SAMPLE_INTERVAL || document.elementFromPoint(x, y) !== canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height || gl.isContextLost() || gl.getParameter(gl.FRAMEBUFFER_BINDING) !== null) return;
      last = now;
      const px = Math.max(0, Math.min(gl.drawingBufferWidth - 1, Math.floor((x - rect.left) * gl.drawingBufferWidth / rect.width)));
      const py = Math.max(0, Math.min(gl.drawingBufferHeight - 1, gl.drawingBufferHeight - 1 - Math.floor((y - rect.top) * gl.drawingBufferHeight / rect.height)));
      gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      if (pixel[3] === 0) return;
      window.dispatchEvent(new CustomEvent('cd:cursor-bg', { detail: { r: pixel[0], g: pixel[1], b: pixel[2], x, y } }));
    });
    return () => { unsubscribe(); window.removeEventListener('pointermove', move); };
  }, [renderer]);
  return null;
}
