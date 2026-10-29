import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { rpc, fmtDate } from '@/lib/adminApi';
import { toast } from '@/hooks/use-toast';

export default function AdminModeration() {
  const { isAdmin } = useTeamRole();
  const [params, setParams] = useSearchParams();
  const kind = params.get('kind') || 'reports';
  const status = params.get('status') || 'all';
  const search = params.get('q') || '';
  const page = Math.max(0, Number(params.get('page')) || 0);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<any[] | null>(null);
  const set = (key: string, value: string) => setParams((p) => { p.set(key, value); if (key !== 'page') p.delete('page'); return p; });
  const q = useQuery({ queryKey: ['adm-moderation', kind, status, search, page, params.get('fundraiser')], enabled: isAdmin,
    queryFn: () => rpc<{ rows: any[]; total: number }>('admin_moderation_list', { _kind: kind, _status: status, _search: search, _offset: page * 25, _limit: 25, _fundraiser: params.get('fundraiser') }) });
  const act = async (r: any, next: string) => {
    if (!window.confirm(`${next === 'reviewing' ? 'Start reviewing' : next === 'reviewed' ? 'Mark reviewed' : next === 'resolved' ? 'Resolve' : 'Dismiss'} this ${kind === 'reports' ? 'report' : 'attempt'}?`)) return;
    setBusy(true);
    try { await rpc('admin_moderation_action', { _kind: kind, _id: r.id, _status: next }); await q.refetch(); toast({ title: 'Review status saved' }); }
    catch (e) { toast({ title: 'Could not save review', description: (e as Error).message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const view = async (cid: string) => {
    setBusy(true);
    try { setMessages(await rpc<any[]>('admin_view_conversation', { _cid: cid })); }
    catch (e) { toast({ title: 'Could not view messages', description: (e as Error).message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const cols: Column<any>[] = [
    { key: 'date', header: 'When', cell: (r) => fmtDate(r.created_at) },
    { key: 'context', header: kind === 'reports' ? 'Report' : 'Context', cell: (r) => <div className="max-w-sm"><p className="font-medium">{r.reason || r.context || 'Redacted message'}</p><p className="whitespace-pre-wrap break-words text-xs text-muted-foreground">{r.details || r.masked_excerpt || r.flags?.join(', ')}</p>{r.fundraiser_id && <Link className="text-xs text-primary" to={`/admin/fundraisers?id=${r.fundraiser_id}`}>Open fundraiser</Link>}{r.target_type === 'profile' && <Link className="block text-xs text-primary" to={`/admin/profiles?uid=${r.target_id}`}>Open profile</Link>}{r.target_type === 'conversation' && <Link className="block text-xs text-primary" to={`/admin/messages?cid=${r.target_id}`}>Open conversation</Link>}</div> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge value={r.status} /> },
    { key: 'actions', header: 'Review', cell: (r) => <div className="flex flex-wrap gap-1">{kind === 'flagged' ? <Button size="sm" variant="outline" disabled={busy} onClick={() => view(r.conversation_id)}>View messages (audited)</Button> : kind === 'blocked' ? <Button size="sm" variant="outline" disabled={busy || r.status === 'reviewed'} onClick={() => act(r, 'reviewed')}>Mark reviewed</Button> : ['reviewing', 'resolved', 'dismissed'].map((s) => <Button key={s} size="sm" variant="outline" disabled={busy || r.status === s} onClick={() => act(r, s)}>{s === 'reviewing' ? 'Review' : s === 'resolved' ? 'Resolve' : 'Dismiss'}</Button>)}</div> },
  ];
  return <DashboardLayout><PageHeader title="Moderation" />
    {!isAdmin ? <p className="text-sm text-muted-foreground">Administrator access is required for moderation.</p> : <>
      <Tabs value={kind} onValueChange={(v) => set('kind', v)}><TabsList><TabsTrigger value="reports">Reports</TabsTrigger><TabsTrigger value="blocked">Blocked attempts</TabsTrigger><TabsTrigger value="flagged">Redacted messages</TabsTrigger></TabsList></Tabs>
      <div className="my-3 flex flex-wrap gap-2">{kind !== 'flagged' && <><Input className="max-w-sm" aria-label="Search reviews" placeholder="Search reviews" value={search} onChange={(e) => set('q', e.target.value)} /><Select value={status} onValueChange={(v) => set('status', v)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{(kind === 'reports' ? ['all', 'open', 'reviewing', 'resolved', 'dismissed'] : ['all', 'blocked', 'reviewed']).map((s) => <SelectItem key={s} value={s}>{s === 'all' ? 'All statuses' : s}</SelectItem>)}</SelectContent></Select></>}{params.get('fundraiser') && <Button size="sm" variant="ghost" onClick={() => setParams((p) => { p.delete('fundraiser'); return p; })}>Clear fundraiser filter</Button>}</div>
      <DataTable columns={cols} rows={q.data?.rows} total={q.data?.total} loading={q.isLoading} error={q.error ? (q.error as Error).message : null} onRetry={() => q.refetch()} page={page} pageSize={25} onPage={(p) => set('page', String(p))} rowKey={(r) => r.id} empty="No reviews match this view." />
    </>}
    <Dialog open={messages !== null} onOpenChange={(v) => !v && setMessages(null)}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Conversation · audited view</DialogTitle></DialogHeader><ul className="divide-y divide-border">{messages?.map((m) => <li key={m.id} className="py-3"><p className="text-xs text-muted-foreground">{fmtDate(m.created_at)}</p><p className="whitespace-pre-wrap break-words text-sm">{m.body}</p></li>)}</ul></DialogContent></Dialog>
  </DashboardLayout>;
}
