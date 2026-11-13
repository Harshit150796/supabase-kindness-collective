import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, ExternalLink, LayoutGrid, List as ListIcon, MoreHorizontal, Search, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { rpc, fmtDate, downloadCsv } from '@/lib/adminApi';
import { fetchRpcPages } from '@/lib/adminWorkspace';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { HELP_NEEDS, cityState, needLabel } from '@/lib/helpNeeds';
import { fundraiserPublicUrl, fundraiserShareUrl } from '@/lib/fundraiserSharing';
import { FundraiserThumb } from '@/components/admin/fundraisers/FundraiserThumb';
import { PhoneLink } from '@/components/admin/PhoneLink';
import { showPhone } from '@/lib/phone';
import { FundraiserGallery } from '@/components/admin/fundraisers/FundraiserGallery';
import { FundraiserDrawer } from '@/components/admin/fundraisers/FundraiserDrawer';
import {
  ATTENTION_VIEWS, FIND_VIEWS, FundraiserCounts, FundraiserRow, PAGE_SIZE, SORTS, STATUSES, STATUS_LABEL, VIEW_LABEL, ago, percent, progressOf, usdWhole,
} from '@/components/admin/fundraisers/fundraiserList';

type BulkAction = 'approve' | 'pause' | 'resume' | 'archive';
const BULK: Record<BulkAction, { label: string; done: string; allowed: string[] }> = {
  approve: { label: 'Approve', done: 'approved', allowed: ['pending'] },
  pause: { label: 'Pause', done: 'paused', allowed: ['active'] },
  resume: { label: 'Make active', done: 'made active', allowed: ['paused', 'rejected'] },
  archive: { label: 'Archive', done: 'archived', allowed: ['pending', 'active', 'paused', 'completed', 'rejected'] },
};
const number = new Intl.NumberFormat('en-US');

/**
 * Admin > Fundraisers (rebuilt Nov 12, 2026, founder request): every fundraiser with its photo, organizer,
 * money raised, gifts, coupons still to send, reports and homepage place, from admin_fundraiser_list
 * (server-side filter, sort and pages). Table or photo view, quick views for what needs attention,
 * counts on every tab, bulk actions, a row menu and a drawer that steps through the list.
 */
