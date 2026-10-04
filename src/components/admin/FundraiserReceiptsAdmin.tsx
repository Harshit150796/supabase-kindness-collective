import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { sb, rpc, fmtDate } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { callFn } from '@/lib/serverActions';

type R = { id: string; coupon_id: string; created_at: string; hidden_at: string | null; coupons: { store_name: string; value: number | null; donations: { fundraiser_id: string } } };

/** Staff view of receipts shared for this fundraiser's coupons, with audited hide/unhide. */
export function FundraiserReceiptsAdmin({ fundraiserId, canWrite }: { fundraiserId: string; canWrite: boolean }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const q = useQuery({
    queryKey: ['adm-receipts', fundraiserId],
    queryFn: async () => {
      const { data, error } = await sb.from('coupon_receipts').select('id, coupon_id, created_at, hidden_at, coupons!inner(store_name, value, donations!inner(fundraiser_id))')
        .eq('coupons.donations.fundraiser_id', fundraiserId).order('created_at', { ascending: false }).limit(50);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as R[];
    },
  });
  if (!q.data?.length) return null;
  const view = async (r: R) => {
    const res = await callFn<{ receipts: { id: string; url: string }[] }>('impact-actions', { action: 'receipt_urls', coupon_id: r.coupon_id });
    if (res.error) { toast({ title: 'Could not open', description: res.error, variant: 'destructive' }); return; }
    const m: Record<string, string> = {}; for (const x of res.data?.receipts ?? []) m[x.id] = x.url;
    setUrls((u) => ({ ...u, ...m }));
  };
  const hide = async (r: R) => {
    try { await rpc('admin_hide_receipt', { _receipt_id: r.id, _hidden: !r.hidden_at }); q.refetch(); }
    catch (e) { toast({ title: 'Failed', description: (e as Error).message, variant: 'destructive' }); }
  };
  return (
    <div className="mb-4 rounded-lg bg-muted/40 p-3">
      <p className="mb-2 text-sm font-medium">Receipts shared by the organizer (private)</p>
      <ul className="space-y-2 text-sm">
        {q.data.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-2">
            <span>${Number(r.coupons.value ?? 0)} {r.coupons.store_name} · {fmtDate(r.created_at)}{r.hidden_at ? ' · hidden' : ''}</span>
            <Button size="sm" variant="ghost" onClick={() => view(r)}>View</Button>
            {canWrite && <Button size="sm" variant="ghost" onClick={() => hide(r)}>{r.hidden_at ? 'Unhide' : 'Hide'}</Button>}
            {urls[r.id] && <a href={urls[r.id]} target="_blank" rel="noopener noreferrer"><img src={urls[r.id]} alt="Receipt" className="h-16 rounded object-contain" /></a>}
          </li>
        ))}
      </ul>
    </div>
  );
}
