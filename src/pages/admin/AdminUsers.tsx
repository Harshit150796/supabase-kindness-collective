import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { rpc, fmtDate } from '@/lib/adminApi';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

const PAGE = 25;
interface Row { user_id: string; email: string; full_name: string | null; city: string | null; country: string | null; created_at: string; roles: string[]; total_count: number }

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [dq, setDq] = useState('');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(0);
  useEffect(() => { const t = setTimeout(() => { setDq(search); setPage(0); }, 300); return () => clearTimeout(t); }, [search]);
  const q = useQuery({
    queryKey: ['adm-users', dq, role, page],
    queryFn: () => rpc<Row[]>('admin_list_users', { _search: dq || null, _role: role === 'all' ? null : role, _limit: PAGE, _offset: page * PAGE }),
  });
  const cols: Column<Row>[] = [
    { key: 'name', header: 'Name', cell: (r) => <div><p className="font-medium text-foreground">{r.full_name || 'No name'}</p><p className="text-xs text-muted-foreground">{r.email}</p></div> },
    { key: 'roles', header: 'Roles', cell: (r) => <div className="flex flex-wrap gap-1">{r.roles.map((x) => <span key={x} className={`rounded px-1.5 py-0.5 text-[11px] font-medium capitalize ${['admin', 'staff', 'viewer'].includes(x) ? 'bg-ink text-ink-foreground' : 'bg-muted text-foreground'}`}>{x}</span>)}</div> },
    { key: 'loc', header: 'Location', cell: (r) => [r.city, r.country].filter(Boolean).join(', ') || '—' },
    { key: 'created_at', header: 'Joined', cell: (r) => fmtDate(r.created_at) },
  ];
  return (
    <DashboardLayout>
      <PageHeader title="Users" description="Every account on the platform. Team roles are managed in Team & access." />
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 pl-8" placeholder="Search email or name" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Select value={role} onValueChange={(v) => { setRole(v); setPage(0); }}><SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger><SelectContent>{['all', 'donor', 'recipient', 'admin', 'staff', 'viewer'].map((x) => <SelectItem key={x} value={x} className="capitalize">{x === 'all' ? 'All roles' : x}</SelectItem>)}</SelectContent></Select>
      </div>
      <DataTable columns={cols} rows={q.data} total={Number(q.data?.[0]?.total_count ?? 0)} loading={q.isLoading} error={q.error ? (q.error as Error).message : null} onRetry={() => q.refetch()} page={page} pageSize={PAGE} onPage={setPage} rowKey={(r) => r.user_id} empty="No users match." />
    </DashboardLayout>
  );
}
