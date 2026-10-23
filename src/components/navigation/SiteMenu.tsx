import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type UIEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSignOut } from '@/hooks/useSignOut';
import { MenuButton } from './MenuButton';
import { LEGAL_LINKS, PRIMARY_LINKS, SECONDARY_LINKS, SUPPORT_EMAIL, accountLinksFor, displayName, isActivePath, signInHref, signUpHref } from './siteLinks';

interface SiteMenuProps {
  phase: 'open' | 'closing';
  /** Centre of the button that opened the menu; the green sheet grows from here. */
  origin: { x: number; y: number };
  onClose: () => void;
  unread: number;
}

/** Circle centre and the radius that reaches the farthest corner of the screen. */
function circleFrom({ x, y }: { x: number; y: number }) {
  const w = window.innerWidth, h = Math.max(window.innerHeight, document.documentElement.clientHeight);
  return { x, y, r: Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y))) + 8 };
}

/**
 * The full-screen menu, "two hands" like the logo: a logo-green sheet sweeps in from the
 * Menu button and carries the whole menu, and a logo-blue hand rises from the opposite
 * corner holding the account. Everything lives on the sheet, so nothing can show before
 * the sheet has covered it, however slowly a phone draws. Closing runs the other way,
 * into the Close button.
 */
export function SiteMenu({ phase, origin, onClose, unread }: SiteMenuProps) {
  const auth = useAuth();
  // While closing, keep showing the account as it was: signing out from here must not
  // swap the panel to "Sign in" in the middle of the exit.
  const shownAuth = useRef(auth);
  if (phase === 'open') shownAuth.current = auth;
  const { user, roles, loading } = shownAuth.current;
  const signOut = useSignOut();
  const { pathname, search } = useLocation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [circle, setCircle] = useState(() => circleFrom(origin));
  const [shown, setShown] = useState(false);
  // Once open, the sheet drops its clip so it covers the screen through any resize.
  const [settled, setSettled] = useState(false);

  // Mount closed, then open on the next frame so the transitions run.
  useEffect(() => {
    if (phase !== 'open') return;
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setShown(true)); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [phase]);

  // Re-opened while closing: grow from the button pressed this time.
  useLayoutEffect(() => {
    if (phase !== 'open') return;
    setCircle((current) => {
      const next = circleFrom(origin);
      return next.x === current.x && next.y === current.y && next.r === current.r ? current : next;
    });
  }, [phase, origin]);

  // Fallback for the sheet's transitionend (a busy phone can drop it).
  useEffect(() => {
    if (!shown || phase !== 'open') return;
    const timer = window.setTimeout(() => setSettled(true), 1200);
    return () => window.clearTimeout(timer);
  }, [shown, phase]);

  // Closing: aim at the Close button as it is now (the window may have been resized),
  // put the sheet's full circle back, then shrink everything on the next frame.
  useLayoutEffect(() => {
    if (phase !== 'closing') return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect?.width) setCircle(circleFrom({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }));
    setSettled(false);
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setShown(false)); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [phase]);

  // While open: the page behind is inert (no focus, clicks or screen-reader reading),
  // it does not scroll, and Escape closes the menu.
  useEffect(() => {
    const root = document.getElementById('root');
    const html = document.documentElement;
    const gap = window.innerWidth - html.clientWidth;
    root?.setAttribute('inert', '');
    if (gap > 0) html.style.setProperty('--site-menu-gap', `${gap}px`);
    html.classList.add('site-menu-open');
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    };
    document.addEventListener('keydown', onKey);
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      root?.removeAttribute('inert');
      html.classList.remove('site-menu-open');
      html.style.removeProperty('--site-menu-gap');
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // The bar stays on top while the menu scrolls; a hairline appears once content passes under it.
  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrolled = event.currentTarget.scrollTop > 2;
    if ((dialogRef.current?.dataset.scrolled === 'true') !== scrolled) dialogRef.current?.setAttribute('data-scrolled', String(scrolled));
  };

  const here = (to: string) => (isActivePath(pathname, to) ? 'page' as const : undefined);
  const name = displayName(user);
  const accountLinks = accountLinksFor(roles);
  const style = { '--ox': `${circle.x}px`, '--oy': `${circle.y}px`, '--r': `${circle.r}px` } as CSSProperties;

  return createPortal(
    <div
      id="site-menu"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      tabIndex={-1}
      data-phase={phase}
      data-cursor="light"
      className={`site-menu${shown ? ' is-open' : ''}${settled ? ' is-settled' : ''}`}
      style={style}
    >
      <div
        className="site-menu-sheet"
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && event.propertyName.endsWith('clip-path') && shown && phase === 'open') setSettled(true);
        }}
      >
        <div className="site-menu-scroll" onScroll={onScroll}>
          <div className="site-menu-bar">
            <div className="container mx-auto flex h-18 items-center justify-between gap-3 px-4 py-3 [@media(max-height:500px)]:h-[52px] [@media(max-height:500px)]:py-1">
              <Link to="/" onClick={onClose} className="site-menu-wordmark">Coupon<span>Donation</span></Link>
              <MenuButton ref={buttonRef} expanded={shown} onClick={onClose} />
            </div>
          </div>

          <div className="site-menu-main">
            <div className="site-menu-frame container mx-auto px-4">
              <nav aria-label="Site" className="site-menu-nav">
                <ul className="site-menu-primary">
                  {PRIMARY_LINKS.map((link, index) => (
                    <li key={link.to} className="site-menu-mask">
                      <Link to={link.to} onClick={onClose} aria-current={here(link.to)} className="site-menu-link" style={{ '--i': index } as CSSProperties}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <ul className="site-menu-secondary site-menu-fade">
                  {SECONDARY_LINKS.map((link) => (
                    <li key={link.to}>
                      {link.external
                        ? <a href={link.to} className="site-menu-minor">{link.label}</a>
                        : <Link to={link.to} onClick={onClose} aria-current={here(link.to)} className="site-menu-minor">{link.label}</Link>}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <section aria-label="Your account" className={`site-menu-hand${user ? ' is-account' : ''}`}>
              <div className="site-menu-hand-body container mx-auto px-4">
                <div className="site-menu-hand-content">
                  {loading ? (
                    <div className="h-40" aria-hidden="true" />
                  ) : user ? (
                    <>
                      <div className="flex items-center gap-4">
                        <span aria-hidden="true" className="site-menu-avatar">{name.charAt(0).toUpperCase()}</span>
                        <div className="min-w-0">
                          <p className="truncate font-display text-[1.625rem] leading-tight sm:text-[1.75rem]">{name}</p>
                          {user.email && <p className="truncate text-sm text-white/80">{user.email}</p>}
                        </div>
                      </div>
                      <ul className="site-menu-account-links">
                        {accountLinks.map((link) => (
                          <li key={link.to}>
                            <Link to={link.to} onClick={onClose} aria-current={here(link.to)} className="site-menu-account-link">
                              <link.icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
                              <span className="min-w-0 flex-1 truncate">{link.label}</span>
                              {link.unread && unread > 0 && <span className="text-[0.8125rem] font-semibold tabular-nums">{unread}<span className="max-sm:sr-only"> new</span></span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <button type="button" onClick={() => { onClose(); void signOut(); }} className="site-menu-signout">
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="site-menu-hand-title">See where your giving goes.</p>
                      <p className="site-menu-hand-text">Sign in to follow every coupon your donations become, or to run your fundraiser.</p>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link to={signInHref(pathname, search)} onClick={onClose} className="site-menu-cta">Sign in</Link>
                        <Link to={signUpHref(pathname, search)} onClick={onClose} className="site-menu-cta site-menu-cta-ghost">Create account</Link>
                      </div>
                    </>
                  )}
                  <div className="site-menu-legal">
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="site-menu-minor site-menu-legal-email">{SUPPORT_EMAIL}</a>
                    <ul className="flex flex-wrap gap-x-5">
                      {LEGAL_LINKS.map((link) => (
                        <li key={link.to}>
                          <Link to={link.to} onClick={onClose} aria-current={here(link.to)} className="site-menu-minor">{link.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
