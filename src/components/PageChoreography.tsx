import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { observeEarly } from '@/lib/earlyObserver';

const pages = new Set(['/', '/about', '/how-it-works', '/stories', '/partners', '/faq', '/blog']);

/** Split painted lines after font settlement; retain each heading's accessible sentence. */
export function PageChoreography() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pages.has(pathname) && !pathname.startsWith('/blog/')) return;
    let active = true, timer = 0, frame = 0;
    const pending = new Map<HTMLElement, () => void>();
    const saved = new Map<HTMLElement, { html: string; label: string | null; stop: () => void }>();
    const split = (heading: HTMLElement) => {
      if (saved.has(heading) || (!heading.classList.contains('font-display') && !heading.classList.contains('font-about-serif')) || heading.classList.contains('sr-only') || heading.getBoundingClientRect().width === 0) return;
      // Preserve formatted inline words, but never replace controls or artwork.
      if (heading.querySelector('a,button,svg,img')) return;
      const text = heading.textContent ?? '';
      if (!heading.firstChild || !text.trim()) return;
      const range = document.createRange();
      const lines: Range[] = [];
      let lastTop = -Infinity;
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        for (const match of (node.textContent ?? '').matchAll(/\S+/g)) {
          range.setStart(node, match.index ?? 0); range.setEnd(node, (match.index ?? 0) + match[0].length);
          const top = Math.round(range.getBoundingClientRect().top);
          if (top > lastTop + 3) { lines.push(range.cloneRange()); lastTop = top; }
          else lines[lines.length - 1].setEnd(node, (match.index ?? 0) + match[0].length);
        }
      }
      const html = heading.innerHTML, label = heading.getAttribute('aria-label');
      heading.setAttribute('aria-label', text.trim()); heading.dataset.lineReveal = 'true';
      const fragment = document.createDocumentFragment();
      lines.forEach((line, index) => {
        const mask = document.createElement('span'), content = document.createElement('span');
        mask.className = 'heading-line-mask'; mask.setAttribute('aria-hidden', 'true');
        content.className = 'heading-line'; content.append(line.cloneContents());
        content.style.transitionDelay = `${index * .08}s`; mask.append(content); fragment.append(mask);
      });
      heading.replaceChildren(fragment);
      const stop = observeEarly(heading, () => heading.classList.add('lines-revealed'));
      saved.set(heading, { html, label, stop });
    };
    const scan = () => {
      frame = 0;
      if (!active) return;
      document.querySelectorAll<HTMLElement>('main h1,main h2').forEach(heading => {
        if (saved.has(heading) || pending.has(heading)) return;
        if (heading.getBoundingClientRect().width) split(heading);
        else pending.set(heading, observeEarly(heading, () => { pending.delete(heading); split(heading); }));
      });
      document.querySelectorAll<HTMLElement>('main .bg-primary,main .bg-primary-20,main .bg-ink').forEach(node => { node.dataset.cursor = 'light'; });
    };
    const schedule = () => { if (!frame && active) frame = requestAnimationFrame(scan); };
    const mutations = new MutationObserver(schedule);
    const start = () => {
      // Avoid heading measurement during the tree's opening GPU frames.
      window.clearTimeout(timer);
      document.fonts.ready.then(() => { if (!active) return; schedule(); mutations.observe(document.querySelector('main') ?? document.body, { childList: true, subtree: true }); });
    };
    if (pathname !== '/' || window.__cdTreeReady) timer = window.setTimeout(start, 120);
    else { window.addEventListener('cd:tree-ready', start, { once: true }); timer = window.setTimeout(start, 4200); }
    const resize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        mutations.disconnect();
        pending.forEach(stop => stop()); pending.clear();
        saved.forEach((value, node) => { value.stop(); node.innerHTML = value.html; node.removeAttribute('data-line-reveal'); if (value.label === null) node.removeAttribute('aria-label'); else node.setAttribute('aria-label', value.label); });
        saved.clear(); start();
      }, 180);
    };
    window.addEventListener('resize', resize);
    return () => {
      active = false; mutations.disconnect(); cancelAnimationFrame(frame); clearTimeout(timer);
      pending.forEach(stop => stop());
      window.removeEventListener('resize', resize); window.removeEventListener('cd:tree-ready', start);
      saved.forEach((value, node) => { value.stop(); node.innerHTML = value.html; node.removeAttribute('data-line-reveal'); if (value.label === null) node.removeAttribute('aria-label'); else node.setAttribute('aria-label', value.label); });
    };
  }, [pathname]);
  return null;
}