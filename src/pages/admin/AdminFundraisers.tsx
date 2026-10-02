import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { sb, rpc, usd, fmtDate, downloadCsv, fetchAllChunks } from '@/lib/adminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Download, ExternalLink, Search, Images } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FundraiserImagesTab } from '@/components/admin/FundraiserImagesTab';

const STATUSES = ['all', 'pending', 'active', 'paused', 'completed', 'rejected', 'archived'] as const;
const PAGE = 25;

export default function AdminFundraisers() {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<string>(params.get('status') ?? 'all');
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'created_at', dir: 'desc' });
  const openId = params.get('id');
  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(0); }, 300); return () => clearTimeout(t); }, [q]);

  const query = useQuery({
    queryKey: ['adm-fr', status, dq, page, sort],
    queryFn: async () => {
      let b = sb.from('fundraisers').select('id,title,unique_slug,status,category,country,monthly_goal,featured_order,created_at,user_id', { count: 'exact' });
      if (status !== 'all') b = b.eq('status', status);
      if (dq.trim()) b = b.or(`title.ilike.%${dq.trim().replace(/[%,()]/g, '')}%,unique_slug.ilike.%${dq.trim().replace(/[%,()]/g, '')}%`);
      const { data, error, count } = await b.order(sort.key, { ascending: sort.dir === 'asc', nullsFirst: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
  });

  const cols: Column<any>[] = [
    { key: 'title', header: 'Fundraiser', sortable: true, cell: (r) => <div className="max-w-[320px]"><p className="truncate font-medium text-foreground">{r.title}</p><p className="truncate text-xs text-muted-foreground">/{r.unique_slug}</p></div> },
    { key: 'status', header: 'Status', sortable: true, cell: (r) => <StatusBadge value={r.status} /> },
    { key: 'featured_order', header: 'Featured', sortable: true, cell: (r) => r.featured_order != null ? `#${r.featured_order}` : '—' },
    { key: 'category', header: 'Category', cell: (r) => <span className="capitalize">{r.category}</span> },
    { key: 'monthly_goal', header: 'Goal', align: 'right', sortable: true, cell: (r) => usd(r.monthly_goal) },
    { key: 'created_at', header: 'Created', sortable: true, cell: (r) => fmtDate(r.created_at) },
  ];

  const exportCsv = async () => {
    const rows = await fetchAllChunks((f, t) => { let b = sb.from('fundraisers').select('id,title,unique_slug,status,category,country,monthly_goal,created_at'); if (status !== 'all') b = b.eq('status', status); return b.order('created_at', { ascending: false }).range(f, t); });
    downloadCsv('fundraisers', rows);
  };

  return (
    <DashboardLayout>
      <PageHeader title="Fundraisers" description="Approve, edit, pause, feature and archive campaigns. Totals shown are computed from completed donations."
        actions={<>
          <Button variant="outline" size="sm" asChild><Link to="/admin/fundraisers/manage"><Images className="mr-1.5 h-4 w-4" />Images & legacy editor</Link></Button>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" />CSV</Button>
        </>} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(0); }} className={cn('rounded px-2.5 py-1 text-xs capitalize', status === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>{s}</button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or slug" className="h-9 pl-8" /></div>
      </div>
      <DataTable columns={cols} rows={query.data?.rows} total={query.data?.total} loading={query.isLoading} error={query.error ? String((query.error as Error).message) : null} onRetry={() => query.refetch()}
        page={page} pageSize={PAGE} onPage={setPage} sort={sort} onSort={(k) => setSort((s) => ({ key: k, dir: s.key === k && s.dir === 'desc' ? 'asc' : 'desc' }))}
        rowKey={(r) => r.id} onRowClick={(r) => setParams((p) => { p.set('id', r.id); return p; })} empty="No fundraisers match these filters." />
      <FundraiserDrawer id={openId} onClose={() => setParams((p) => { p.delete('id'); return p; })} />
    </DashboardLayout>
  );
}

function FundraiserDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { isAdmin, canWrite } = useTeamRole();
  const [confirm, setConfirm] = useState<null | 'reject' | 'archive' | 'delete'>(null);
  const [reason, setReason] = useState('');
  const [typed, setTyped] = useState('');
  const [edit, setEdit] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('overview');
  useEffect(() => { setTab('overview'); }, [id]);

  const d = useQuery({
    queryKey: ['adm-fr-detail', id], enabled: !!id,
    queryFn: async () => {
      const [f, totals, dons, upd, com, team, conv, rep, audit] = await Promise.all([
        sb.from('fundraisers').select('*').eq('id', id).single(),
        rpc<any[]>('get_fundraiser_totals', { _fundraiser_id: id }).catch(() => []),
        sb.from('donations').select('id,amount,status,donor_name,is_anonymous,payment_provider,created_at').eq('fundraiser_id', id).order('created_at', { ascending: false }).limit(50),
        sb.from('fundraiser_updates').select('id,title,created_at').eq('fundraiser_id', id).order('created_at', { ascending: false }).limit(50),
        sb.from('fundraiser_comments').select('id,display_name,body,is_hidden,created_at').eq('fundraiser_id', id).order('created_at', { ascending: false }).limit(50),
        sb.from('fundraiser_team').select('id,role,status,invite_email,created_at').eq('fundraiser_id', id),
        sb.from('conversations').select('id,status,last_message_at,created_at').eq('fundraiser_id', id).order('last_message_at', { ascending: false }).limit(50),
        sb.from('content_reports').select('id,reason,status,target_type,created_at').eq('fundraiser_id', id).order('created_at', { ascending: false }),
        isAdmin ? sb.from('admin_audit_log').select('id,action,actor_id,created_at').eq('table_name', 'fundraisers').eq('record_id', id).order('created_at', { ascending: false }).limit(50) : Promise.resolve({ data: [] }),
      ]);
      if (f.error) throw f.error;
      return { f: f.data, totals: (totals as any[])?.[0], dons: dons.data ?? [], upd: upd.data ?? [], com: com.data ?? [], team: team.data ?? [], conv: conv.data ?? [], rep: rep.data ?? [], audit: audit.data ?? [] };
    },
  });
  const f = d.data?.f;

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      await rpc('admin_fundraiser_action', { _id: id, _action: action, ...extra });
      if (action === 'reject') {
        await sb.functions.invoke('fundraiser-actions', { body: { action: 'admin_notify_rejection', fundraiser_id: id, reason: extra._reason } }).catch(() => null);
      }
      toast({ title: `Fundraiser ${action === 'feature' ? 'feature order saved' : action + 'd'}` });
      qc.invalidateQueries({ queryKey: ['adm-fr'] }); qc.invalidateQueries({ queryKey: ['adm-fr-detail', id] });
      setConfirm(null); setReason('');
    } catch (e) { toast({ title: 'Action failed', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(false);
  };

  const saveEdit = async () => {
    setBusy(true);
    try { await rpc('admin_update_fundraiser', { _id: id, _patch: edit }); toast({ title: 'Saved' }); setEdit(null); qc.invalidateQueries({ queryKey: ['adm-fr-detail', id] }); qc.invalidateQueries({ queryKey: ['adm-fr'] }); }
    catch (e) { toast({ title: 'Save failed', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(false);
  };

  const hardDelete = async () => {
    setBusy(true);
    try { await rpc('admin_hard_delete_fundraiser', { _id: id, _confirm: typed }); toast({ title: 'Permanently deleted' }); setConfirm(null); onClose(); qc.invalidateQueries({ queryKey: ['adm-fr'] }); }
    catch (e) { toast({ title: 'Delete refused', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(false);
  };

  const List = ({ rows, render, empty }: { rows: any[]; render: (r: any) => React.ReactNode; empty: string }) =>
    rows.length ? <ul className="divide-y divide-border text-sm">{rows.map((r) => <li key={r.id} className="py-2">{render(r)}</li>)}</ul> : <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {!f ? <p className="p-6 text-sm text-muted-foreground">{d.error ? (d.error as Error).message : 'Loading…'}</p> : (
          <>
            <SheetHeader>
              <SheetTitle className="pr-6 text-left font-serif text-2xl font-normal">{f.title}</SheetTitle>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><StatusBadge value={f.status} /><span>Created {fmtDate(f.created_at)}</span>
                {f.unique_slug && <a href={`/f/${f.unique_slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary">Public page <ExternalLink className="h-3 w-3" /></a>}</div>
            </SheetHeader>

            {canWrite && (
              <div className="mt-4 flex flex-wrap gap-2">
                {f.status === 'pending' && <Button size="sm" disabled={busy} onClick={() => act('approve')}>Approve</Button>}
                {['pending', 'active', 'paused'].includes(f.status) && <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirm('reject')}>Reject…</Button>}
                {f.status === 'active' && <Button size="sm" variant="outline" disabled={busy} onClick={() => act('pause')}>Pause</Button>}
                {['paused', 'rejected'].includes(f.status) && <Button size="sm" variant="outline" disabled={busy} onClick={() => act('resume')}>Make active</Button>}
                {f.status !== 'archived' ? <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirm('archive')}>Archive</Button> : <Button size="sm" variant="outline" disabled={busy} onClick={() => act('restore')}>Restore (as paused)</Button>}
                <Button size="sm" variant="outline" onClick={() => setEdit({ title: f.title, story: f.story, category: f.category, monthly_goal: f.monthly_goal, country: f.country ?? '', zip_code: f.zip_code ?? '' })}>Edit</Button>
                <Button size="sm" variant="outline" onClick={() => setTab('images')}><Images className="mr-1.5 h-4 w-4" />Photos</Button>
                {isAdmin && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setTyped(''); setConfirm('delete'); }}>Delete permanently…</Button>}
              </div>
            )}

            <Tabs value={tab} onValueChange={setTab} className="mt-5">
              <TabsList className="flex h-auto flex-wrap justify-start">
                {['overview', 'images', 'donations', 'updates', 'comments', 'team', 'conversations', 'reports', ...(isAdmin ? ['history'] : [])].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>)}
              </TabsList>
              <TabsContent value="images"><FundraiserImagesTab fundraiser={f} canWrite={canWrite} /></TabsContent>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-3 gap-3 tabular-nums">
                  {[['Raised (completed)', usd(d.data?.totals?.total_raised)], ['Donations', d.data?.totals?.donations_count ?? 0], ['Goal', usd(f.monthly_goal)]].map(([l, v]) => (
                    <div key={l as string} className="rounded-md bg-muted/50 p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-lg font-semibold">{v}</p></div>))}
                </div>
                <p className="text-xs text-muted-foreground">Stored counters (not used publicly): {usd(f.amount_raised)} / {f.donors_count ?? 0} donors.</p>
                {f.rejection_reason && <p className="rounded-md bg-destructive/5 p-3 text-sm"><span className="font-medium">Rejection reason:</span> {f.rejection_reason}</p>}
                {canWrite && (
                  <div className="flex items-end gap-2">
                    <div><Label className="text-xs">Feature order (blank = not featured)</Label>
                      <Input type="number" min={1} className="h-9 w-40" defaultValue={f.featured_order ?? ''} id="feat" /></div>
                    <Button size="sm" variant="outline" onClick={() => { const v = (document.getElementById('feat') as HTMLInputElement).value; act('feature', { _order: v ? Number(v) : null }); }}>Save</Button>
                  </div>
                )}
                <p className="whitespace-pre-wrap text-sm text-foreground/80">{f.story?.slice(0, 1500)}</p>
              </TabsContent>
              <TabsContent value="donations"><List rows={d.data!.dons} empty="No donations linked to this fundraiser." render={(r) => <div className="flex justify-between gap-2"><span>{r.is_anonymous ? 'Anonymous' : r.donor_name || 'Guest'} · <StatusBadge value={r.status} /></span><span className="tabular-nums">{usd(r.amount)} · {fmtDate(r.created_at)}</span></div>} /></TabsContent>
              <TabsContent value="updates"><List rows={d.data!.upd} empty="No updates posted." render={(r) => <div className="flex justify-between"><span>{r.title}</span><span className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</span></div>} /></TabsContent>
              <TabsContent value="comments"><List rows={d.data!.com} empty="No comments." render={(r) => <div><p className="text-xs text-muted-foreground">{r.display_name} · {fmtDate(r.created_at)} {r.is_hidden && '· hidden'}</p><p>{r.body}</p></div>} /></TabsContent>
              <TabsContent value="team"><List rows={d.data!.team} empty="No team members." render={(r) => <div className="flex justify-between"><span className="capitalize">{r.role}{r.invite_email ? ` · invited` : ''}</span><StatusBadge value={r.status} /></div>} /></TabsContent>
              <TabsContent value="conversations">
                <p className="mb-2 text-xs text-muted-foreground">Metadata only. Message bodies are admin-only and every view is recorded in the audit log.</p>
                <List rows={d.data!.conv} empty="No conversations." render={(r) => <ConversationRow c={r} canView={isAdmin} />} />
              </TabsContent>
              <TabsContent value="reports"><List rows={d.data!.rep} empty="No reports." render={(r) => <div className="flex justify-between"><span>{r.reason} · {r.target_type}</span><StatusBadge value={r.status} /></div>} /></TabsContent>
              <TabsContent value="history"><List rows={d.data!.audit} empty="No admin changes recorded yet." render={(r) => <div className="flex justify-between"><span>{r.action}</span><span className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</span></div>} /></TabsContent>
            </Tabs>

            {edit && (
              <div className="mt-6 space-y-3 rounded-md border border-border p-4">
                <p className="text-sm font-medium">Edit details</p>
                {(['title', 'category', 'monthly_goal', 'country', 'zip_code'] as const).map((k) => (
                  <div key={k}><Label className="text-xs capitalize">{k.replace('_', ' ')}</Label><Input value={edit[k]} list={k === 'category' ? 'fundraiser-categories' : undefined} type={k === 'monthly_goal' ? 'number' : 'text'} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></div>))}
                <datalist id="fundraiser-categories">{['food', 'health', 'healthcare', 'utilities', 'transportation', 'emergency', 'essentials', 'education', 'clothing'].map((c) => <option key={c} value={c} />)}</datalist>
                <div><Label className="text-xs">Story</Label><Textarea rows={8} value={edit.story} onChange={(e) => setEdit({ ...edit, story: e.target.value })} /></div>
                <div className="flex gap-2"><Button size="sm" disabled={busy} onClick={saveEdit}>Save changes</Button><Button size="sm" variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></div>
              </div>
            )}

            <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{confirm === 'reject' ? 'Reject fundraiser' : confirm === 'archive' ? 'Archive fundraiser' : 'Permanently delete'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {confirm === 'reject' && 'The organizer will be emailed this reason. The page is hidden from the public.'}
                    {confirm === 'archive' && 'Hidden from the public site. All donation and coupon records are preserved. You can restore it later.'}
                    {confirm === 'delete' && `Only allowed when there are zero donations and zero coupons. Images, team, comments, updates and conversations are destroyed. Type "${f.unique_slug ?? f.id}" to confirm.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {confirm === 'reject' && <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required)" maxLength={1000} />}
                {confirm === 'delete' && <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={f.unique_slug ?? f.id} />}
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={busy || (confirm === 'reject' && !reason.trim()) || (confirm === 'delete' && typed !== (f.unique_slug ?? f.id))}
                    onClick={(e) => { e.preventDefault(); confirm === 'reject' ? act('reject', { _reason: reason }) : confirm === 'archive' ? act('archive') : hardDelete(); }}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ConversationRow({ c, canView }: { c: any; canView: boolean }) {
  const [msgs, setMsgs] = useState<any[] | null>(null);
  return (
    <div>
      <div className="flex justify-between"><span><StatusBadge value={c.status} /> · last message {fmtDate(c.last_message_at)}</span>
        {canView && !msgs && <button className="text-xs text-primary" onClick={async () => { try { setMsgs(await rpc('admin_view_conversation', { _cid: c.id })); } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }); } }}>View messages (audited)</button>}</div>
      {msgs && <ul className="mt-2 space-y-1 rounded bg-muted/40 p-2 text-xs">{msgs.map((m) => <li key={m.id}><span className="text-muted-foreground">{fmtDate(m.created_at)}:</span> {m.body}</li>)}</ul>}
    </div>
  );
}
