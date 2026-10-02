import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { sb, rpc, fmtDate } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Megaphone, DollarSign, Users, ShieldCheck, Gift, Package, Flag, ListTodo, Bell, FileText,
  BookOpen, MessageSquare, Newspaper, HelpCircle, Mail, UserCog, History, Settings, BarChart3, Search,
  PanelLeftClose, PanelLeftOpen, Menu, LogOut, Home, Contact,
} from 'lucide-react';
import logo from '@/assets/logo.png';

type Item = { label: string; path: string; icon: any; adminOnly?: boolean };
const GROUPS: { title: string; items: Item[] }[] = [
  { title: 'Overview', items: [{ label: 'Overview', path: '/admin', icon: LayoutDashboard }, { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 }] },
  { title: 'Operations', items: [
    { label: 'Fundraisers', path: '/admin/fundraisers', icon: Megaphone },
    { label: 'Donations', path: '/admin/donations', icon: DollarSign },
    { label: 'Donors', path: '/admin/donors', icon: Contact },
    { label: 'Recipients', path: '/admin/verifications', icon: ShieldCheck },
    { label: 'Coupons', path: '/admin/coupons', icon: Gift },
    { label: 'Procurement', path: '/admin/procurement', icon: Package },
    { label: 'Gold Coins', path: '/admin/gold-coins', icon: Gift },
    { label: 'Partner inquiries', path: '/admin/partners', icon: Contact },
  ] },
  { title: 'Trust', items: [{ label: 'Moderation', path: '/admin/moderation', icon: Flag, adminOnly: true }] },
  { title: 'Work', items: [{ label: 'Tasks', path: '/admin/tasks', icon: ListTodo }, { label: 'Notifications', path: '/admin/notifications', icon: Bell }] },
  { title: 'Content', items: [
    { label: 'Site content', path: '/admin/content', icon: FileText },
    { label: 'Stories', path: '/admin/stories', icon: BookOpen },
    { label: 'Testimonials', path: '/admin/testimonials', icon: MessageSquare },
    { label: 'Blog', path: '/admin/blog', icon: Newspaper },
    { label: 'FAQ', path: '/admin/faq', icon: HelpCircle },
    { label: 'Newsletters', path: '/admin/newsletters', icon: Mail },
  ] },
  { title: 'Admin', items: [
    { label: 'Team & access', path: '/admin/team', icon: UserCog },
    { label: 'Users', path: '/admin/users', icon: Users, adminOnly: true },
    { label: 'Audit log', path: '/admin/audit', icon: History, adminOnly: true },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ] },
];
const ALL = GROUPS.flatMap((g) => g.items);

