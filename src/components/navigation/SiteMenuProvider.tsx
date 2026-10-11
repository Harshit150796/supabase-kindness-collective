import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { SiteMenuContext } from './menuContext';
import { SiteMenu } from './SiteMenu';

type Phase = 'closed' | 'open' | 'closing';

/** Matches the exit timing in index.css (content fades, then the rings close). */
export const MENU_CLOSE_MS = 820;

/**
 * Radix menus and dialogs set `pointer-events: none` on <body> while open. When one is
 * unmounted mid-animation (a navigation, a re-render), that style can survive and leave
 * every button on the page dead. Clear it whenever nothing modal is actually open.
 */
function unstickPointerEvents() {
  window.setTimeout(() => {
    const body = document.body;
    if (body.style.pointerEvents !== 'none') return;
    if (document.querySelector('[role="dialog"][data-state="open"],[role="alertdialog"][data-state="open"],[role="menu"][data-state="open"]')) return;
    body.style.pointerEvents = '';
  }, 400);
}

/**
 * One full-screen menu for the whole site. Any page can open it with useSiteMenu()
 * or a <MenuButton/>; it survives navigation, closes on every route change and
 * returns focus to the button that opened it.
 */
export function SiteMenuProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('closed');
  const phaseRef = useRef<Phase>('closed');
  phaseRef.current = phase;
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const unread = useUnreadMessages();
  const location = useLocation();

  const open = useCallback((from?: HTMLElement | null) => {
    if (phaseRef.current === 'open') return;
    triggerRef.current = from ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const rect = from?.getBoundingClientRect();
    // The rings open from the button that was pressed (top right when opened from code).
    setOrigin(rect && rect.width ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: window.innerWidth - 48, y: 36 });
    setPhase('open');
  }, []);

  const close = useCallback(() => setPhase((current) => (current === 'open' ? 'closing' : current)), []);

  const toggle = useCallback((from?: HTMLElement | null) => {
    if (phaseRef.current === 'open') close();
    else open(from);
  }, [open, close]);

  useEffect(() => {
    if (phase !== 'closing') return;
    const timer = window.setTimeout(() => setPhase('closed'), MENU_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // A new page closes the menu: a link inside it, or back/forward.
  const routeKey = `${location.pathname}${location.search}`;
  const firstRoute = useRef(true);
  useEffect(() => {
    if (firstRoute.current) { firstRoute.current = false; return; }
    close();
    unstickPointerEvents();
  }, [routeKey, close]);

  // Focus goes back to the button that opened the menu, when it is still on the page.
  const previous = useRef<Phase>('closed');
  useEffect(() => {
    if (previous.current !== 'closed' && phase === 'closed') {
      const trigger = triggerRef.current;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      unstickPointerEvents();
    }
    previous.current = phase;
  }, [phase]);

  const value = useMemo(
    () => ({ isOpen: phase === 'open', open, close, toggle, unread }),
    [phase, open, close, toggle, unread],
  );

  return (
    <SiteMenuContext.Provider value={value}>
      {children}
      {phase !== 'closed' && <SiteMenu phase={phase} origin={origin} onClose={close} unread={unread} />}
    </SiteMenuContext.Provider>
  );
}
