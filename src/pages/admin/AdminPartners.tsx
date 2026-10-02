import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { Input } from '@/components/ui/input';

export default function AdminPartners() {
  const t = useAdminPaged({ table: 'partner_inquiries', searchCols: ['org_name', 'contact_name', 'email', 'city_state'], defaultSort: { key: 'created_at', dir: 'desc' } });
  const cols: Column<any>[] = [
    { key: 'org_name', header: 'Organization', sortable: true, cell: (r) => <div><p className="font-medium">{r.org_name}</p><p className="text-xs text-muted-foreground">{r.org_type}</p></div> },
    { key: 'contact_name', header: 'Contact', cell: (r) => <div><p>{r.contact_name}</p><a className="text-xs text-primary" href={`mailto:${r.email}`}>{r.email}</a></div> },
    { key: 'city_state', header: 'Location', cell: (r) => r.city_state ?? '—' },
    { key: 'families_count', header: 'Families', align: 'right', sortable: true, cell: (r) => r.families_count ?? '—' },
    { key: 'message', header: 'Message', cell: (r) => <p className="line-clamp-2 max-w-sm text-sm">{r.message ?? '—'}</p> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge value={r.status} /> },
    { key: 'created_at', header: 'Received', sortable: true, cell: (r) => new Date(r.created_at).toLocaleString() },
  ];
  return (
    <DashboardLayout>
      <PageHeader title="Partner inquiries" description="Organizations asking to run campaigns. Each new inquiry creates a task and an email alert." />
      <Input placeholder="Search inquiries" value={t.search} onChange={(e) => t.setSearch(e.target.value)} className="mb-4 max-w-sm" />
      <DataTable columns={cols} {...t.tableProps} rowKey={(r) => r.id} empty="No partner inquiries yet." />
    </DashboardLayout>
  );
}
