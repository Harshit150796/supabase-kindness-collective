import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { adminWrite, fmtDate, sb } from '@/lib/adminApi';
import { FundraiserChip, useFundraiserPhotos } from '@/components/admin/fundraisers/FundraiserChip';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';

export default function AdminVerifications() {
  const qc = useQueryClient();
  const { canWrite } = useTeamRole();
  const [status, setStatus] = useState('pending');
  const t = useAdminPaged({ table: 'recipient_verifications', defaultSort: { key: 'submitted_at', dir: 'desc' }, filter: (b) => (status === 'all' ? b : b.eq('status', status)), deps: [status] });
  const [open, setOpen] = useState<any | null>(null);
  const [notes, setNotes] = useState('');

  const review = async (s: 'approved' | 'rejected') => {
    try {
      await adminWrite('recipient_verifications', 'update', [open.id], { status: s, notes: notes || null, reviewed_at: new Date().toISOString() });
      toast({ title: `Verification ${s}` });
      setOpen(null); qc.invalidateQueries({ queryKey: ['adm-paged', 'recipient_verifications'] });
    } catch (e) { toast({ title: 'Could not save', description: (e as Error).message, variant: 'destructive' }); }
  };

  // Who each person is (name and email) instead of an ID, looked up for this page in one query.
  const ids = [...new Set((t.rows ?? []).map((r: any) => r.user_id as string))].sort();
  const people = useQuery({ queryKey: ['adm-verif-people', ids], enabled: ids.length > 0, queryFn: async () => {
    const { data, error } = await sb.from('profiles').select('user_id,full_name,email').in('user_id', ids);
    if (error) throw error;
    return new Map<string, { full_name: string | null; email: string | null }>((data ?? []).map((p: any) => [p.user_id as string, p]));
  } });
  const person = (id: string) => people.data?.get(id);
  // Their fundraisers, shown in the review panel with photos.
  const theirs = useQuery({ queryKey: ['adm-verif-fr', open?.user_id], enabled: !!open?.user_id, queryFn: async () => {
    const { data, error } = await sb.from('fundraisers').select('id,title,status,created_at').eq('user_id', open.user_id).order('created_at', { ascending: false }).limit(10);
    if (error) throw error;
    return (data ?? []) as Array<{ id: string; title: string; status: string }>;
  } });
  const photos = useFundraiserPhotos((theirs.data ?? []).map((f) => f.id));
  const cols: Column<any>[] = [
    { key: 'submitted_at', header: 'Submitted', sortable: true, cell: (r) => fmtDate(r.submitted_at) },
    { key: 'user_id', header: 'Person', cell: (r) => <div className="max-w-[240px]"><p className="truncate text-foreground">{person(r.user_id)?.full_name || 'No name'}</p><p className="truncate text-xs text-muted-foreground">{person(r.user_id)?.email || `${r.user_id.slice(0, 8)}…`}</p></div> },
    { key: 'verification_type', header: 'Type', sortable: true, cell: (r) => r.verification_type || 'Standard' },
    { key: 'status', header: 'Status', sortable: true, cell: (r) => <StatusBadge value={r.status} /> },
    { key: 'notes', header: 'Notes', cell: (r) => <span className="line-clamp-1 max-w-[260px] text-xs">{r.notes || '—'}</span> },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Verifications" description="Review recipient verification submissions." />
      <div className="mb-3"><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger><SelectContent>{['pending', 'approved', 'rejected', 'all'].map((s) => <SelectItem key={s} value={s} className="capitalize">{s === 'all' ? 'All statuses' : s}</SelectItem>)}</SelectContent></Select></div>
      <DataTable columns={cols} {...t.tableProps} rowKey={(r: any) => r.id} onRowClick={(r) => { setOpen(r); setNotes(r.notes ?? ''); }} empty="No verifications in this view." />
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && <div className="space-y-4 text-sm">
            <SheetHeader><SheetTitle className="text-left font-serif text-2xl font-normal">{person(open.user_id)?.full_name || 'Verification'}</SheetTitle>
              {person(open.user_id)?.email && <a className="text-left text-sm text-primary" href={`mailto:${person(open.user_id)?.email}`}>{person(open.user_id)?.email}</a>}</SheetHeader>
            <div><p className="mb-1.5 text-xs text-muted-foreground">Their fundraisers</p>
              {theirs.isLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : !theirs.data?.length ? <p className="text-sm text-muted-foreground">No fundraisers yet.</p> : (
                <ul className="space-y-1.5">{theirs.data.map((f) => <li key={f.id} className="flex items-center justify-between gap-2"><FundraiserChip id={f.id} title={f.title} photos={photos.data} size={36} /><StatusBadge value={f.status} /></li>)}</ul>
              )}</div>
            <dl className="grid grid-cols-2 gap-3">
              {[['Status', <StatusBadge key="s" value={open.status} />], ['Type', open.verification_type || 'Standard'], ['User ID', open.user_id], ['Submitted', fmtDate(open.submitted_at)],
                ['Household size', open.household_size ?? '—'], ['Organization', open.organization_name ?? '—'], ['Reviewed', fmtDate(open.reviewed_at)]].map(([k, v]) => (
                <div key={k as string}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="break-all">{v}</dd></div>))}
            </dl>
            {canWrite && <>
              <Textarea placeholder="Review notes (optional)" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="flex gap-2"><Button className="flex-1" onClick={() => review('approved')}><Check className="mr-1.5 h-4 w-4" />Approve</Button><Button variant="destructive" className="flex-1" onClick={() => review('rejected')}><X className="mr-1.5 h-4 w-4" />Reject</Button></div>
            </>}
          </div>}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
