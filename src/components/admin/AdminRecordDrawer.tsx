import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { rpc, fmtDate, usd } from '@/lib/adminApi';
import { RecordWork } from '@/components/admin/RecordWork';
import { DataTable, StatusBadge } from '@/components/admin/DataTable';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AdminRecordDrawer({ type, record, onClose }: { type: 'donor' | 'user'; record: any; onClose: () => void }) {
  return <Sheet open={!!record} onOpenChange={(v) => !v && onClose()}><SheetContent className="w-full overflow-y-auto sm:max-w-2xl">{record && <RecordDetails key={record.donor_key ?? record.user_id} type={type} record={record} />}</SheetContent></Sheet>;
}
function RecordDetails({ type, record }: { type: 'donor' | 'user'; record: any }) {
  const { user } = useAuth();
  const key = type === 'user' ? record.user_id : record.donor_key;
  const title = record.full_name || record.display_name || 'Guest donor';
  const [kind, setKind] = useState('donations');
  const [page, setPage] = useState(0);
  const q = useQuery({ queryKey: ['adm-record-history', user?.id, type, key, kind, page], enabled: kind !== 'work', queryFn: () => rpc<{ rows: any[]; total: number }>('admin_record_history', { _type: type, _key: key, _kind: kind, _limit: 25, _offset: page * 25 }) });
  return <><SheetHeader><SheetTitle className="pr-6 text-left font-serif text-2xl font-normal">{title}</SheetTitle><p className="break-words text-left text-sm text-muted-foreground">{record.email ?? 'No email recorded'}</p></SheetHeader>
    <div className="my-4 flex flex-wrap gap-3 text-sm"><span>{type === 'donor' ? `${usd(record.total)} given` : `Joined ${fmtDate(record.created_at)}`}</span><span className="text-muted-foreground">{record.donor_id || type === 'user' ? 'Registered account' : 'Guest · no account'}</span></div>
    <Tabs value={kind} onValueChange={(v) => { setKind(v); setPage(0); }}><TabsList className="h-auto flex-wrap"><TabsTrigger value="donations">Donations</TabsTrigger><TabsTrigger value="sources">Outside coupons</TabsTrigger>{type === 'user' && <TabsTrigger value="fundraisers">Fundraisers</TabsTrigger>}<TabsTrigger value="work">Notes & follow-ups</TabsTrigger></TabsList></Tabs>
    {kind === 'work' ? <RecordWork type={type} recordKey={key} title={title} /> : <div className="mt-4"><DataTable columns={[
      { key: 'fundraiser', header: 'Fundraiser', cell: (r: any) => <Link className="text-primary" to={`/admin/fundraisers?id=${r.fundraiser_id ?? r.id}`}>{r.fundraiser_title || r.title || 'Unlinked gift'}</Link> },
      { key: 'amount', header: kind === 'sources' ? 'Coupon value' : 'Amount / status', cell: (r: any) => kind === 'fundraisers' ? <StatusBadge value={r.status} /> : <span>{usd(kind === 'sources' ? r.coupon_value : r.amount)} {r.status && <StatusBadge value={r.status} />}</span> },
      { key: 'date', header: 'Created', cell: (r: any) => fmtDate(r.created_at) },
      ...(kind !== 'fundraisers' ? [{ key: 'email', header: 'Confirmation', cell: (r: any) => r.confirmation_sent_at || r.sent_at ? `Sent ${fmtDate(r.confirmation_sent_at || r.sent_at)}` : <StatusBadge value={r.email_status || 'not recorded'} /> }] : []),
    ]} rows={q.data?.rows} total={q.data?.total} loading={q.isLoading} error={q.error ? (q.error as Error).message : null} onRetry={() => q.refetch()} page={page} pageSize={25} onPage={setPage} rowKey={(r: any) => r.id} empty="No records in this view." /></div>}
  </>;
}