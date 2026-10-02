import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { Input } from '@/components/ui/input';

/** Read-only Gold Coins ledger. Credits/reversals are written only by the scheduled dispatcher. */
export default function AdminGoldCoins() {
  const t = useAdminPaged({ table: 'gold_coin_ledger', searchCols: ['donor_email', 'note'], defaultSort: { key: 'created_at', dir: 'desc' } });
  const cols: Column<any>[] = [
    { key: 'created_at', header: 'When', sortable: true, cell: (r) => new Date(r.created_at).toLocaleString() },
    { key: 'entry_type', header: 'Type', cell: (r) => r.entry_type === 'reversal' ? 'Reversal' : 'Credit' },
    { key: 'coins', header: 'Coins', align: 'right', sortable: true, cell: (r) => <span className="tabular-nums">{r.coins}</span> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
    { key: 'donor_email', header: 'Donor', cell: (r) => r.user_id ? <span className="font-mono text-xs">{r.user_id.slice(0, 8)}</span> : <span className="text-xs">{r.donor_email ?? '—'} (guest)</span> },
    { key: 'donation_id', header: 'Donation', cell: (r) => <a className="font-mono text-xs text-primary" href={`/admin/donations?id=${r.donation_id}`}>{r.donation_id.slice(0, 8)}</a> },
    { key: 'needs_review', header: 'Review', cell: (r) => r.needs_review ? <StatusBadge status="needs review" /> : '' },
  ];
  return (
    <DashboardLayout>
      <PageHeader title="Gold Coins ledger" description="Append-only record of credits (10 per $1 of completed donations) and refund reversals." />
      <Input placeholder="Search guest email or note" value={t.search} onChange={(e) => t.setSearch(e.target.value)} className="mb-4 max-w-sm" />
      <DataTable columns={cols} {...t.tableProps} rowKey={(r) => r.id} empty="No ledger entries yet." />
    </DashboardLayout>
  );
}
