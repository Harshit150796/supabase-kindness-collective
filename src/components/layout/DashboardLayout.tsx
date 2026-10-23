import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSignOut } from '@/hooks/useSignOut';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Navbar } from '@/components/layout/Navbar';
import { useSiteMenu } from '@/components/navigation/menuContext';
import { DASHBOARD_EXTRA_LINKS, accountLinksFor, displayName, isActivePath } from '@/components/navigation/siteLinks';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Account pages: the site header (with the full-screen menu) on every size, the
 * account sections in a sidebar on wide screens and in a scrolling row on phones.
 * The sections come from the same list as the header's account menu.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, roles } = useAuth();
  const { unread } = useSiteMenu();
  const signOut = useSignOut();
  const location = useLocation();

  // Admin pages get the dedicated operations shell; donor/recipient pages keep this layout
  // and always show the personal-account nav (previously admins saw admin links on their own donor pages).
  if (location.pathname.startsWith('/admin')) return <AdminLayout>{children}</AdminLayout>;

  // Profile and settings live in the header's account menu; the sidebar keeps the working sections.
  const sections = [...accountLinksFor(roles).filter((link) => link.to !== '/profile' && link.to !== '/settings'), ...DASHBOARD_EXTRA_LINKS];
  const current = (to: string) => (to === '/dashboard' ? location.pathname === '/dashboard' : isActivePath(location.pathname, to));
  const name = displayName(user);

  return (
    <div className="min-h-dvh bg-muted/30">
      <Navbar autoHide={false} />

      {/* Phones and tablets: the sections as a scrolling row under the header. */}
      <nav aria-label="Account sections" className="sticky top-[var(--site-header-h)] z-30 border-b border-border bg-background lg:hidden">
        <ul className="flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((item) => (
            <li key={item.to} className="shrink-0">
              <Link
                to={item.to}
                aria-current={current(item.to) ? 'page' : undefined}
                className={`relative inline-flex min-h-12 items-center gap-2 whitespace-nowrap px-3 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform ${current(item.to) ? 'text-foreground after:scale-x-100' : 'text-muted-foreground after:scale-x-0 hover:text-foreground'}`}
              >
                {item.label}
                {item.unread && unread > 0 && <span className="text-xs font-semibold tabular-nums text-primary">{unread}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex">
        {/* Wide screens: the sidebar. */}
        <aside className="sticky top-[var(--site-header-h)] hidden h-[calc(100dvh-var(--site-header-h))] w-64 shrink-0 flex-col border-r border-border bg-background lg:flex">
          <nav aria-label="Account sections" className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
            {sections.map((item) => {
              const active = current(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm font-medium transition-colors ${active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-primary' : ''}`} aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  {item.unread && unread > 0 && <span className="text-xs font-semibold tabular-nums text-primary">{unread}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 px-2 pb-3">
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-20 text-sm font-semibold text-primary-foreground">
                {name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{name}</p>
                {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => { void signOut(); }}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
