import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Eye, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { ReasonDialog } from '@/components/admin/ReasonDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { rpc, fmtDate } from '@/lib/adminApi';
import { toast } from '@/hooks/use-toast';

type Person = { user_id: string; name: string | null; email: string | null; username: string | null; restrictions?: string[] } | null;
type Row = {
  id: string; status: string; created_at: string; last_message_at: string; removed_at: string | null; removed_reason: string | null;
  fundraiser: { id: string; title: string; unique_slug: string | null }; supporter: Person; organizer: Person;
  message_count: number; flagged_count: number; removed_count: number;
};
type Msg = { id: string; sender: Person; side: string; body: string; status: string; flags: string[]; created_at: string; removed_reason: string | null; ref_label: string | null };
type Thread = Omit<Row, 'message_count' | 'flagged_count' | 'removed_count' | 'last_message_at'> & { messages: Msg[] };

const who = (p: Person) => p ? (p.name || p.username || p.email || 'Unknown') : 'Unknown';
function PersonCell({ p, label }: { p: Person; label: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-medium">{who(p)}</p>
      {p?.email && <p className="truncate text-xs text-muted-foreground">{p.email}</p>}
      {p?.restrictions?.includes('messaging') && <Badge variant="destructive" className="mt-1">Messaging off</Badge>}
    </div>
  );
}

type Pending = { kind: 'conversation' | 'message' | 'restrict'; id: string; person?: Person } | null;

/**
 * Every supporter-organizer conversation, who is in it, and (on request, audited) what was said.
 * Admins can remove a conversation or a single message (hidden from both people; a sealed copy is
 * kept for one year, then deleted) and turn messaging off for a person.
 */