export function useTeamRole() {
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin' as any);
  const isStaff = isAdmin || roles.includes('staff' as any);
  return { isAdmin, isStaff, canWrite: isStaff, label: isAdmin ? 'Admin' : isStaff ? 'Staff' : 'Viewer' };
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { isAdmin, label } = useTeamRole();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('admin-sidebar') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => { localStorage.setItem('admin-sidebar', collapsed ? '1' : '0'); }, [collapsed]);
  useEffect(() => { const t = setTimeout(() => setDebounced(q), 250); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Keyboard: Cmd/Ctrl+K palette, "/" search, g+letter navigation
  useEffect(() => {
    let g = false;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(t?.tagName) || t?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); return; }
      if (typing) return;
      if (e.key === '/') { e.preventDefault(); setPaletteOpen(true); return; }
      if (g) {
        const map: Record<string, string> = { o: '/admin', f: '/admin/fundraisers', d: '/admin/donations', c: '/admin/donors', t: '/admin/tasks', n: '/admin/notifications' };
        if (map[e.key]) navigate(map[e.key]);
        g = false; return;
      }
      if (e.key === 'g') { g = true; setTimeout(() => (g = false), 800); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const { data: results } = useQuery({
    queryKey: ['admin-search', debounced],
    enabled: paletteOpen && debounced.trim().length >= 2,
    queryFn: () => rpc<any[]>('admin_search', { _q: debounced.trim() }),
  });

  const { data: notifs } = useQuery({
    queryKey: ['admin-notifs-bell', user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      const [{ data: n }, { data: r }] = await Promise.all([
        sb.from('admin_notifications').select('id,title,link,created_at').order('created_at', { ascending: false }).limit(15),
        sb.from('admin_notification_reads').select('notification_id').eq('user_id', user!.id),
      ]);
      const read = new Set((r ?? []).map((x: any) => x.notification_id));
      return (n ?? []).map((x: any) => ({ ...x, unread: !read.has(x.id) }));
    },
  });
  const unread = notifs?.filter((n: any) => n.unread).length ?? 0;
  const markRead = async (ids: string[]) => {
    if (!ids.length) return;
    await sb.from('admin_notification_reads').upsert(ids.map((id) => ({ notification_id: id, user_id: user!.id })), { onConflict: 'notification_id,user_id', ignoreDuplicates: true });
    qc.invalidateQueries({ queryKey: ['admin-notifs-bell'] });
  };

  const crumbs = useMemo(() => {
    const cur = ALL.filter((i) => i.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(i.path)).sort((a, b) => b.path.length - a.path.length)[0];
    return cur && cur.path !== '/admin' ? ['Admin', cur.label] : ['Admin', 'Overview'];
  }, [location.pathname]);

  const Nav = ({ compact }: { compact: boolean }) => (
    <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
      {GROUPS.map((g) => {
        const items = g.items.filter((i) => isAdmin || !i.adminOnly);
        if (!items.length) return null;
        return (
          <div key={g.title}>
            {!compact && <p className="px-2 pb-1 text-[11px] font-medium text-ink-foreground/50">{g.title}</p>}
            {items.map((i) => {
              const active = i.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(i.path);
              return (
                <Link key={i.path} to={i.path} title={i.label}
                  className={cn('flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'text-ink-foreground/75 hover:bg-ink-foreground/10 hover:text-ink-foreground',
                    compact && 'justify-center')}>
                  <i.icon className="h-4 w-4 shrink-0" />{!compact && i.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );

  const Brand = ({ compact }: { compact: boolean }) => (
    <Link to="/admin" className="flex h-14 items-center gap-2 border-b border-ink-foreground/10 px-4">
      <img src={logo} alt="CouponDonation" className="h-7 w-7 object-contain" width={28} height={28} />
      {!compact && <span className="text-sm font-semibold">Operations</span>}
    </Link>
  );

  return (
    <div className="flex min-h-dvh bg-muted/30 font-sans">
      <aside className={cn('sticky top-0 hidden h-dvh shrink-0 flex-col bg-ink text-ink-foreground md:flex', collapsed ? 'w-14' : 'w-60')}>
        <Brand compact={collapsed} />
        <Nav compact={collapsed} />
        <button onClick={() => setCollapsed((c) => !c)} className="flex items-center gap-2 border-t border-ink-foreground/10 px-4 py-3 text-xs text-ink-foreground/60 hover:text-ink-foreground" aria-label="Toggle sidebar">
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /> Collapse</>}
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-ink text-ink-foreground"><Brand compact={false} /><Nav compact={false} /></aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
          <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
          <nav aria-label="Breadcrumb" className="hidden text-sm text-muted-foreground sm:block">
            {crumbs.map((c, i) => <span key={i}>{i > 0 && <span className="mx-1.5">/</span>}<span className={i === crumbs.length - 1 ? 'text-foreground' : ''}>{c}</span></span>)}
          </nav>
          <button onClick={() => setPaletteOpen(true)} className="ml-auto flex h-9 w-full max-w-xs items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground hover:bg-muted">
            <Search className="h-4 w-4" /><span className="flex-1 text-left">Search…</span><kbd className="hidden rounded border border-border px-1.5 text-[10px] sm:inline">⌘K</kbd>
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
                <Bell className="h-5 w-5" />
                {unread > 0 && <span className="absolute right-1 top-1 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">{unread}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <p className="text-sm font-medium">Notifications</p>
                <button className="text-xs text-primary" onClick={() => markRead((notifs ?? []).filter((n: any) => n.unread).map((n: any) => n.id))}>Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {!notifs?.length ? <p className="p-4 text-center text-sm text-muted-foreground">No notifications yet.</p> :
                  notifs.map((n: any) => (
                    <button key={n.id} onClick={() => { markRead([n.id]); if (n.link) navigate(n.link); }} className="block w-full border-b border-border px-3 py-2 text-left hover:bg-muted/50">
                      <p className={cn('text-sm', n.unread ? 'font-medium text-foreground' : 'text-muted-foreground')}>{n.title}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(n.created_at)}</p>
                    </button>
                  ))}
              </div>
              <Link to="/admin/notifications" className="block px-3 py-2 text-center text-xs text-primary">View all</Link>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="rounded-full bg-primary/10 text-primary" aria-label="Account menu">{user?.email?.[0]?.toUpperCase()}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs font-normal"><span className="block truncate">{user?.email}</span><span className="text-muted-foreground">{label}</span></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/')}><Home className="mr-2 h-4 w-4" />Public site</DropdownMenuItem>
              <DropdownMenuItem onClick={async () => { await signOut(); navigate('/'); }}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-[1400px]">{children}</div></main>
      </div>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Search fundraisers, donations, users, tasks…" value={q} onValueChange={setQ} />
        <CommandList>
          <CommandEmpty>{q.trim().length < 2 ? 'Type at least 2 characters.' : 'No results.'}</CommandEmpty>
          {!!results?.length && (
            <CommandGroup heading="Results">
              {results.map((r: any) => (
                <CommandItem key={r.kind + r.id} value={`${r.kind} ${r.label} ${r.id}`} onSelect={() => { setPaletteOpen(false); navigate(r.link); }}>
                  <span className="mr-2 w-20 text-xs capitalize text-muted-foreground">{r.kind}</span><span className="truncate">{r.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{r.sub}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          <CommandGroup heading="Go to">
            {ALL.filter((i) => isAdmin || !i.adminOnly).map((i) => (
              <CommandItem key={i.path} value={`go ${i.label}`} onSelect={() => { setPaletteOpen(false); navigate(i.path); }}><i.icon className="mr-2 h-4 w-4" />{i.label}</CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-3xl font-normal text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