export default function AdminFundraisers() {
  const { user } = useAuth();
  const { canWrite } = useTeamRole();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'all';
  const view = params.get('view') ?? 'all';
  const need = params.get('need') ?? '';
  const sort = params.get('sort') ?? 'created';
  const dir: 'asc' | 'desc' = params.get('dir') === 'asc' ? 'asc' : 'desc';
  const layout = params.get('layout') === 'gallery' ? 'gallery' : 'table';
  const page = Math.max(0, Number(params.get('page')) || 0);
  const openId = params.get('id');
  const [q, setQ] = useState(params.get('q') ?? '');
  const [dq, setDq] = useState(q);
  const searchRef = useRef<HTMLInputElement>(null);

  const set = (patch: Record<string, string | null>, keepPage = false) => setParams((p) => {
    for (const [k, v] of Object.entries(patch)) { if (v == null || v === '' || (k === 'status' && v === 'all') || (k === 'view' && v === 'all')) p.delete(k); else p.set(k, v); }
    if (!keepPage) p.delete('page');
    return p;
  }, { replace: true });

  useEffect(() => { const t = setTimeout(() => { if (q !== dq) { setDq(q); set({ q: q.trim() || null }); } }, 300); return () => clearTimeout(t); }, [q]);
  // "/" jumps to the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !el?.closest('input, textarea, select, [contenteditable="true"]') && !openId) { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId]);

  const [selected, setSelected] = useState<Record<string, { title: string; status: string }>>({});
  const [bulk, setBulk] = useState<BulkAction | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResults, setBulkResults] = useState<string[]>([]);
  useEffect(() => { setSelected({}); setBulkResults([]); }, [user?.id]);

  const filters = { _status: status, _search: dq.trim() || null, _view: view, _need: need || null, _sort: sort, _dir: dir };
  const list = useQuery({
    queryKey: ['adm-fr', user?.id, status, view, need, dq, sort, dir, page],
    placeholderData: keepPreviousData,
    queryFn: () => rpc<FundraiserRow[]>('admin_fundraiser_list', { ...filters, _limit: PAGE_SIZE, _offset: page * PAGE_SIZE }),
  });
  const counts = useQuery({
    queryKey: ['adm-fr-counts', user?.id, need],
    queryFn: () => rpc<FundraiserCounts>('admin_fundraiser_counts', { _need: need || null }),
  });
  const rows = list.data ?? [];
  const total = rows[0]?.total_count ?? 0;
  const c = counts.data;

  // The drawer steps through the rows on this page.
  const index = openId ? rows.findIndex((r) => r.id === openId) : -1;
  const open = (id: string | null) => setParams((p) => { if (id) p.set('id', id); else { p.delete('id'); p.delete('tab'); } return p; });

  const select = (r: FundraiserRow, on: boolean) => setSelected((old) => { const next = { ...old }; if (on) next[r.id] = { title: r.title, status: r.status }; else delete next[r.id]; return next; });
  const allOnPage = rows.length > 0 && rows.every((r) => selected[r.id]);
  const selectPage = (on: boolean) => setSelected((old) => { const next = { ...old }; for (const r of rows) { if (on) next[r.id] = { title: r.title, status: r.status }; else delete next[r.id]; } return next; });
  const selectedCount = Object.keys(selected).length;

  const refresh = () => { qc.invalidateQueries({ queryKey: ['adm-fr'] }); qc.invalidateQueries({ queryKey: ['adm-fr-counts'] }); };
  const runAction = async (id: string, action: BulkAction) => { await rpc('admin_fundraiser_action', { _id: id, _action: action }); };
  const quick = async (r: FundraiserRow, action: BulkAction) => {
    if (!window.confirm(`${BULK[action].label} "${r.title}"?`)) return;
    try { await runAction(r.id, action); toast({ title: `${r.title}: ${BULK[action].done}` }); refresh(); }
    catch (e) { toast({ title: 'Action failed', description: (e as Error).message, variant: 'destructive' }); }
  };
  const runBulk = async () => {
    if (!bulk) return;
    setBulkBusy(true);
    const results: string[] = [];
    for (const [id, item] of Object.entries(selected)) {
      if (!BULK[bulk].allowed.includes(item.status)) { results.push(`${item.title}: skipped (it is ${STATUS_LABEL[item.status]?.toLowerCase() ?? item.status})`); continue; }
      try { await runAction(id, bulk); results.push(`${item.title}: ${BULK[bulk].done}`); } catch (e) { results.push(`${item.title}: ${(e as Error).message}`); }
    }
    setBulkResults(results); setSelected({}); setBulk(null); setBulkBusy(false); refresh();
  };
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast({ title: 'Share link copied' }); } catch { toast({ title: 'Copy this link', description: text }); } };

  const exportCsv = async (onlySelected = false) => {
    try {
      const ids = onlySelected ? Object.keys(selected) : null;
      const all = await fetchRpcPages<FundraiserRow>((offset, limit) => rpc<FundraiserRow[]>('admin_fundraiser_list', onlySelected ? { _ids: ids, _limit: limit, _offset: offset, _sort: sort, _dir: dir } : { ...filters, _limit: limit, _offset: offset }), 500);
      downloadCsv(onlySelected ? 'fundraisers-selected' : 'fundraisers', all.map((r) => ({
        id: r.id, title: r.title, status: r.status, example: r.is_example ? 'yes' : '', needs: (r.help_categories.length ? r.help_categories : [r.category]).map(needLabel).join('; '),
        stores: r.preferred_brands.join('; '), city: r.city ?? '', state: r.state_code ?? '', goal: r.monthly_goal, raised: r.raised, percent_of_goal: Math.round(progressOf(r) * 100),
        gifts: r.gifts, last_gift_at: r.last_gift_at ?? '', coupons_to_send: r.coupons_waiting, coupons_ready: r.coupons_ready, coupons_used: r.coupons_used, open_reports: r.open_reports,
        photos: r.photo_count, story_characters: r.story_length, homepage_position: r.homepage_position ?? '', hidden_from_homepage: r.homepage_hidden ? 'yes' : '',
        organizer_name: r.organizer_name ?? '', organizer_email: r.organizer_email ?? '', organizer_phone: showPhone(r.organizer_phone) ?? '',
        created_at: r.created_at ?? '', updated_at: r.updated_at ?? '', public_page: fundraiserPublicUrl(r.unique_slug, r.id),
      })));
      toast({ title: `${all.length} fundraisers exported` });
    } catch (e) { toast({ title: 'Export failed', description: (e as Error).message, variant: 'destructive' }); }
  };

  const sortKeyFor: Record<string, string> = { title: 'title', status: 'status', organizer: 'organizer', raised: 'raised', gifts: 'gifts', coupons: 'waiting', created_at: 'created' };
  const cols: Column<FundraiserRow>[] = [
    ...(canWrite ? [{ key: 'select', header: <Checkbox aria-label="Select every fundraiser on this page" checked={allOnPage} onCheckedChange={(v) => selectPage(!!v)} />, className: 'w-8', cell: (r: FundraiserRow) => <span onClick={(e) => e.stopPropagation()}><Checkbox aria-label={`Select ${r.title}`} checked={!!selected[r.id]} onCheckedChange={(v) => select(r, !!v)} /></span> }] : []),
    { key: 'title', header: 'Fundraiser', sortable: true, cell: (r) => {
      const place = cityState(r.city, r.state_code);
      return <div className="flex min-w-[260px] max-w-[380px] items-center gap-3">
        <FundraiserThumb url={r.photo_url} need={r.help_categories[0] ?? r.category} size={48} />
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.title}</p>
          <p className="truncate text-xs text-muted-foreground">{[needLabel(r.help_categories[0] ?? r.category), place].filter(Boolean).join(' · ')}</p>
          <p className="flex flex-wrap gap-1 pt-0.5">
            {r.is_example && <Tag>Example</Tag>}
            {!r.photo_url && ['pending', 'active', 'paused'].includes(r.status) && <Tag tone="warn">No photo</Tag>}
            {r.story_length < 200 && ['pending', 'active', 'paused'].includes(r.status) && <Tag tone="warn">Short story</Tag>}
            {r.homepage_position != null && !r.homepage_hidden && <Tag tone="blue">Homepage #{r.homepage_position}{r.homepage_pinned ? ' (pinned)' : ''}</Tag>}
            {r.homepage_hidden && <Tag>Hidden from homepage</Tag>}
          </p>
        </div>
      </div>;
    } },
    { key: 'organizer', header: 'Created by', sortable: true, cell: (r) => <div className="max-w-[200px]"><p className="truncate text-foreground">{r.organizer_name || 'No name'}</p><p className="truncate text-xs text-muted-foreground">{r.organizer_email || '—'}</p><PhoneLink phone={r.organizer_phone} className="text-xs" empty={<p className="text-[11px] text-muted-foreground">No phone</p>} /></div> },
    { key: 'status', header: 'Status', sortable: true, cell: (r) => <StatusBadge value={r.status} /> },
    { key: 'raised', header: 'Raised', sortable: true, cell: (r) => { const p = progressOf(r); return <div className="w-36"><p className="text-xs"><span className="font-medium text-foreground">{usdWhole(r.raised)}</span> <span className="text-muted-foreground">of {usdWhole(r.monthly_goal)}</span></p><div className="mt-1 flex items-center gap-1.5"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className="h-full rounded-full bg-primary" style={{ width: `${p * 100}%` }} /></div><span className="w-8 text-right text-[11px] text-muted-foreground">{percent(p)}</span></div></div>; } },
    { key: 'gifts', header: 'Gifts', sortable: true, align: 'right', cell: (r) => <div><p className="text-foreground">{r.gifts}</p><p className="whitespace-nowrap text-[11px] text-muted-foreground">{r.last_gift_at ? ago(r.last_gift_at) : 'none yet'}</p></div> },
    { key: 'coupons', header: 'Coupons', sortable: true, cell: (r) => <div className="whitespace-nowrap text-xs">{r.coupons_waiting > 0 ? <p className="font-medium text-verify">{r.coupons_waiting} to send</p> : <p className="text-muted-foreground">{r.coupons_ready + r.coupons_used ? 'None waiting' : '—'}</p>}{(r.coupons_ready + r.coupons_used) > 0 && <p className="text-[11px] text-muted-foreground">{r.coupons_ready} ready · {r.coupons_used} used</p>}</div> },
    { key: 'reports', header: 'Reports', cell: (r) => r.open_reports > 0 ? <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive">{r.open_reports} open</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: 'created_at', header: 'Created', sortable: true, cell: (r) => <span className="whitespace-nowrap text-xs text-muted-foreground" title={fmtDate(r.created_at)}>{ago(r.created_at)}</span> },
    { key: 'menu', header: '', className: 'w-10', cell: (r) => <span onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Actions for ${r.title}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => open(r.id)}>Open details</DropdownMenuItem>
          <DropdownMenuItem asChild><a href={fundraiserPublicUrl(r.unique_slug, r.id)} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Public page</a></DropdownMenuItem>
          <DropdownMenuItem onSelect={() => copy(fundraiserShareUrl(r.unique_slug, r.id))}><Copy className="mr-2 h-4 w-4" />Copy share link</DropdownMenuItem>
          {r.coupons_waiting > 0 && <DropdownMenuItem onSelect={() => setParams((p) => { p.set('id', r.id); p.set('tab', 'coupons'); return p; })}>Send coupons ({r.coupons_waiting})</DropdownMenuItem>}
          {canWrite && <>
            <DropdownMenuSeparator />
            {(Object.keys(BULK) as BulkAction[]).filter((a) => BULK[a].allowed.includes(r.status)).map((a) => <DropdownMenuItem key={a} onSelect={() => quick(r, a)}>{BULK[a].label}</DropdownMenuItem>)}
          </>}
        </DropdownMenuContent>
      </DropdownMenu>
    </span> },
  ];

  const activeFilters = [
    view !== 'all' && { label: VIEW_LABEL[view] ?? view, clear: () => set({ view: null }) },
    need && { label: needLabel(need), clear: () => set({ need: null }) },
    dq.trim() && { label: `“${dq.trim()}”`, clear: () => { setQ(''); setDq(''); set({ q: null }); } },
  ].filter(Boolean) as Array<{ label: string; clear: () => void }>;

  return (
    <DashboardLayout>
      <PageHeader title="Fundraisers" description="Every fundraiser with its photo, money raised, coupons to send and anything that needs a look."
        actions={<>
          <div className="flex rounded-md border border-border p-0.5" role="group" aria-label="Show as">
            <Button size="sm" variant={layout === 'table' ? 'secondary' : 'ghost'} className="h-8 px-2.5" aria-pressed={layout === 'table'} onClick={() => set({ layout: null }, true)}><ListIcon className="mr-1.5 h-4 w-4" />Table</Button>
            <Button size="sm" variant={layout === 'gallery' ? 'secondary' : 'ghost'} className="h-8 px-2.5" aria-pressed={layout === 'gallery'} onClick={() => set({ layout: 'gallery' }, true)}><LayoutGrid className="mr-1.5 h-4 w-4" />Photos</Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportCsv(false)}><Download className="mr-1.5 h-4 w-4" />CSV</Button>
        </>} />

      <dl className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Fundraisers', value: c ? number.format(c.total) : '…', go: () => set({ status: null, view: null }) },
          { label: 'Active now', value: c ? number.format(c.status.active ?? 0) : '…', go: () => set({ status: 'active', view: null }) },
          { label: 'Waiting for review', value: c ? number.format(c.views.review ?? 0) : '…', go: () => set({ status: null, view: 'review' }), highlight: (c?.views.review ?? 0) > 0 },
          { label: 'Coupons to send', value: c ? number.format(c.waiting ?? 0) : '…', go: () => set({ status: null, view: 'coupons', sort: 'waiting', dir: 'desc' }), highlight: (c?.waiting ?? 0) > 0 },
        ].map((k) => (
          <button key={k.label} type="button" onClick={k.go} className={cn('rounded-lg border p-3 text-left transition-colors hover:border-primary/50', k.highlight ? 'border-verify/40 bg-verify/5' : 'border-border bg-background')}>
            <dt className="text-xs text-muted-foreground">{k.label}</dt>
            <dd className="text-2xl font-semibold tabular-nums text-foreground">{k.value}</dd>
          </button>
        ))}
      </dl>

      <div className="mb-3 flex flex-wrap gap-1 rounded-md bg-muted p-1" role="tablist" aria-label="Status">
        {STATUSES.map((s) => {
          const n = s === 'all' ? c?.total : c?.status[s] ?? 0;
          return <button key={s} role="tab" aria-selected={status === s} onClick={() => set({ status: s })} className={cn('rounded px-2.5 py-1 text-xs', status === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {STATUS_LABEL[s]}{n != null && <span className="ml-1 tabular-nums text-muted-foreground">{number.format(n)}</span>}
          </button>;
        })}
      </div>

      <div className="mb-3 space-y-2">
        {[{ title: 'Needs attention', views: ATTENTION_VIEWS }, { title: 'Find', views: FIND_VIEWS }].map((group) => (
          <div key={group.title} className="flex flex-wrap items-center gap-1.5">
            <span className="w-28 shrink-0 text-xs text-muted-foreground">{group.title}</span>
            {group.views.map((v) => {
              const n = c?.views[v.id];
              const on = view === v.id;
              const urgent = group.title === 'Needs attention' && (n ?? 0) > 0;
              return <button key={v.id} type="button" title={v.hint} aria-pressed={on} onClick={() => set({ view: on ? null : v.id })}
                className={cn('rounded-full border px-2.5 py-1 text-xs transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : urgent ? 'border-verify/40 bg-verify/5 text-foreground hover:border-verify' : 'border-border text-muted-foreground hover:text-foreground')}>
                {v.label}{n != null && <span className={cn('ml-1 tabular-nums', on ? 'text-primary-foreground/80' : urgent ? 'text-verify' : '')}>{number.format(n)}</span>}
              </button>;
            })}
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, organizer, email, phone, city or ID" aria-label="Search fundraisers" className="h-9 pl-8 pr-8" />
          {q && <button type="button" aria-label="Clear search" className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground" onClick={() => setQ('')}><X className="h-4 w-4" /></button>}
        </div>
        <Select value={need || 'all'} onValueChange={(v) => set({ need: v === 'all' ? null : v })}>
          <SelectTrigger className="h-9 w-48" aria-label="Need"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All needs</SelectItem>{HELP_NEEDS.map((n) => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={`${sort}:${dir}`} onValueChange={(v) => { const [s, d] = v.split(':'); set({ sort: s, dir: d }); }}>
          <SelectTrigger className="h-9 w-48" aria-label="Sort"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>{SORTS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}{!SORTS.some((s) => s.id === `${sort}:${dir}`) && <SelectItem value={`${sort}:${dir}`}>Custom order</SelectItem>}</SelectContent>
        </Select>
        {activeFilters.length > 0 && <div className="flex flex-wrap items-center gap-1.5">{activeFilters.map((f) => <button key={f.label} type="button" onClick={f.clear} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-foreground hover:bg-muted/70">{f.label}<X className="h-3 w-3" aria-label="Remove filter" /></button>)}<button type="button" className="text-xs text-primary underline-offset-4 hover:underline" onClick={() => { setQ(''); setDq(''); set({ view: null, need: null, q: null, status: null }); }}>Clear all</button></div>}
        <span className="ml-auto hidden text-xs text-muted-foreground lg:inline">Press / to search, J and K to step through an open fundraiser</span>
      </div>

      {canWrite && selectedCount > 0 && (
        <div className="sticky top-0 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-background p-2 shadow-sm">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          {(Object.keys(BULK) as BulkAction[]).map((a) => {
            const n = Object.values(selected).filter((s) => BULK[a].allowed.includes(s.status)).length;
            return <Button key={a} size="sm" variant="outline" disabled={!n} onClick={() => setBulk(a)}>{BULK[a].label}{n !== selectedCount && n > 0 ? ` (${n})` : ''}</Button>;
          })}
          <Button size="sm" variant="outline" onClick={() => exportCsv(true)}><Download className="mr-1.5 h-4 w-4" />Export selected</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected({})}>Clear selection</Button>
        </div>
      )}
      {bulkResults.length > 0 && <div className="mb-3 rounded-md bg-muted p-3 text-sm"><div className="mb-1 flex justify-between"><span className="font-medium">Results</span><button className="text-xs text-primary" onClick={() => setBulkResults([])}>Dismiss</button></div><ul aria-live="polite" className="space-y-1">{bulkResults.map((result, i) => <li key={i}>{result}</li>)}</ul></div>}
      <AlertDialog open={!!bulk} onOpenChange={(v) => { if (!v && !bulkBusy) setBulk(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{bulk ? BULK[bulk].label : ''} {bulk ? Object.values(selected).filter((s) => BULK[bulk].allowed.includes(s.status)).length : 0} fundraisers?</AlertDialogTitle>
            <AlertDialogDescription>Each one is checked and recorded in the audit log separately. Donations and coupons are kept. Fundraisers this doesn't apply to are skipped and listed in the results.{bulk === 'approve' ? ' Approved fundraisers go live and their organizers get the "Your fundraiser is live" email.' : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={bulkBusy}>Cancel</AlertDialogCancel><Button disabled={bulkBusy} onClick={runBulk}>{bulkBusy ? 'Working…' : 'Confirm'}</Button></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {layout === 'gallery' ? (
        <>
          <FundraiserGallery rows={list.data} loading={list.isLoading} error={list.error ? String((list.error as Error).message) : null} onRetry={() => list.refetch()}
            onOpen={(r) => open(r.id)} selected={canWrite ? Object.fromEntries(Object.entries(selected).map(([k, v]) => [k, v.title])) : null} onSelect={select} openId={openId} />
          <Pager page={page} total={total} onPage={(p) => set({ page: String(p) }, true)} />
        </>
      ) : (
        <DataTable columns={cols} rows={list.data} total={total} loading={list.isLoading} error={list.error ? String((list.error as Error).message) : null} onRetry={() => list.refetch()}
          page={page} pageSize={PAGE_SIZE} onPage={(p) => set({ page: String(p) }, true)}
          sort={{ key: Object.entries(sortKeyFor).find(([, v]) => v === sort)?.[0] ?? '', dir }}
          onSort={(k) => { const key = sortKeyFor[k] ?? k; set({ sort: key, dir: sort === key && dir === 'desc' ? 'asc' : 'desc' }); }}
          rowKey={(r) => r.id} onRowClick={(r) => open(r.id)} rowClassName={(r) => cn(r.id === openId && 'bg-primary/5', list.isFetching && !list.isLoading && 'opacity-70')} empty="No fundraisers match these filters." />
      )}

      <FundraiserDrawer id={openId} onClose={() => open(null)}
        position={index >= 0 ? `${page * PAGE_SIZE + index + 1} of ${number.format(total)}` : null}
        onPrev={index > 0 ? () => open(rows[index - 1].id) : undefined}
        onNext={index >= 0 && index < rows.length - 1 ? () => open(rows[index + 1].id) : undefined} />
    </DashboardLayout>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: 'warn' | 'blue' }) {
  return <span className={cn('rounded px-1.5 py-px text-[10px] font-medium', tone === 'warn' ? 'bg-destructive/10 text-destructive' : tone === 'blue' ? 'bg-verify/10 text-verify' : 'bg-muted text-muted-foreground')}>{children}</span>;
}

function Pager({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
      <span>{number.format(total)} fundraiser{total === 1 ? '' : 's'}</span>
      <div className="flex items-center gap-2">
        <span>Page {page + 1} of {pages}</span>
        <Button size="sm" variant="outline" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
