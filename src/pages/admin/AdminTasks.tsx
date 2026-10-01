import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { sb, rpc, fmtDate } from '@/lib/adminApi';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import { Plus, LayoutList, Columns3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUSES = ['todo', 'in_progress', 'blocked', 'done'] as const;
const PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const;
const PAGE = 50;
const LINKS: Record<string, (id: string) => string> = {
  fundraiser: (id) => `/admin/fundraisers?id=${id}`, donation: (id) => `/admin/donations?id=${id}`, report: () => '/admin/moderation',
  application: () => '/admin/verifications', verification: () => '/admin/verifications', donor: (id) => `/admin/donors?q=${id}`,
};
const today = () => new Date().toISOString().slice(0, 10);
const isOverdue = (t: any) => t.status !== 'done' && t.due_date && t.due_date < today();

export default function AdminTasks() {
  const { user } = useAuth();
  const { canWrite } = useTeamRole();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<'list' | 'board'>('list');
  const [scope, setScope] = useState<'open' | 'mine' | 'overdue' | 'all'>('open');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<any>(null);

  const team = useQuery({ queryKey: ['adm-team'], queryFn: () => rpc<any[]>('admin_list_team') });
  const name = (uid?: string | null) => { const m = team.data?.find((t) => t.user_id === uid); return m ? (m.full_name || m.email) : uid ? 'Unknown' : 'Unassigned'; };

  const q = useQuery({
    queryKey: ['adm-tasks', scope, page, view],
    queryFn: async () => {
      let b = sb.from('admin_tasks').select('*', { count: 'exact' });
      if (scope === 'open') b = b.neq('status', 'done');
      if (scope === 'mine') b = b.eq('assignee_id', user!.id).neq('status', 'done');
      if (scope === 'overdue') b = b.neq('status', 'done').lt('due_date', today());
      const { data, error, count } = await b.order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false })
        .range(view === 'board' ? 0 : page * PAGE, view === 'board' ? 299 : page * PAGE + PAGE - 1);
      if (error) throw error;
      const rank = (p: string) => PRIORITIES.indexOf(p as any);
      return { rows: (data ?? []).sort((a: any, b: any) => rank(a.priority) - rank(b.priority)), total: count ?? 0 };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['adm-tasks'] });

  const save = async () => {
    const t = editing;
    if (!t.title?.trim()) return toast({ title: 'Title is required', variant: 'destructive' });
    const row = { title: t.title.trim().slice(0, 200), description: t.description || null, priority: t.priority, status: t.status, due_date: t.due_date || null, assignee_id: t.assignee_id || null,
      linked_type: t.linked_type || null, linked_id: t.linked_id || null, completed_at: t.status === 'done' ? (t.completed_at ?? new Date().toISOString()) : null };
    const { error } = t.id ? await sb.from('admin_tasks').update(row).eq('id', t.id) : await sb.from('admin_tasks').insert({ ...row, created_by: user!.id });
    if (error) return toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    toast({ title: t.id ? 'Task updated' : 'Task created' }); setEditing(null); refresh();
  };
  const move = async (t: any, status: string) => {
    const { error } = await sb.from('admin_tasks').update({ status, completed_at: status === 'done' ? new Date().toISOString() : null }).eq('id', t.id);
    if (error) toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); else refresh();
  };

  const cols: Column<any>[] = [
    { key: 'title', header: 'Task', cell: (r) => <div className="max-w-[380px]"><p className="truncate font-medium text-foreground">{r.title}</p>{r.linked_type && <p className="text-xs capitalize text-muted-foreground">{r.linked_type}{r.source_key ? ' · auto' : ''}</p>}</div> },
    { key: 'priority', header: 'Priority', cell: (r) => <StatusBadge value={r.priority} /> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge value={r.status} /> },
    { key: 'assignee', header: 'Assignee', cell: (r) => <span className="text-xs">{name(r.assignee_id)}</span> },
    { key: 'due', header: 'Due', cell: (r) => <span className={cn(isOverdue(r) && 'font-medium text-destructive')}>{r.due_date ?? '—'}{isOverdue(r) && ' · overdue'}</span> },
  ];

  const openTask = (t: any) => setEditing({ ...t });

  return (
    <DashboardLayout>
      <PageHeader title="Tasks" description="Assign and track operational work. Reports, applications and fundraisers awaiting approval create tasks automatically."
        actions={<>
          <div className="flex rounded-md bg-muted p-1">
            <button aria-label="List view" onClick={() => setView('list')} className={cn('rounded px-2 py-1', view === 'list' && 'bg-background shadow-sm')}><LayoutList className="h-4 w-4" /></button>
            <button aria-label="Board view" onClick={() => setView('board')} className={cn('rounded px-2 py-1', view === 'board' && 'bg-background shadow-sm')}><Columns3 className="h-4 w-4" /></button>
          </div>
          {canWrite && <Button size="sm" onClick={() => setEditing({ title: '', priority: 'medium', status: 'todo' })}><Plus className="mr-1.5 h-4 w-4" />New task</Button>}
        </>} />
      <div className="mb-3 flex gap-1 rounded-md bg-muted p-1 text-xs w-fit">
        {(['open', 'mine', 'overdue', 'all'] as const).map((s) => <button key={s} onClick={() => { setScope(s); setPage(0); }} className={cn('rounded px-2.5 py-1 capitalize', scope === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>{s === 'mine' ? 'My tasks' : s}</button>)}
      </div>

      {view === 'list' ? (
        <DataTable columns={cols} rows={q.data?.rows} total={q.data?.total} loading={q.isLoading} error={q.error ? (q.error as Error).message : null} onRetry={() => q.refetch()}
          page={page} pageSize={PAGE} onPage={setPage} rowKey={(r) => r.id} onRowClick={openTask} empty="No tasks here." rowClassName={(r) => isOverdue(r) ? 'bg-destructive/5' : undefined} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((s) => {
            const items = (q.data?.rows ?? []).filter((t: any) => t.status === s);
            return (
              <div key={s} className="rounded-lg bg-muted/50 p-2" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData('text'); const t = q.data?.rows.find((x: any) => x.id === id); if (t && canWrite && t.status !== s) move(t, s); }}>
                <p className="mb-2 flex justify-between px-1 text-xs font-medium capitalize text-muted-foreground">{s.replace('_', ' ')}<span>{items.length}</span></p>
                <div className="space-y-2">
                  {items.map((t: any) => (
                    <button key={t.id} draggable={canWrite} onDragStart={(e) => e.dataTransfer.setData('text', t.id)} onClick={() => openTask(t)}
                      className={cn('block w-full rounded-md bg-background p-2.5 text-left text-sm shadow-sm', isOverdue(t) && 'ring-1 ring-destructive/40')}>
                      <p className="font-medium text-foreground">{t.title}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground"><StatusBadge value={t.priority} /><span className="truncate">{name(t.assignee_id)}</span>{t.due_date && <span className={cn('ml-auto', isOverdue(t) && 'text-destructive')}>{t.due_date}</span>}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {editing && (
            <div className="space-y-3">
              <SheetHeader><SheetTitle className="text-left">{editing.id ? 'Task' : 'New task'}</SheetTitle></SheetHeader>
              <div><Label className="text-xs">Title</Label><Input disabled={!canWrite} value={editing.title} maxLength={200} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label className="text-xs">Description</Label><Textarea disabled={!canWrite} rows={4} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Priority</Label><Select disabled={!canWrite} value={editing.priority} onValueChange={(v) => setEditing({ ...editing, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Status</Label><Select disabled={!canWrite} value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p.replace('_', ' ')}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Assignee</Label><Select disabled={!canWrite} value={editing.assignee_id ?? 'none'} onValueChange={(v) => setEditing({ ...editing, assignee_id: v === 'none' ? null : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{(team.data ?? []).map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || m.email}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Due date</Label><Input disabled={!canWrite} type="date" value={editing.due_date ?? ''} onChange={(e) => setEditing({ ...editing, due_date: e.target.value })} /></div>
                <div><Label className="text-xs">Linked to</Label><Select disabled={!canWrite} value={editing.linked_type ?? 'none'} onValueChange={(v) => setEditing({ ...editing, linked_type: v === 'none' ? null : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Nothing</SelectItem>{Object.keys(LINKS).map((k) => <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Record ID / email</Label><Input disabled={!canWrite || !editing.linked_type} value={editing.linked_id ?? ''} onChange={(e) => setEditing({ ...editing, linked_id: e.target.value })} /></div>
              </div>
              {editing.linked_type && editing.linked_id && <a className="text-sm text-primary" href={LINKS[editing.linked_type]?.(editing.linked_id)}>Open linked record</a>}
              {canWrite && <div className="flex gap-2"><Button size="sm" onClick={save}>Save</Button><Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div>}
              {editing.id && <TaskComments taskId={editing.id} canWrite={canWrite} name={name} />}
              {editing.created_at && <p className="text-xs text-muted-foreground">Created {fmtDate(editing.created_at)}{editing.source_key ? ' automatically' : ''}</p>}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

function TaskComments({ taskId, canWrite, name }: { taskId: string; canWrite: boolean; name: (u?: string) => string }) {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const q = useQuery({ queryKey: ['adm-task-c', taskId], queryFn: async () => (await sb.from('admin_task_comments').select('*').eq('task_id', taskId).order('created_at')).data ?? [] });
  const add = async () => {
    if (!body.trim()) return;
    const { error } = await sb.from('admin_task_comments').insert({ task_id: taskId, author_id: user!.id, body: body.trim().slice(0, 4000) });
    if (error) return toast({ title: 'Comment failed', description: error.message, variant: 'destructive' });
    setBody(''); q.refetch();
  };
  return (
    <div className="border-t border-border pt-3">
      <p className="mb-2 text-sm font-medium">Comments</p>
      <ul className="mb-2 space-y-2 text-sm">{(q.data ?? []).map((c: any) => <li key={c.id}><p className="text-xs text-muted-foreground">{name(c.author_id)} · {fmtDate(c.created_at)}</p><p className="whitespace-pre-wrap">{c.body}</p></li>)}</ul>
      {canWrite && <div className="flex gap-2"><Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a comment" onKeyDown={(e) => e.key === 'Enter' && add()} /><Button size="sm" variant="outline" onClick={add}>Add</Button></div>}
    </div>
  );
}
