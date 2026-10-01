import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { rpc, usd, fmtDate, downloadCsv } from '@/lib/adminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, Search } from 'lucide-react';

const PAGE = 25;

// CRM contacts aggregated server-side from completed donations (admin_list_donors).
export default function AdminDonors() {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('total');
  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(0); }, 300); return () => clearTimeout(t); }, [q]);

  const query = useQuery({
    queryKey: ['adm-donors', dq, page, sort],
    queryFn: () => rpc<any[]>('admin_list_donors', { _search: dq.trim() || null, _limit: PAGE, _offset: page * PAGE, _sort: sort }),
  });
  const rows = query.data ?? [];
  const total = Number(rows[0]?.total_count ?? 0);

  const cols: Column<any>[] = [
    { key: 'name', header: 'Donor', cell: (r) => <div><p className="font-medium text-foreground">{r.display_name || 'Guest donor'}{!r.donor_id && <span className="ml-1.5 text-xs text-muted-foreground">guest</span>}</p><p className="text-xs text-muted-foreground">{r.email ?? '—'}</p></div> },
    { key: 'total', header: 'Total given', align: 'right', sortable: true, cell: (r) => <span className="font-medium">{usd(r.total)}</span> },
    { key: 'count', header: 'Donations', align: 'right', sortable: true, cell: (r) => r.donations_count },
    { key: 'fundraisers', header: 'Fundraisers', align: 'right', cell: (r) => r.fundraisers_supported },
    { key: 'first', header: 'First gift', cell: (r) => fmtDate(r.first_at) },
    { key: 'recent', header: 'Last gift', sortable: true, cell: (r) => fmtDate(r.last_at) },
    { key: 'anon', header: 'Public display', cell: (r) => r.any_anonymous ? <span className="text-xs text-muted-foreground">Gives anonymously</span> : <span className="text-xs">Named</span> },
    { key: 'open', header: '', cell: (r) => r.email ? <Link className="text-xs text-primary" to={`/admin/donations?q=${encodeURIComponent(r.email)}`}>Donations</Link> : null },
  ];

  const exportCsv = async () => {
    const all = await rpc<any[]>('admin_list_donors', { _search: dq.trim() || null, _limit: 200, _offset: 0, _sort: sort });
    downloadCsv('donors', all.map(({ total_count, donor_key, ...r }) => r));
  };

  return (
    <DashboardLayout>
      <PageHeader title="Donors" description="Everyone who has completed a donation, grouped by account or email. Anonymous givers stay anonymous on the public site."
        actions={<Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" />CSV</Button>} />
      <div className="relative mb-3 max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 pl-8" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <DataTable columns={cols} rows={rows} total={total} loading={query.isLoading} error={query.error ? (query.error as Error).message : null} onRetry={() => query.refetch()}
        page={page} pageSize={PAGE} onPage={setPage} sort={{ key: sort, dir: 'desc' }} onSort={(k) => { setSort(k); setPage(0); }}
        rowKey={(r) => r.donor_key} empty="No completed donations yet." />
    </DashboardLayout>
  );
}
