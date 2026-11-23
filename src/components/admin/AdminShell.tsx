import { Component, ReactNode, Suspense, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AdminNotFound } from '@/components/admin/AdminGateRoute';
import { useTeamSession } from '@/hooks/useTeamSession';
import { gatePath, rememberAdminNext } from '@/lib/adminGate';
import { useIsFetching } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { GeoGuard } from '@/components/auth/GeoGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ADMIN_LOADERS, prefetchAdminPage } from '@/pages/admin/adminPages';
import { prefetchWhenIdle } from '@/lib/idlePrefetch';
import { NoIndex } from '@/components/SEO';

const TEAM = ['admin', 'staff', 'viewer'];

function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading section">
      <Skeleton className="mb-5 h-9 w-56" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      <Skeleton className="mt-6 h-72 w-full" />
    </div>
  );
}

class SectionBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error('Admin section failed', error); }
  render() {
    if (!this.state.error) return this.props.children;
    const chunk = /dynamically imported module|Loading chunk|Failed to fetch/i.test(this.state.error.message);
    return (
      <div className="rounded-lg bg-background p-6">
        <p className="font-medium text-foreground">Couldn't load this section.</p>
        <p className="mt-1 text-sm text-muted-foreground">{this.state.error.message}</p>
        <Button size="sm" className="mt-4" onClick={() => (chunk ? window.location.reload() : this.setState({ error: null }))}>Retry</Button>
      </div>
    );
  }
}

/** Admin-only pages inside the shell (moderation, users, audit). */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { roles } = useAuth();
  return roles.includes('admin' as any) ? <>{children}</> : <Navigate to="/admin" replace />;
}

function TopProgress() {
  const fetching = useIsFetching();
  return <div aria-hidden="true" className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-primary transition-all duration-300 ${fetching ? 'scale-x-75 opacity-100' : 'scale-x-100 opacity-0'}`} />;
}

function Frame() {
  const { pathname } = useLocation();
  useEffect(() => prefetchWhenIdle(Object.keys(ADMIN_LOADERS).map((p) => () => Promise.resolve(prefetchAdminPage(p)))), []);
  return (
    <AdminLayout>
      <TopProgress />
      <SectionBoundary key={pathname}>
        <Suspense fallback={<PageSkeleton />}>
          <div key={pathname} className="animate-in fade-in duration-150"><Outlet /></div>
        </Suspense>
      </SectionBoundary>
    </AdminLayout>
  );
}

/**
 * Shown to a signed-in team member whose 12-hour admin check ran out in a tab that didn't come through the
 * hidden link (so it can't send them there). Before, they got the public "This page isn't here" page,
 * which looked like the portal had vanished (founder report, Nov 23, 2026). It names no link.
 */
export function SessionEnded() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-background p-7 shadow-sm sm:p-9">
        <div className="mb-6 flex items-center gap-3">
          <img src="/brand/logo-256.webp" alt="" width={40} height={40} className="h-10 w-10" />
          <div>
            <h1 className="font-display text-2xl font-normal leading-tight text-foreground">Sign in again to continue</h1>
            <p className="text-sm text-muted-foreground">CouponDonation</p>
          </div>
        </div>
        <p className="text-[15px] leading-relaxed text-foreground">
          For security, the admin area asks you to sign in through your team sign-in link every 12 hours. Open that
          link and you’ll come back to this page.
        </p>
        <Button asChild variant="outline" className="mt-6 h-11 w-full"><a href="/">Go to the public site</a></Button>
      </div>
    </main>
  );
}

/**
 * One persistent admin frame: access is checked once, and only the middle area changes between sections.
 * The portal opens only for a team member whose session passed the authenticator step on the hidden
 * sign-in (useTeamSession); everyone else gets the site's ordinary "page not found", never a sign-in
 * prompt. When a team session ends, a tab that came through the hidden link goes back to it (signed in or
 * not), and the sign-in returns to the same page; a signed-in team member in any other tab sees
 * SessionEnded. Only someone who isn't signed in in a tab that never came through the link gets the 404.
 */
export function AdminShell() {
  const { user, roles } = useAuth();
  const access = useTeamSession();
  const location = useLocation();
  const wanted = `${location.pathname}${location.search}`;
  useEffect(() => { if (access === 'denied') rememberAdminNext(wanted); }, [access, wanted]);
  if (access === 'loading') return <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">Loading…</div>;
  if (access === 'denied') {
    const gate = gatePath();
    if (gate) return <Navigate to={gate} replace />;
    const team = !!user && TEAM.some((r) => (roles as readonly string[]).includes(r));
    return team ? <><NoIndex title="Sign in again" /><SessionEnded /></> : <AdminNotFound />;
  }
  return <GeoGuard mode="strict"><Frame /></GeoGuard>;
}
