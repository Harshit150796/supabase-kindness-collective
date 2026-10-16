import { Component, ReactNode, Suspense, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useIsFetching } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { GeoGuard } from '@/components/auth/GeoGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ADMIN_LOADERS, prefetchAdminPage } from '@/pages/admin/adminPages';
import { prefetchWhenIdle } from '@/lib/idlePrefetch';
import { signInPath } from '@/lib/serverActions';

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

/** One persistent admin frame: access is checked once, and only the middle area changes between sections. */
export function AdminShell() {
  const { user, roles, loading, rolesLoaded } = useAuth();
  const location = useLocation();
  if (loading || (user && !rolesLoaded)) return <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to={signInPath(`${location.pathname}${location.search}`)} replace />;
  if (!TEAM.some((r) => roles.includes(r as any))) return <Navigate to="/" replace />;
  return <GeoGuard mode="strict"><Frame /></GeoGuard>;
}
