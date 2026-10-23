import { useSyncExternalStore } from 'react';

/**
 * The hero's sky (night or blue day) lives on <html data-sky>. The opening script picks it once
 * per load; the header's sky switch and a tap on the live sky both flip it here, and everything
 * that follows the sky (the live tree, HeroBackdrop, header and hero colours) watches that attribute.
 */
export type Sky = 'night' | 'day';

export function getSky(): Sky {
  if (typeof document === 'undefined') return 'night';
  return document.documentElement.dataset.sky === 'day' ? 'day' : 'night';
}

export function setSky(next: Sky) {
  if (typeof document === 'undefined' || getSky() === next) return;
  document.documentElement.dataset.sky = next;
}

export function toggleSky() {
  setSky(getSky() === 'day' ? 'night' : 'day');
}

/** Calls back whenever <html data-sky> changes, whoever changed it. */
export function subscribeSky(onChange: () => void) {
  if (typeof MutationObserver === 'undefined') return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-sky'] });
  return () => observer.disconnect();
}

export function useSky(): Sky {
  return useSyncExternalStore(subscribeSky, getSky, () => 'night');
}
