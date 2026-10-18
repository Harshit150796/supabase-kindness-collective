import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AccountMenu } from '@/components/navigation/AccountMenu';
import { BrandLockup } from '@/components/navigation/BrandLockup';
import { MenuButton } from '@/components/navigation/MenuButton';
import { useSiteMenu } from '@/components/navigation/menuContext';
import { signInHref } from '@/components/navigation/siteLinks';
import { SkySwitch } from '@/components/navigation/SkySwitch';

const quietLink = 'nav-quiet-link';
const DONATE = 'Donate'.split('');

/**
 * The site header (founder-chosen "two words + sky switch"): the full brand on the left; the sky
 * switch (homepage), Sign in or the account, and two serif words, Donate and Menu, on the right.
 * At the top of the homepage it sits on the hero's own sky in light ink (night) or dark ink (day);
 * once the page moves it becomes a frosted light bar. Every page renders it; the menu itself lives
 * once at app level (SiteMenuProvider), so it works the same on every page and size.
 */
export function Navbar({ autoHide = true }: { autoHide?: boolean } = {}) {
  const { user, loading } = useAuth();
  const { isOpen: menuOpen } = useSiteMenu();
  const { pathname, search } = useLocation();
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    let last = window.scrollY, frame = 0;
    // An observer reports when the hero has scrolled past the top. Reading its box on
    // every scroll frame forced a layout while the page's scroll animations ran.
    let hero: HTMLElement | null = null, heroPassed = false;
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      heroPassed = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
    });
    const watchHero = () => {
      if (hero?.isConnected) return;
      if (hero) observer?.unobserve(hero);
      hero = document.querySelector<HTMLElement>('.hero-stage');
      heroPassed = false;
      if (hero) observer?.observe(hero);
    };
    const update = () => {
      frame = 0;
      watchHero();
      const y = window.scrollY;
      setAtTop(y <= 8);
      const afterHero = !hero || (observer ? heroPassed : hero.getBoundingClientRect().bottom <= 0);
      const open = menuOpen || !!navRef.current?.querySelector('[data-state="open"]');
      if (y <= 100 || open || !afterHero || y < last) setHidden(false);
      else if (y > last + 2) setHidden(true);
      last = y;
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    setHidden(false);
    setAtTop(window.scrollY <= 8);
    // Account pages keep the header in place; their section row sits right under it.
    if (!autoHide) return () => observer?.disconnect();
    watchHero();
    update();
    addEventListener('scroll', scroll, { passive: true });
    return () => { removeEventListener('scroll', scroll); cancelAnimationFrame(frame); observer?.disconnect(); };
  }, [menuOpen, autoHide]);

  const onAuthPage = pathname === '/auth' || pathname === '/reset-password';
  const onHome = pathname === '/';
  const overSky = onHome && atTop && !menuOpen;

  return (
    <nav ref={navRef} data-site-header data-over-sky={overSky || undefined} aria-label="Main" className={`site-header sticky top-0 z-50 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 py-3 lg:h-[4.5rem] [@media(max-height:500px)]:h-[52px] [@media(max-height:500px)]:py-1">
          <BrandLockup navBrand />

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
            {onHome && <SkySwitch />}
            {!loading && (user
              ? <AccountMenu className="hidden md:inline-flex" />
              : !onAuthPage && <Link to={signInHref(pathname, search)} className={`hidden md:inline-flex ${quietLink}`}>Sign in</Link>)}
            <Link to="/donate" className="nav-word hidden sm:inline-flex" aria-label="Donate">
              <span aria-hidden="true" className="nav-word-letters">{DONATE.map((letter, i) => <span key={i} style={{ animationDelay: `${0.36 + i * 0.04}s` }}>{letter}</span>)}</span>
              <span aria-hidden="true" className="nav-word-line" />
            </Link>
            <MenuButton className="nav-menu-word" />
          </div>
        </div>
      </div>
    </nav>
  );
}
