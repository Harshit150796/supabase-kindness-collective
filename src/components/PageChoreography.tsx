import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { observeEarly } from '@/lib/earlyObserver';

const pages = new Set(['/', '/about', '/how-it-works', '/stories', '/partners', '/faq', '/blog']);

/** Keep React's text nodes intact; only the decorative painted copy is disposable. */
export function PageChoreography() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pages.has(pathname) && !pathname.startsWith('/blog/')) return;
    let active = true, timer = 0, frame = 0;
    const saved = new Map<HTMLElement, { overlay: HTMLElement; stop: () => void }>();
    const pending = new Map<HTMLElement, () => void>();
    const clear = (heading: HTMLElement) => {
      const value = saved.get(heading);
      value?.stop(); value?.overlay.remove(); saved.delete(heading);
      heading.classList.remove('line-reveal-host', 'line-reveal-active');
    };
    const split = (heading: HTMLElement) => {
      if (saved.has(heading) || heading.classList.contains('sr-only') || !heading.getBoundingClientRect().width) return;
      if ((!heading.classList.contains('font-display') && !heading.classList.contains('font-about-serif')) || heading.querySelector('a,button,svg,img')) return;
      const range = document.createRange();
      const lines: { range: Range; top: number }[] = [];
      const top = heading.getBoundingClientRect().top;
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        for (const match of (node.textContent ?? '').matchAll(/\S+/g)) {
          const index = match.index ?? 0;
          range.setStart(node, index); range.setEnd(node, index + match[0].length);
          const y = range.getBoundingClientRect().top;
          const previous = lines[lines.length - 1];
          if (!previous || y > previous.top + 3) lines.push({ range: range.cloneRange(), top: y });
          else previous.range.setEnd(node, index + match[0].length);
        }
      }
      if (!lines.length) return;
      const overlay = document.createElement('span');
      overlay.className = 'heading-line-overlay'; overlay.setAttribute('aria-hidden', 'true');
      const lineHeight = parseFloat(getComputedStyle(heading).lineHeight);
      // Text glyph boxes sit inside their line boxes; anchor masks to the original line grid.
      const first = lines[0].top;
      lines.forEach((line, index) => {
        const mask = document.createElement('span'), content = document.createElement('span');
        mask.className = 'heading-line-mask'; mask.style.top = `${line.top - first}px`;
        content.className = 'heading-line'; content.append(line.range.cloneContents());
        content.style.transitionDelay = `${index * .08}s`;
        mask.append(content); overlay.append(mask);
      });
      // Original glyphs remain in layout and in the accessibility tree.
      if (!Number.isFinite(lineHeight) || !Number.isFinite(top)) return;
      heading.classList.add('line-reveal-host', 'line-reveal-active');
      heading.append(overlay);
      const stop = observeEarly(heading, () => overlay.classList.add('lines-revealed'));
      saved.set(heading, { overlay, stop });
    };
    const scan = () => {
      frame = 0;
      if (!active) return;
      saved.forEach((value, heading) => { if (!heading.isConnected || !value.overlay.isConnected) clear(heading); });
      document.querySelectorAll<HTMLElement>('main h1,main h2').forEach(heading => {
        if (saved.has(heading) || pending.has(heading)) return;
        if (heading.getBoundingClientRect().width) split(heading);
        else pending.set(heading, observeEarly(heading, () => { pending.delete(heading); split(heading); }));
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
      window.removeEventListener('resize', resize); window.removeEventListener('cd:tree-ready', start);
    };
  }, [pathname]);
  return null;
}
