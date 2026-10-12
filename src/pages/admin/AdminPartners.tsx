import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { RecordWork } from '@/components/admin/RecordWork';
import { fmtDate } from '@/lib/adminApi';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { Input } from '@/components/ui/input';

export default function AdminPartners() {
  const [open, setOpen] = useState<any>(null);
  const t = useAdminPaged({ table: 'partner_inquiries', searchCols: ['org_name', 'contact_name', 'email', 'city_state'], defaultSort: { key: 'created_at', dir: 'desc' } });
  const cols: Column<any>[] = [
    { key: 'org_name', header: 'Organization', sortable: true, cell: (r) => <div><p className="font-medium">{r.org_name}</p><p className="text-xs text-muted-foreground">{r.org_type}</p></div> },
    { key: 'contact_name', header: 'Contact', cell: (r) => <div><p>{r.contact_name}</p><a className="text-xs text-primary" href={`mailto:${r.email}`}>{r.email}</a></div> },
    { key: 'city_state', header: 'Location', cell: (r) => r.city_state ?? '—' },
    { key: 'families_count', header: 'Families', align: 'right', sortable: true, cell: (r) => r.families_count ?? '—' },
    { key: 'message', header: 'Message', cell: (r) => <p className="line-clamp-2 max-w-sm text-sm">{r.message ?? '—'}</p> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge value={r.status} /> },
    { key: 'created_at', header: 'Received', sortable: true, cell: (r) => fmtDate(r.created_at) },
  ];
  return (
    <DashboardLayout>
      <PageHeader title="Partner inquiries" description="Organizations asking to run campaigns. Each new inquiry creates a task and an email alert." />
      <Input placeholder="Search inquiries" value={t.search} onChange={(e) => t.setSearch(e.target.value)} className="mb-4 max-w-sm" />
      <DataTable columns={cols} {...t.tableProps} onRowClick={(r: any) => setOpen(r)} rowKey={(r) => r.id} empty="No partner inquiries yet." />
      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}><SheetContent className="w-full overflow-y-auto sm:max-w-xl">{open && <><SheetHeader><SheetTitle>{open.org_name}</SheetTitle></SheetHeader><p className="my-3 text-sm">{open.contact_name} · <a className="text-primary" href={`mailto:${open.email}`}>{open.email}</a></p><p className="whitespace-pre-wrap text-sm">{open.message}</p><RecordWork key={open.id} type="partner" recordKey={open.id} title={open.org_name} /></>}</SheetContent></Sheet>
    </DashboardLayout>
  );
}
