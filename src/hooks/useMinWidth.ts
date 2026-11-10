import { useSyncExternalStore } from 'react';

/**
 * True while the window is at least `px` wide. Sections that have a laptop and a phone version render
 * only the one in use, so the other's words aren't in the page twice for search engines and screen
 * readers (Duck.Design audit, Nov 2026).
 */
export function useMinWidth(px: number): boolean {
  const query = `(min-width: ${px}px)`;
  return useSyncExternalStore(
    (change) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', change);
      return () => media.removeEventListener('change', change);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
