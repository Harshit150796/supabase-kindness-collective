import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { adminWrite, fmtDate } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useQueryClient } from '@tanstack/react-query';
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

  const cols: Column<any>[] = [
    { key: 'submitted_at', header: 'Submitted', sortable: true, cell: (r) => fmtDate(r.submitted_at) },
    { key: 'user_id', header: 'User', cell: (r) => <span className="font-mono text-xs">{r.user_id.slice(0, 8)}…</span> },
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
            <SheetHeader><SheetTitle className="text-left font-serif text-2xl font-normal">Verification</SheetTitle></SheetHeader>
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
