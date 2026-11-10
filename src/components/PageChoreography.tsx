import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { observeEarly } from '@/lib/earlyObserver';

const pages = new Set(['/', '/about', '/how-it-works', '/stories', '/partners', '/faq', '/blog']);
// Longest a heading waits for its web fonts before it is split with what is on screen.
const FONT_WAIT_MS = 1000;

/** The web-font faces a heading uses (an italic run loads its own file); fallbacks aside. */
const facesOf = (heading: HTMLElement) => {
  const faces = new Set<string>();
  for (const element of [heading, ...heading.querySelectorAll<HTMLElement>('*')]) {
    const style = getComputedStyle(element);
    faces.add(`${style.fontStyle} ${style.fontWeight} 16px ${style.fontFamily.split(',')[0]}`);
  }
  return [...faces];
};
const facesReady = (faces: string[], text: string) => {
  try { return faces.every(face => document.fonts.check(face, text)); } catch { return true; }
};
/** One line's text, still inside the inline elements it started in (italic, colour). */
const cloneLine = (line: Range, heading: HTMLElement) => {
  let copy: Node = line.cloneContents();
  for (let node: Node | null = line.commonAncestorContainer; node && node !== heading; node = node.parentNode) {
    if (!(node instanceof Element)) continue;
    const shell = node.cloneNode(false) as Element;
    shell.removeAttribute('id'); shell.append(copy); copy = shell;
  }
  return copy;
};

