import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTeamRole } from '@/components/admin/AdminLayout';
import { sb, rpc, fmtDate } from '@/lib/adminApi';
import { DataTable, StatusBadge } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

export function RecordWork({ type, recordKey, title }: { type: string; recordKey: string; title: string }) {
  const { user } = useAuth();
  const { canWrite } = useTeamRole();
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [page, setPage] = useState(0);
  const [taskPage, setTaskPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [assignee, setAssignee] = useState('none');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);
  const team = useQuery({ queryKey: ['adm-team', user?.id], queryFn: () => rpc<any[]>('admin_list_team') });
  const author = (id: string) => team.data?.find((t) => t.user_id === id)?.full_name || 'Team member';
  const notes = useQuery({ queryKey: ['adm-notes', user?.id, type, recordKey, page], queryFn: async () => {
    const { data, count, error } = await sb.from('admin_record_notes').select('id,author_id,body,created_at', { count: 'exact' }).eq('record_type', type).eq('record_key', recordKey).order('created_at', { ascending: false }).range(page * 10, page * 10 + 9);
    if (error) throw error; return { rows: data ?? [], total: count ?? 0 };
  } });
  const tasks = useQuery({ queryKey: ['adm-record-tasks', user?.id, type, recordKey, taskPage], queryFn: async () => {
    const { data, count, error } = await sb.from('admin_tasks').select('id,title,status,assignee_id,due_date', { count: 'exact' }).eq('linked_type', type).eq('linked_id', recordKey).order('created_at', { ascending: false }).range(taskPage * 10, taskPage * 10 + 9);
    if (error) throw error; return { rows: data ?? [], total: count ?? 0 };
  } });
  const addNote = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try { await rpc('admin_add_record_note', { _type: type, _key: recordKey, _body: body.trim() }); setBody(''); await notes.refetch(); toast({ title: 'Private note added' }); }
    catch (e) { toast({ title: 'Could not add note', description: (e as Error).message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const addTask = async () => {
    setBusy(true);
    try { await rpc('admin_task_save', { _patch: { title: taskTitle.trim(), linked_type: type, linked_id: recordKey, assignee_id: assignee === 'none' ? null : assignee, due_date: due || null } }); setOpen(false); await tasks.refetch(); qc.invalidateQueries({ queryKey: ['adm-tasks'] }); toast({ title: 'Follow-up created' }); }
    catch (e) { toast({ title: 'Could not create follow-up', description: (e as Error).message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  return <div className="space-y-5 py-4">
    <section><div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-medium">Follow-ups</h3>{canWrite && <Button size="sm" variant="outline" onClick={() => { setTaskTitle(`Follow up: ${title}`.slice(0, 200)); setAssignee(user?.id ?? 'none'); setOpen(true); }}><Plus className="mr-1.5 h-4 w-4" />Follow-up</Button>}</div>
      <DataTable columns={[{ key: 'title', header: 'Work', cell: (r: any) => <Link className="text-primary" to={`/admin/tasks?id=${r.id}`}>{r.title}</Link> }, { key: 'status', header: 'Status', cell: (r: any) => <StatusBadge value={r.status} /> }, { key: 'due', header: 'Due', cell: (r: any) => r.due_date ?? '—' }]} rows={tasks.data?.rows} total={tasks.data?.total} loading={tasks.isLoading} error={tasks.error ? (tasks.error as Error).message : null} onRetry={() => tasks.refetch()} page={taskPage} pageSize={10} onPage={setTaskPage} rowKey={(r: any) => r.id} empty="No follow-ups yet." />
    </section>
    <section><h3 className="mb-3 text-sm font-medium">Private team notes</h3><DataTable columns={[{ key: 'note', header: 'Note', cell: (r: any) => <div className="max-w-md"><p className="whitespace-pre-wrap break-words">{r.body}</p><p className="mt-1 text-xs text-muted-foreground">{author(r.author_id)} · {fmtDate(r.created_at)}</p></div> }]} rows={notes.data?.rows} total={notes.data?.total} loading={notes.isLoading} error={notes.error ? (notes.error as Error).message : null} onRetry={() => notes.refetch()} page={page} pageSize={10} onPage={setPage} rowKey={(r: any) => r.id} empty="No team notes yet." />
      {canWrite && <div className="mt-3 space-y-2"><Textarea aria-label="Private team note" placeholder="Add a private team note" maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} /><Button size="sm" disabled={busy || !body.trim()} onClick={addNote}>Add note</Button></div>}
    </section>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Follow up on {title}</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Task</Label><Input maxLength={200} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} /></div><div><Label>Assigned to</Label><Select value={assignee} onValueChange={setAssignee}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{team.data?.map((t) => <SelectItem key={t.user_id} value={t.user_id}>{t.full_name || t.email}</SelectItem>)}</SelectContent></Select></div><div><Label>Due date</Label><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div></div><DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={busy || !taskTitle.trim()} onClick={addTask}>Create follow-up</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}