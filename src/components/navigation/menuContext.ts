import { createContext, useContext } from 'react';

export interface SiteMenuContextValue {
  isOpen: boolean;
  open: (from?: HTMLElement | null) => void;
  close: () => void;
  toggle: (from?: HTMLElement | null) => void;
  /** Unread conversations for the signed-in person (one subscription for the whole app). */
  unread: number;
}

const noop = () => undefined;
export const SiteMenuContext = createContext<SiteMenuContextValue>({ isOpen: false, open: noop, close: noop, toggle: noop, unread: 0 });

export const useSiteMenu = () => useContext(SiteMenuContext);