/** Keep React's text nodes intact; only the decorative painted copy is disposable. */
export function PageChoreography() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pages.has(pathname) && !pathname.startsWith('/blog/')) return;
    let active = true, timer = 0, frame = 0;
    const saved = new Map<HTMLElement, { overlay: HTMLElement; stop: () => void }>();
    const pending = new Map<HTMLElement, () => void>();
    const waiting = new Set<HTMLElement>();
    const clear = (heading: HTMLElement) => {
      const value = saved.get(heading);
      value?.stop(); value?.overlay.remove(); saved.delete(heading);
      heading.classList.remove('line-reveal-host', 'line-reveal-active');
    };
    const eligible = (heading: HTMLElement) => !saved.has(heading) && !heading.classList.contains('sr-only') && !!heading.getBoundingClientRect().width
      && (heading.classList.contains('font-display') || heading.classList.contains('font-about-serif')) && !heading.querySelector('a,button,svg,img');
    const split = (heading: HTMLElement) => {
      if (!eligible(heading)) return;
      const style = getComputedStyle(heading);
      const lineHeight = parseFloat(style.lineHeight);
      // A word starts a new line once it sits half a line lower. Faces differ by a few
      // pixels in where their glyphs sit, and a fixed 3px read an italic run as a new line.
      const step = (Number.isFinite(lineHeight) ? lineHeight : parseFloat(style.fontSize) * 1.2) / 2;
      if (!Number.isFinite(step)) return;
      const range = document.createRange();
      const lines: Range[] = [];
      let lineTop = 0;
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        for (const match of (node.textContent ?? '').matchAll(/\S+/g)) {
          const index = match.index ?? 0;
          range.setStart(node, index); range.setEnd(node, index + match[0].length);
          const y = range.getBoundingClientRect().top;
          if (!lines.length || y > lineTop + step) { lines.push(range.cloneRange()); lineTop = y; }
          else lines[lines.length - 1].setEnd(node, index + match[0].length);
        }
      }
      if (!lines.length) return;
      const overlay = document.createElement('span');
      overlay.className = 'heading-line-overlay'; overlay.setAttribute('aria-hidden', 'true');
      // The painted lines stack in normal flow inside the heading's own box. Each holds
      // exactly one original line, so it is exactly as tall and lands on the same spot
      // whatever the fonts' metrics; measured offsets drifted when faces differed.
      overlay.style.padding = style.padding;
      lines.forEach((line, index) => {
        const mask = document.createElement('span'), content = document.createElement('span');
        mask.className = 'heading-line-mask';
        content.className = 'heading-line'; content.append(cloneLine(line, heading));
        content.style.transitionDelay = `${index * .08}s`;
        mask.append(content); overlay.append(mask);
      });
      // Original glyphs remain in layout and in the accessibility tree.
      heading.classList.add('line-reveal-host', 'line-reveal-active');
      heading.append(overlay);
      const stop = observeEarly(heading, () => overlay.classList.add('lines-revealed'));
      saved.set(heading, { overlay, stop });
    };
    // Split once the heading's own faces have arrived. Measured in a fallback face, the
    // About heading's italic "black box." landed on top of "be a".
    const prepare = (heading: HTMLElement) => {
      if (waiting.has(heading) || !eligible(heading)) return;
      const faces = facesOf(heading), text = heading.textContent ?? '';
      if (!document.fonts || facesReady(faces, text)) { split(heading); return; }
      waiting.add(heading);
      heading.classList.add('line-reveal-active'); // hidden meanwhile, so it never shows and then vanishes
      const loads = Promise.all(faces.map(face => document.fonts.load(face, text).catch(() => [])));
      void Promise.race([loads, new Promise(resolve => window.setTimeout(resolve, FONT_WAIT_MS))]).then(() => {
        if (!waiting.delete(heading)) return;
        if (active && heading.isConnected) split(heading);
        if (!saved.has(heading)) heading.classList.remove('line-reveal-active');
      });
    };
    const scan = () => {
      frame = 0;
      if (!active) return;
      saved.forEach((value, heading) => { if (!heading.isConnected || !value.overlay.isConnected) clear(heading); });
      document.querySelectorAll<HTMLElement>('main h1,main h2').forEach(heading => {
        if (saved.has(heading) || pending.has(heading) || waiting.has(heading)) return;
        if (heading.getBoundingClientRect().width) prepare(heading);
        else pending.set(heading, observeEarly(heading, () => { pending.delete(heading); prepare(heading); }));
      });
      document.querySelectorAll<HTMLElement>('main .bg-primary,main .bg-primary-20,main .bg-ink').forEach(node => { node.dataset.cursor = 'light'; });
    };
    const schedule = () => { if (!frame && active) frame = requestAnimationFrame(scan); };
    const mutations = new MutationObserver(records => {
      let changed = false;
      records.forEach(record => {
        const target = record.target instanceof Element ? record.target : record.target.parentElement;
        if (target?.closest('.heading-line-overlay')) return;
        // Ignore our overlay insertion/removal; react text updates must invalidate the painted copy.
        if (record.type === 'childList' && [...record.addedNodes, ...record.removedNodes].every(node => node instanceof Element && node.classList.contains('heading-line-overlay'))) return;
        const heading = target?.closest<HTMLElement>('h1,h2');
        if (heading && saved.has(heading)) clear(heading);
        changed = true;
      });
      if (changed) schedule();
    });
    const start = () => {
      window.clearTimeout(timer);
      document.fonts.ready.then(() => {
        if (!active) return;
        schedule(); mutations.observe(document.querySelector('main') ?? document.body, { childList: true, characterData: true, subtree: true });
      });
    };
    if (pathname !== '/' || window.__cdTreeReady) timer = window.setTimeout(start, 120);
    else { window.addEventListener('cd:tree-ready', start, { once: true }); timer = window.setTimeout(start, 4200); }
    const resize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        mutations.disconnect(); pending.forEach(stop => stop()); pending.clear();
        [...saved.keys()].forEach(clear); start();
      }, 180);
    };
    window.addEventListener('resize', resize);
    return () => {
      active = false; mutations.disconnect(); cancelAnimationFrame(frame); clearTimeout(timer);
      pending.forEach(stop => stop()); [...saved.keys()].forEach(clear);
      waiting.forEach(heading => heading.classList.remove('line-reveal-active')); waiting.clear();
      window.removeEventListener('resize', resize); window.removeEventListener('cd:tree-ready', start);
    };
  }, [pathname]);
  return null;
}