export default function AdminMessages() {
  const { isAdmin } = useTeamRole();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'all';
  const search = params.get('q') || '';
  const user = params.get('user');
  const page = Math.max(0, Number(params.get('page')) || 0);
  const [thread, setThread] = useState<Thread | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const set = (key: string, value: string | null) => setParams((p) => { if (value) p.set(key, value); else p.delete(key); if (key !== 'page') p.delete('page'); return p; });

  const q = useQuery({
    queryKey: ['adm-messages', status, search, page, user], enabled: isAdmin,
    queryFn: () => rpc<{ rows: Row[]; total: number }>('admin_list_conversations', { _search: search, _status: status, _limit: 25, _offset: page * 25, _user: user }),
  });

  const open = async (cid: string) => {
    setOpening(cid);
    try { setThread(await rpc<Thread>('admin_conversation_thread', { _cid: cid })); }
    catch (e) { toast({ title: 'Could not open the conversation', description: (e as Error).message, variant: 'destructive' }); }
    finally { setOpening(null); }
  };
  // Links from Moderation open a conversation directly (?cid=…).
  useEffect(() => { const cid = params.get('cid'); if (cid && isAdmin) { open(cid); set('cid', null); } }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = async () => { await q.refetch(); if (thread) setThread(await rpc<Thread>('admin_conversation_thread', { _cid: thread.id })); };
  const run = async (fn: string, args: Record<string, unknown>, done: string) => {
    try { await rpc(fn, args); toast({ title: done }); setPending(null); await refresh(); }
    catch (e) { toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' }); }
  };
  const confirmPending = async (reason: string) => {
    if (!pending) return;
    if (pending.kind === 'conversation') await run('admin_remove_conversation', { _cid: pending.id, _reason: reason }, 'Conversation removed for both people');
    if (pending.kind === 'message') await run('admin_remove_message', { _mid: pending.id, _reason: reason }, 'Message removed');
    if (pending.kind === 'restrict' && pending.person) {
      const now = new Set(pending.person.restrictions ?? []); now.add('messaging');
      await run('admin_set_restrictions', { _uid: pending.person.user_id, _restrictions: [...now], _reason: reason }, `Messaging turned off for ${who(pending.person)}`);
    }
  };
  const allowMessaging = (p: Person) => p && run('admin_set_restrictions', { _uid: p.user_id, _restrictions: (p.restrictions ?? []).filter((r) => r !== 'messaging'), _reason: 'Messaging turned back on' }, `Messaging turned back on for ${who(p)}`);

  const cols: Column<Row>[] = [
    { key: 'when', header: 'Last message', cell: (r) => <span className="whitespace-nowrap">{fmtDate(r.last_message_at)}</span> },
    { key: 'between', header: 'Who messaged whom', cell: (r) => (
      <div className="grid max-w-xl grid-cols-[1fr_auto_1fr] items-start gap-2">
        <PersonCell p={r.supporter} label="Supporter" /><ArrowRight className="mt-5 h-4 w-4 text-muted-foreground" aria-label="and" /><PersonCell p={r.organizer} label="Organizer" />
        <Link className="col-span-3 truncate text-xs text-primary" to={`/admin/fundraisers?id=${r.fundraiser.id}`}>{r.fundraiser.title}</Link>
      </div>
    ) },
    { key: 'count', header: 'Messages', cell: (r) => (
      <div className="flex flex-wrap gap-1"><span>{r.message_count}</span>
        {r.flagged_count > 0 && <Badge variant="secondary">{r.flagged_count} redacted</Badge>}
        {r.removed_count > 0 && <Badge variant="outline">{r.removed_count} removed</Badge>}</div>
    ) },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge value={r.status} /> },
    { key: 'open', header: '', cell: (r) => <Button size="sm" variant="outline" onClick={() => open(r.id)} disabled={opening === r.id}>{opening === r.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Eye className="mr-1 h-3.5 w-3.5" />}Read</Button> },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Messages" description="Every conversation between supporters and organizers. Opening one is recorded in the audit log." />
      {!isAdmin ? <p className="text-sm text-muted-foreground">Administrator access is required to read messages.</p> : <>
        <div className="mb-3 flex flex-wrap gap-2">
          <Input className="max-w-sm" aria-label="Search conversations" placeholder="Name, email, @username or fundraiser" value={search} onChange={(e) => set('q', e.target.value)} />
          <Select value={status} onValueChange={(v) => set('status', v)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{[['all', 'All conversations'], ['open', 'Open'], ['flagged', 'With redacted messages'], ['blocked', 'Closed by organizer'], ['removed', 'Removed by team']].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
          {user && <Button variant="ghost" onClick={() => set('user', null)}>Clear person filter</Button>}
        </div>
        <DataTable columns={cols} rows={q.data?.rows} total={q.data?.total} loading={q.isLoading} error={q.error ? (q.error as Error).message : null} onRetry={() => q.refetch()}
          page={page} pageSize={25} onPage={(p) => set('page', String(p))} rowKey={(r) => r.id} empty="No conversations match this view." />
      </>}

      <Dialog open={!!thread} onOpenChange={(o) => !o && setThread(null)}>
        <DialogContent className="flex max-h-[90dvh] max-w-3xl flex-col overflow-hidden">
          {thread && <>
            <DialogHeader>
              <DialogTitle>Conversation · audited view</DialogTitle>
              <DialogDescription>About <Link className="text-primary" to={`/admin/fundraisers?id=${thread.fundraiser.id}`}>{thread.fundraiser.title}</Link>. Started {fmtDate(thread.created_at)}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 rounded-md bg-muted/50 p-3 sm:grid-cols-2">
              {([['Supporter', thread.supporter], ['Organizer', thread.organizer]] as const).map(([label, p]) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <PersonCell p={p} label={label} />
                  {p && (p.restrictions?.includes('messaging')
                    ? <Button size="sm" variant="outline" onClick={() => allowMessaging(p)}>Allow messaging</Button>
                    : <Button size="sm" variant="outline" onClick={() => setPending({ kind: 'restrict', id: p.user_id, person: p })}>Turn off messaging</Button>)}
                </div>
              ))}
            </div>
            {thread.status === 'removed' && <p className="rounded-md bg-destructive/10 p-3 text-sm">Removed {fmtDate(thread.removed_at)}: {thread.removed_reason}. Neither person can see it. This sealed copy is deleted a year after removal.</p>}
            <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto pr-1">
              {thread.messages.map((m) => (
                <li key={m.id} className={`py-3 ${m.status === 'removed' ? 'opacity-60' : ''}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm"><span className="font-medium">{who(m.sender)}</span> <span className="text-muted-foreground">({m.side}) · {fmtDate(m.created_at)}</span></p>
                    <div className="flex gap-1">
                      {m.status === 'redacted' && <Badge variant="secondary">Contact details removed</Badge>}
                      {m.status === 'removed'
                        ? <Button size="sm" variant="ghost" onClick={() => run('admin_restore_message', { _mid: m.id }, 'Message restored')}>Restore</Button>
                        : <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setPending({ kind: 'message', id: m.id })}>Remove</Button>}
                    </div>
                  </div>
                  {m.ref_label && <p className="text-xs text-muted-foreground">About: {m.ref_label}</p>}
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">{m.body}</p>
                  {m.status === 'removed' && <p className="mt-1 text-xs text-destructive">Removed: {m.removed_reason}</p>}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
              {thread.status === 'removed'
                ? <Button variant="outline" onClick={() => run('admin_restore_conversation', { _cid: thread.id }, 'Conversation restored')}>Restore conversation</Button>
                : <Button variant="destructive" onClick={() => setPending({ kind: 'conversation', id: thread.id })}>Remove conversation</Button>}
            </div>
          </>}
        </DialogContent>
      </Dialog>

      <ReasonDialog open={!!pending}
        title={pending?.kind === 'conversation' ? 'Remove this conversation?' : pending?.kind === 'message' ? 'Remove this message?' : `Turn off messaging for ${who(pending?.person ?? null)}?`}
        description={pending?.kind === 'restrict' ? 'They won’t be able to send any message until you turn it back on.' : 'It disappears for both people right away. A sealed copy stays here for one year, then it’s deleted.'}
        confirm={pending?.kind === 'restrict' ? 'Turn off messaging' : 'Remove'}
        onCancel={() => setPending(null)} onConfirm={confirmPending} />
    </DashboardLayout>
  );
}
