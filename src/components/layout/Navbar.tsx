import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AccountMenu } from '@/components/navigation/AccountMenu';
import { BrandLockup } from '@/components/navigation/BrandLockup';
import { MenuButton } from '@/components/navigation/MenuButton';
import { useSiteMenu } from '@/components/navigation/menuContext';
import { signInHref } from '@/components/navigation/siteLinks';

const quietLink = 'nav-quiet-link';

/**
 * The site header: brand, the two main actions, the account, and the Menu button
 * that opens the full-screen menu. Every page renders it; the menu itself lives once
 * at app level (SiteMenuProvider), so it works the same on every page and size.
 */
export function Navbar({ autoHide = true }: { autoHide?: boolean } = {}) {
  const { user, loading } = useAuth();
  const { isOpen: menuOpen } = useSiteMenu();
  const { pathname, search } = useLocation();
  const [hidden, setHidden] = useState(false);
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
      const afterHero = !hero || (observer ? heroPassed : hero.getBoundingClientRect().bottom <= 0);
      const open = menuOpen || !!navRef.current?.querySelector('[data-state="open"]');
      if (y <= 100 || open || !afterHero || y < last) setHidden(false);
      else if (y > last + 2) setHidden(true);
      last = y;
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    setHidden(false);
    // Account pages keep the header in place; their section row sits right under it.
    if (!autoHide) return () => observer?.disconnect();
    watchHero();
    addEventListener('scroll', scroll, { passive: true });
    return () => { removeEventListener('scroll', scroll); cancelAnimationFrame(frame); observer?.disconnect(); };
  }, [menuOpen, autoHide]);

  const onAuthPage = pathname === '/auth' || pathname === '/reset-password';

  return (
    <nav ref={navRef} data-site-header aria-label="Main" className={`sticky top-0 z-50 border-b border-border/70 bg-background lg:bg-background/90 lg:backdrop-blur-lg transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-3 py-3 [@media(max-height:500px)]:h-[52px] [@media(max-height:500px)]:py-1">
          <BrandLockup navBrand />

          <div className="flex items-center gap-1.5">
            <Link to="/apply" className={`hidden lg:inline-flex ${quietLink}`}>Start a fundraiser</Link>
            {!loading && (user
              ? <AccountMenu className="hidden md:inline-flex" />
              : !onAuthPage && <Link to={signInHref(pathname, search)} className={`hidden md:inline-flex ${quietLink}`}>Sign in</Link>)}
            <span aria-hidden="true" className="nav-divider hidden md:block" />
            <MenuButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
