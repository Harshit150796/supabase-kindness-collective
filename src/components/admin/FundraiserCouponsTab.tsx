import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { sb, rpc, fmtDate } from '@/lib/adminApi';
import { StatusBadge } from '@/components/admin/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

type Row = { id: string; donation_id: string; donation_at: string; store_name: string; value: number | null; status: string; has_code: boolean; code_hint: string | null; redemption_url: string | null };

/** One editable coupon line. `code` undefined = keep the saved code untouched; '' = remove it. */
type Line = { key: string; id?: string; value: string; origValue?: number; code?: string; url?: string; hint?: string | null; savedUrl?: string | null; redeemed: boolean; editing: boolean };

const toLines = (rows: Row[]): Line[] => rows.map((r) => ({
  key: r.id, id: r.id, value: String(Number(r.value ?? 0)), origValue: Number(r.value ?? 0),
  hint: r.has_code ? r.code_hint : null, savedUrl: r.redemption_url, redeemed: r.status === 'redeemed',
  editing: !r.has_code && r.status !== 'redeemed',
}));

function CouponGroupEditor({ fundraiserId, donationId, brand, donationAt, rows, canWrite, onDone }: { fundraiserId: string; donationId: string; brand: string; donationAt: string; rows: Row[]; canWrite: boolean; onDone: () => void }) {
  const total = rows.reduce((s, r) => s + Number(r.value ?? 0), 0);
  const [lines, setLines] = useState<Line[]>(() => toLines(rows));
  const [busy, setBusy] = useState(false);
  useEffect(() => { setLines(toLines(rows)); }, [rows]);

  const set = (k: string, p: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === k ? { ...l, ...p } : l)));
  const nums = lines.map((l) => Number(l.value));
  const allocated = Math.round(nums.reduce((s, n) => s + (Number.isFinite(n) ? n : 0), 0) * 100) / 100;
  const amountsOk = nums.every((n) => Number.isFinite(n) && n >= 1 && n <= 500 && Math.round(n * 100) === n * 100);
  const codesOk = lines.every((l) => l.code === undefined || l.code.trim() === '' || (l.code.trim().length >= 3 && l.code.trim().length <= 200));
  const urlsOk = lines.every((l) => !l.url || /^https:\/\//i.test(l.url.trim()));
  const valid = lines.length > 0 && lines.length <= 50 && amountsOk && codesOk && urlsOk && Math.abs(allocated - total) < 0.005;
  const loseCode = lines.some((l) => l.hint && l.code === undefined && Number(l.value) !== l.origValue);
  const removedCoded = rows.some((r) => r.has_code && !lines.some((l) => l.id === r.id));

  const save = async () => {
    if ((loseCode || removedCoded) && !confirm('Changing the amount of, or removing, a coupon that has a code will delete that code. Continue?')) return;
    setBusy(true);
    try {
      const items = lines.map((l) => {
        const it: Record<string, unknown> = { value: Number(l.value) };
        if (l.id) it.id = l.id;
        if (l.code !== undefined) it.code = l.code.trim();
        if (l.url !== undefined) it.redemption_url = l.url.trim();
        return it;
      });
      const changed = await rpc<string[] | null>('admin_save_coupon_group', { _donation_id: donationId, _brand: brand, _items: items });
      let desc = 'Coupons updated.';
      if (changed?.length) {
        const { data, error } = await sb.functions.invoke('fundraiser-actions', { body: { action: 'notify_coupon_ready', fundraiser_id: fundraiserId, coupon_ids: changed } });
        desc = !error && (data as any)?.sent ? 'The organizer was emailed.' : 'Saved, but the email to the organizer could not be sent.';
      }
      toast({ title: `${brand} coupons saved`, description: desc });
      onDone();
    } catch (e) { toast({ title: 'Could not save coupons', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(false);
  };

  return (
    <div className="rounded-md bg-muted/40 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{brand} — ${total} total <span className="font-normal text-muted-foreground">· donation {fmtDate(donationAt)}</span></span>
        {canWrite && <span className={Math.abs(allocated - total) < 0.005 ? 'text-xs text-muted-foreground' : 'text-xs text-destructive'}>Allocated: ${allocated} of ${total}</span>}
      </div>
      <ul className="mt-2 space-y-2">
        {lines.map((l) => (
          <li key={l.key} className="flex flex-wrap items-center gap-2">
            <div className="relative w-24">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
              <Input className="h-8 pl-5" type="number" min={1} max={500} step="0.01" value={l.value} disabled={!canWrite || l.redeemed} onChange={(e) => set(l.key, { value: e.target.value })} />
            </div>
            {l.redeemed ? (
              <span className="flex items-center gap-2"><code className="text-xs">{l.hint}</code><StatusBadge value="redeemed" /></span>
            ) : l.editing && canWrite ? (
              <>
                <Input className="h-8 min-w-[9rem] flex-1" maxLength={200} value={l.code ?? ''} placeholder={l.hint ? `New code (blank removes ${l.hint})` : 'Coupon code (optional)'} onChange={(e) => set(l.key, { code: e.target.value })} />
                <Input className="h-8 min-w-[9rem] flex-1" maxLength={1000} value={l.url ?? ''} placeholder="Redemption link (https://…)" onChange={(e) => set(l.key, { url: e.target.value })} />
              </>
            ) : (
              <span className="flex flex-1 flex-wrap items-center gap-2">
                {l.hint && <code className="text-xs">{l.hint}</code>}
                <StatusBadge value={l.hint ? 'code entered' : 'needs code'} />
                {l.savedUrl && <span className="max-w-[12rem] truncate text-xs text-muted-foreground">{l.savedUrl}</span>}
                {canWrite && <button className="text-xs text-primary" onClick={() => set(l.key, { editing: true, code: '', url: l.savedUrl ?? '' })}>Edit code/link</button>}
                {canWrite && l.hint && <button className="text-xs text-destructive" onClick={() => set(l.key, { code: '', url: '' })}>Remove code</button>}
                {l.code === '' && <span className="text-xs text-destructive">Code will be removed on save</span>}
              </span>
            )}
            {canWrite && !l.redeemed && (
              <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Remove coupon" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}><Trash2 className="h-4 w-4" /></Button>
            )}
          </li>
        ))}
      </ul>
      {canWrite && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" className="h-8" disabled={lines.length >= 50} onClick={() => setLines((ls) => [...ls, { key: crypto.randomUUID(), value: String(Math.max(0, Math.round((total - allocated) * 100) / 100) || ''), code: '', url: '', redeemed: false, editing: true }])}>
            <Plus className="mr-1 h-3.5 w-3.5" />Add coupon
          </Button>
          <Button size="sm" variant="ghost" className="h-8" disabled={busy} onClick={() => setLines(toLines(rows))}>Reset</Button>
          <Button size="sm" className="h-8" disabled={busy || !valid} onClick={save}>{busy ? 'Saving…' : 'Save'}</Button>
          {!valid && Math.abs(allocated - total) >= 0.005 && <span className="text-xs text-destructive">Amounts must add up to ${total}</span>}
          {!urlsOk && <span className="text-xs text-destructive">Links must start with https://</span>}
          {!codesOk && <span className="text-xs text-destructive">Codes need 3–200 characters</span>}
        </div>
      )}
    </div>
  );
}

export function FundraiserCouponsTab({ fundraiserId, canWrite, donationId }: { fundraiserId: string; canWrite: boolean; donationId?: string }) {
  const q = useQuery({ queryKey: ['adm-fr-coupons', fundraiserId], queryFn: () => rpc<Row[]>('admin_fundraiser_coupons', { _fundraiser_id: fundraiserId }) });
  const rows = (q.data ?? []).filter((r) => !donationId || r.donation_id === donationId);

  if (q.isLoading) return <p className="py-6 text-center text-sm text-muted-foreground">Loading coupons…</p>;
  if (q.error) return <div className="py-6 text-center text-sm text-destructive">{(q.error as Error).message} <button className="ml-2 text-primary" onClick={() => q.refetch()}>Retry</button></div>;
  if (!rows.length) return <p className={donationId ? 'mt-1 text-xs text-muted-foreground' : 'py-6 text-center text-sm text-muted-foreground'}>{donationId ? 'No coupons for this donation yet.' : 'No coupons yet. Coupons appear here once a donation to this fundraiser is completed.'}</p>;

  const groups = new Map<string, Row[]>();
  for (const r of rows) { const k = `${r.donation_id}|${r.store_name}`; groups.set(k, [...(groups.get(k) ?? []), r]); }

  return (
    <div className="space-y-3">
      {!donationId && <p className="text-xs text-muted-foreground">Set any mix of coupon amounts, and enter a code and link for each. Saving a code shows it to the organizer and emails them (the code itself is not emailed).</p>}
      {[...groups.entries()].map(([k, g]) => (
        <CouponGroupEditor key={k} fundraiserId={fundraiserId} donationId={g[0].donation_id} brand={g[0].store_name} donationAt={g[0].donation_at} rows={g} canWrite={canWrite} onDone={() => q.refetch()} />
      ))}
    </div>
  );
}
