import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sb, rpc, fmtDate } from '@/lib/adminApi';
import { StatusBadge } from '@/components/admin/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

type Row = { id: string; donation_id: string; donation_at: string; store_name: string; value: number | null; status: string; has_code: boolean; code_hint: string | null; redemption_url: string | null };

export function FundraiserCouponsTab({ fundraiserId, canWrite }: { fundraiserId: string; canWrite: boolean }) {
  const q = useQuery({ queryKey: ['adm-fr-coupons', fundraiserId], queryFn: () => rpc<Row[]>('admin_fundraiser_coupons', { _fundraiser_id: fundraiserId }) });
  const [drafts, setDrafts] = useState<Record<string, { code: string; url: string }>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const open = (q.data ?? []).filter((r) => (!r.has_code || editing[r.id]) && r.status !== 'redeemed');
  const filled = open.filter((r) => (drafts[r.id]?.code ?? '').trim().length >= 3);

  const save = async () => {
    setBusy(true);
    const saved: string[] = [];
    for (const r of filled) {
      try { await rpc('admin_set_coupon_code', { _coupon_id: r.id, _code: drafts[r.id].code.trim(), _redemption_url: drafts[r.id].url.trim() || null }); saved.push(r.id); }
      catch (e) { toast({ title: `Could not save ${r.store_name} coupon`, description: (e as Error).message, variant: 'destructive' }); }
    }
    if (saved.length) {
      const { data, error } = await sb.functions.invoke('fundraiser-actions', { body: { action: 'notify_coupon_ready', fundraiser_id: fundraiserId, coupon_ids: saved } });
      const sent = !error && (data as any)?.sent;
      toast({ title: `${saved.length} code${saved.length > 1 ? 's' : ''} saved`, description: sent ? 'The organizer was emailed.' : 'Saved, but the email to the organizer could not be sent.', variant: sent ? undefined : 'destructive' });
      setDrafts({}); setEditing({});
      q.refetch();
    }
    setBusy(false);
  };

  if (q.isLoading) return <p className="py-6 text-center text-sm text-muted-foreground">Loading coupons…</p>;
  if (q.error) return <div className="py-6 text-center text-sm text-destructive">{(q.error as Error).message} <button className="ml-2 text-primary" onClick={() => q.refetch()}>Retry</button></div>;
  if (!q.data?.length) return <p className="py-6 text-center text-sm text-muted-foreground">No coupons yet. Coupons appear here once a donation to this fundraiser is completed.</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Enter the code for each coupon. Saving makes it visible to the organizer on their fundraiser page and emails them (the code itself is not emailed).</p>
      <ul className="divide-y divide-border text-sm">
        {q.data.map((r) => {
          const isOpen = canWrite && open.some((o) => o.id === r.id);
          const d = drafts[r.id] ?? { code: '', url: '' };
          return (
            <li key={r.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">${Number(r.value ?? 0)} {r.store_name} <span className="font-normal text-muted-foreground">· donation {fmtDate(r.donation_at)}</span></span>
                <span className="flex items-center gap-2">
                  {r.has_code && <code className="text-xs">{r.code_hint}</code>}
                  <StatusBadge value={r.has_code ? (r.status === 'redeemed' ? 'redeemed' : 'code entered') : 'needs code'} />
                  {canWrite && r.has_code && r.status !== 'redeemed' && !editing[r.id] && <button className="text-xs text-primary" onClick={() => setEditing({ ...editing, [r.id]: true })}>Replace</button>}
                </span>
              </div>
              {isOpen && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Input value={d.code} maxLength={200} placeholder="Coupon code" onChange={(e) => setDrafts({ ...drafts, [r.id]: { ...d, code: e.target.value } })} />
                  <Input value={d.url} maxLength={1000} placeholder="Redemption link (optional, https://…)" onChange={(e) => setDrafts({ ...drafts, [r.id]: { ...d, url: e.target.value } })} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {canWrite && open.length > 0 && (
        <Button size="sm" disabled={busy || !filled.length} onClick={save}>{busy ? 'Saving…' : filled.length ? `Save ${filled.length} code${filled.length === 1 ? '' : 's'}` : 'Save codes'}</Button>
      )}
    </div>
  );
}
