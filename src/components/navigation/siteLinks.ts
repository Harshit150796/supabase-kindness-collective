import type { LucideIcon } from 'lucide-react';
import { BadgeCheck, CreditCard, HandCoins, Heart, LayoutGrid, Megaphone, MessageCircle, Settings, ShieldCheck, UserRound, Wallet } from 'lucide-react';

/**
 * Every navigation item on the site lives here: the header, the full-screen menu,
 * the account dropdown and the dashboard sidebar all read these lists, so a page
 * is added, renamed or removed in one place.
 */
export interface SiteLink {
  label: string;
  to: string;
  /** mailto:/tel:/https: links open outside the app. */
  external?: boolean;
}

export interface AccountLink extends SiteLink {
  icon: LucideIcon;
  /** Shown only to the operations team (admin, staff, viewer). */
  team?: boolean;
  /** Shows the unread-messages count. */
  unread?: boolean;
}

export const SUPPORT_EMAIL = 'support@coupondonation.com';

/** The five destinations set large in the menu. */
export const PRIMARY_LINKS: SiteLink[] = [
  { label: 'Donate', to: '/donate' },
  { label: 'Start a fundraiser', to: '/apply' },
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Stories', to: '/stories' },
  { label: 'About us', to: '/about' },
];

export const SECONDARY_LINKS: SiteLink[] = [
  { label: 'Donate a coupon', to: '/donate-a-card' },
  { label: 'Partners', to: '/partners' },
  { label: 'Blog', to: '/blog' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: `mailto:${SUPPORT_EMAIL}`, external: true },
];

export const LEGAL_LINKS: SiteLink[] = [
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Cookies', to: '/cookies' },
];

/** Signed-in account pages, in the order people use them. */
export const ACCOUNT_LINKS: AccountLink[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutGrid },
  { label: 'Your giving', to: '/dashboard/giving', icon: HandCoins },
  { label: 'Your impact', to: '/my-impact', icon: Heart },
  { label: 'Voucher wallet', to: '/dashboard/wallet', icon: Wallet },
  { label: 'Your fundraisers', to: '/my-fundraisers', icon: Megaphone },
  { label: 'Messages', to: '/messages', icon: MessageCircle, unread: true },
  { label: 'Profile', to: '/profile', icon: UserRound },
  { label: 'Settings', to: '/settings', icon: Settings },
  { label: 'Admin portal', to: '/admin', icon: ShieldCheck, team: true },
];

/** Recipient tools that only the dashboard sidebar lists. */
export const DASHBOARD_EXTRA_LINKS: AccountLink[] = [
  { label: 'Loyalty card', to: '/dashboard/loyalty-card', icon: CreditCard },
  { label: 'Verification', to: '/dashboard/verification', icon: BadgeCheck },
];

export const TEAM_ROLES = ['admin', 'staff', 'viewer'];

export const accountLinksFor = (roles: readonly string[]) => {
  const team = roles.some((role) => TEAM_ROLES.includes(role));
  return ACCOUNT_LINKS.filter((link) => !link.team || team);
};

/** Pages that only make sense signed in; signing out from one of them returns home. */
export const isAccountPath = (path: string) =>
  /^\/(dashboard|my-fundraisers|my-impact|messages|profile|settings|admin)(\/|$)|^\/fundraiser\//.test(path);

export const isActivePath = (current: string, to: string) =>
  to === '/' ? current === '/' : current === to || current.startsWith(`${to}/`);

/** First name (or the email's name part) for greetings and the avatar initial. */
export const displayName = (user: { email?: string | null; user_metadata?: Record<string, unknown> } | null) => {
  const full = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
  if (full) return full;
  return (user?.email ?? '').split('@')[0] || 'Your account';
};

/**
 * Sign-in and sign-up links that come back to the page they were pressed on. On the
 * sign-in page itself they keep its own return path and only switch the tab.
 */
function authHref(pathname: string, search: string, mode: 'signin' | 'signup') {
  const onAuth = pathname === '/auth';
  const params = new URLSearchParams(onAuth ? search : '');
  if (!onAuth && pathname !== '/' && pathname !== '/reset-password') params.set('next', `${pathname}${search}`);
  if (mode === 'signup') params.set('mode', 'signup');
  else params.delete('mode');
  const query = params.toString();
  return query ? `/auth?${query}` : '/auth';
}
export const signInHref = (pathname: string, search: string) => authHref(pathname, search, 'signin');
export const signUpHref = (pathname: string, search: string) => authHref(pathname, search, 'signup');
