import { FundraiserReceiptsAdmin } from '@/components/admin/FundraiserReceiptsAdmin';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { sb, rpc, fmtDate } from '@/lib/adminApi';
import { callFn } from '@/lib/serverActions';
import { StatusBadge } from '@/components/admin/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { brandLogoFor, issuableBrandNames } from '@/data/brandLogos';
import { validateSecret, type CredType } from '@/lib/couponCredentials';

type Target = { allocated: number; topup: number; issued: number; topup_reasons: { amount: number; reason: string }[] };
type Row = {
  id: string; donation_id: string; donation_at: string; store_name: string; value: number | null; status: string; has_code: boolean; code_hint: string | null;
  redemption_url: string | null; credential_type: string | null; value_expires_on: string | null; instructions: string | null;
  issued_brand: string | null; brand_change_reason: string | null; group_target: Target;
};

const TYPES: { v: CredType; label: string }[] = [
  { v: 'code', label: 'Code' }, { v: 'gift_card', label: 'Gift card' },
  { v: 'prepaid_link', label: 'Prepaid card — hosted link' },
];
const money = (n: number) => `$${(Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0)}`;

/** One editable coupon line. `editing` = entering new credentials; `clear` = remove saved credentials (kept as Returned). */
type Line = {
  key: string; id?: string; value: string; origValue?: number; redeemed: boolean; saved: Row | null; editing: boolean; clear: boolean;
  type: CredType; code: string; pin: string; number: string; url: string;
  valueExp: string; instructions: string; issued: string; reason: string; more: boolean;
};
const blank = { code: '', pin: '', number: '', url: '' };
const toLines = (rows: Row[]): Line[] => rows.map((r) => ({
  key: r.id, id: r.id, value: String(Number(r.value ?? 0)), origValue: Number(r.value ?? 0), redeemed: r.status === 'redeemed',
  saved: r.has_code ? r : null, editing: !r.has_code && r.status !== 'redeemed', clear: false,
  type: (r.credential_type as CredType) || 'code', ...blank,
  valueExp: r.value_expires_on ?? '', instructions: r.instructions ?? '', issued: r.issued_brand ?? r.store_name, reason: r.brand_change_reason ?? '', more: false,
}));

/** Use the oldest matching code from the stock library (Coupons page) for this coupon. */
function StockPick({ couponId, brand, value, fundraiserId, onDone }: { couponId: string; brand: string; value: number; fundraiserId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const q = useQuery({
    queryKey: ['adm-stock-pick', brand, value],
    queryFn: async () => {
      const { data, error } = await sb.from('coupons').select('id').eq('status', 'in_stock').is('donation_id', null).eq('store_name', brand).eq('value', value)
        .or(`expiry_date.is.null,expiry_date.gte.${today}`).order('created_at').limit(50);
      if (error) throw new Error(error.message);
      return (data ?? []) as { id: string }[];
    },
  });
  const n = q.data?.length ?? 0;
  if (!n) return null;
  const use = async () => {
    setBusy(true);
    try {
      await rpc('admin_assign_stock_code', { _target: couponId, _stock: q.data![0].id });
      const r = await callFn('fundraiser-actions', { action: 'notify_coupon_ready', fundraiser_id: fundraiserId, coupon_ids: [couponId] });
      toast({ title: 'Stock code used', description: r.data?.sent ? 'The organizer was emailed.' : 'Saved. The organizer alert is queued.' });
      q.refetch(); onDone();
    } catch (e) { toast({ title: 'Could not use stock code', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(false);
  };
  return <Button size="sm" variant="outline" className="h-8" disabled={busy} onClick={use}>Use stock code ({n})</Button>;
}

function AdminReveal({ id }: { id: string }) {
  const [v, setV] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);
  if (v) return (
    <span className="flex flex-wrap items-center gap-2 text-xs">
      {Object.entries(v).map(([k, x]) => <span key={k}><span className="text-muted-foreground">{k}</span> <code>{x}</code></span>)}
      <button className="text-primary" onClick={() => setV(null)}><EyeOff className="inline h-3 w-3" /> Hide</button>
    </span>
  );
  return (
    <button className="text-xs text-primary" disabled={busy} onClick={async () => {
      setBusy(true);
      const r = await callFn<{ code: string | null; redemption_url: string | null; secrets: Record<string, string> }>('coupon-secrets', { action: 'admin_reveal', coupon_id: id });
      setBusy(false);
      if (r.error) { toast({ title: 'Could not show details', description: r.error, variant: 'destructive' }); return; }
      const d = r.data!;
      setV(Object.fromEntries(Object.entries({ ...d.secrets, link: d.redemption_url }).filter(([, x]) => x)) as Record<string, string>);
    }}><Eye className="inline h-3 w-3" /> Show (audited)</button>
  );
}

function lineError(l: Line, today: string): string | null {
  const n = Number(l.value);
  if (!Number.isFinite(n) || n <= 0 || Math.round(n * 100) !== n * 100) return 'Enter a positive amount (cents allowed)';
  if (l.valueExp && l.valueExp < today && (l.editing || !l.saved)) return 'Value expiry date is in the past';
  if (!l.editing) return null;
  const s = { code: l.code, pin: l.pin, number: l.number };
  const any = Object.values(s).some((x) => x.trim()) || (l.type === 'prepaid_link' && l.url.trim());
  if (!any) return null; // left empty = stays "being prepared"
  return validateSecret(l.type, s, { url: l.url.trim() || null });
}

function CouponGroupEditor({ fundraiserId, donationId, brand, donationAt, rows, canWrite, open, onToggle, onDirty, onDone }: {
  fundraiserId: string; donationId: string; brand: string; donationAt: string; rows: Row[]; canWrite: boolean;
  open: boolean; onToggle: (open: boolean) => void; onDirty: (dirty: boolean) => void; onDone: () => void;
}) {
  const t = rows[0].group_target;
  const base = Number(t.allocated) + Number(t.topup);
  const [lines, setLines] = useState<Line[]>(() => toLines(rows));
  const [busy, setBusy] = useState(false);
  const [topupReason, setTopupReason] = useState('');
  const sig = JSON.stringify(rows);
  useEffect(() => { setLines(toLines(rows)); }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toISOString().slice(0, 10);
  const set = (k: string, p: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === k ? { ...l, ...p } : l)));
  const issued = Math.round(lines.reduce((s, l) => s + (Number(l.value) || 0), 0) * 100) / 100;
  const toIssue = Math.round((base - issued) * 100) / 100;
  const over = -toIssue;
  const errors = lines.map((l) => lineError(l, today));
  const brandReasonMissing = lines.some((l) => l.issued.trim().toLowerCase() !== brand.toLowerCase() && l.reason.trim().length < 5);
  const topupOk = over <= 0 || topupReason.trim().length >= 5;
  const valid = lines.length > 0 && lines.length <= 50 && errors.every((e) => !e) && !brandReasonMissing && topupOk;
  const losing = lines.some((l) => l.saved && (l.clear || l.editing || Number(l.value) !== l.origValue)) || rows.some((r) => r.has_code && !lines.some((l) => l.id === r.id));

  const save = async () => {
    if (losing && !confirm('Changing the amount of, replacing, or removing a coupon that already has a code or card takes it away from the organizer. The old details are kept in the Coupons library as "Returned" (never deleted). Continue?')) return;
    const big = lines.filter((l) => Number(l.value) > 1000);
    if (big.length && !confirm(`${big.length === 1 ? 'One coupon is' : `${big.length} coupons are`} over $1,000 (${big.map((l) => money(Number(l.value))).join(', ')}). Save anyway?`)) return;
    setBusy(true);
    const items = lines.map((l) => {
      const keep = !!l.saved && !l.editing && !l.clear;
      return {
        id: l.id, value: Number(l.value), type: l.editing ? l.type : (l.saved?.credential_type ?? l.type), keep_secret: keep,
        secret: l.editing ? (l.type === 'code' ? { code: l.code, pin: l.pin } : l.type === 'gift_card' ? { number: l.number, pin: l.pin } : {}) : {},
        redemption_url: l.editing ? l.url.trim() || null : null,
        value_expires_on: l.valueExp || null, instructions: l.instructions.trim() || null,
        issued_brand: l.issued.trim() || brand, brand_reason: l.issued.trim().toLowerCase() !== brand.toLowerCase() ? l.reason.trim() : null,
      };
    });
    const r = await callFn<{ changed: string[]; emailed: number }>('coupon-secrets', {
      action: 'admin_save', donation_id: donationId, brand, items, topup: over > 0 ? { amount: Math.round(over * 100) / 100, reason: topupReason.trim() } : null,
    });
    setBusy(false);
    if (r.error) { toast({ title: 'Could not save coupons', description: r.error, variant: 'destructive' }); return; }
    const n = r.data?.changed?.length ?? 0;
    toast({ title: `${brand} coupons saved`, description: n ? (r.data?.emailed ? 'The organizer was emailed (no codes in the email).' : 'Saved. The organizer alert is queued.') : 'Coupons updated.' });
    setTopupReason('');
    onDirty(false); onToggle(false);
    onDone();
  };

  const field = (l: Line, k: keyof Line, ph: string, cls = 'min-w-[8rem] flex-1', extra: Record<string, unknown> = {}) => (
    <Input className={`h-8 ${cls}`} value={String(l[k] ?? '')} placeholder={ph} onChange={(e) => set(l.key, { [k]: e.target.value } as Partial<Line>)} {...extra} />
  );

  return (
    <div className="rounded-md bg-muted/40 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{brand} — {money(Number(t.allocated))} donated{Number(t.topup) > 0 && <> + {money(Number(t.topup))} top-up</>} <span className="font-normal text-muted-foreground">· donation {fmtDate(donationAt)}</span></span>
        <span className={over > 0 ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
          {money(issued)} of {money(base)} issued · {toIssue >= 0 ? `${money(toIssue)} to issue` : `${money(over)} over`}
        </span>
      </div>
      <ul className="mt-2 space-y-3">
        {lines.map((l, i) => {
          const logo = brandLogoFor(l.issued);
          const swapped = l.issued.trim().toLowerCase() !== brand.toLowerCase();
          return (
            <li key={l.key} className="space-y-2 border-b border-border pb-3 last:border-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-28">
                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                  <Input className="h-8 pl-5" type="number" min={0.01} step="0.01" value={l.value} disabled={!canWrite || l.redeemed} onChange={(e) => set(l.key, { value: e.target.value })} aria-label="Coupon amount" />
                </div>
                {logo && <img src={logo} alt="" className="h-6 w-6 rounded bg-background object-contain p-0.5" />}
                <select className="h-8 rounded-md border border-input bg-background px-2 text-xs" value={l.issued} disabled={!canWrite || l.redeemed} onChange={(e) => set(l.key, { issued: e.target.value })} aria-label="Brand shown to recipient">
                  {[...new Set([brand, ...issuableBrandNames, l.issued])].map((n) => <option key={n} value={n}>{n === brand ? `${n} (donor's choice)` : n}</option>)}
                </select>
                {l.redeemed ? <span className="flex items-center gap-2"><code className="text-xs">{l.saved?.code_hint}</code><StatusBadge value="redeemed" /></span>
                  : l.saved && !l.editing ? (
                    <span className="flex flex-1 flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">{TYPES.find((x) => x.v === (l.saved!.credential_type ?? 'code'))?.label}</span>
                      <code className="text-xs">{l.saved.code_hint}</code>
                      <StatusBadge value={l.clear ? 'will be returned' : 'entered'} />
                      {!l.clear && <AdminReveal id={l.saved.id} />}
                      {canWrite && <button className="text-xs text-primary" onClick={() => set(l.key, { editing: true, clear: false, type: 'code', ...blank })}>Replace</button>}
                      {canWrite && !l.clear && <button className="text-xs text-destructive" onClick={() => set(l.key, { clear: true })}>Remove details</button>}
                      {l.clear && <button className="text-xs text-primary" onClick={() => set(l.key, { clear: false })}>Undo</button>}
                    </span>
                  ) : canWrite ? (
                    <select className="h-8 rounded-md border border-input bg-background px-2 text-xs" value={l.type} onChange={(e) => set(l.key, { type: e.target.value as CredType, ...blank })} aria-label="Coupon type">
                      {TYPES.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}
                    </select>
                  ) : <StatusBadge value="needs code" />}
                {canWrite && !l.redeemed && (
                  <Button size="icon" variant="ghost" className="ml-auto h-8 w-8" aria-label="Remove coupon" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
              {canWrite && !l.redeemed && l.editing && (
                <div className="flex flex-wrap gap-2">
                  {l.type === 'code' && <>{field(l, 'code', 'e-gift code', 'min-w-[10rem] flex-1', { maxLength: 200 })}{field(l, 'pin', 'PIN (optional)', 'w-32', { maxLength: 16 })}</>}
                  {l.type === 'gift_card' && <>{field(l, 'number', 'Card number', 'min-w-[10rem] flex-1', { maxLength: 30 })}{field(l, 'pin', 'PIN', 'w-32', { maxLength: 16 })}</>}
                  {field(l, 'url', l.type === 'prepaid_link' ? 'Provider redemption link (https://…)' : 'Redemption link (optional, https://…)', 'min-w-[12rem] flex-1', { maxLength: 1000 })}
                  {l.saved && <button className="text-xs text-primary" onClick={() => set(l.key, { editing: false, ...blank })}>Keep saved details</button>}
                </div>
              )}
              {canWrite && !l.redeemed && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs text-muted-foreground">Value expires <Input type="date" className="ml-1 inline-block h-8 w-40" value={l.valueExp} onChange={(e) => set(l.key, { valueExp: e.target.value })} /></label>
                  {field(l, 'instructions', 'Instructions shown on reveal (optional), e.g. activate by calling…', 'min-w-[14rem] flex-1', { maxLength: 500 })}
                </div>
              )}
              {canWrite && swapped && !l.redeemed && (
                <div className="flex flex-wrap items-center gap-2">
                  {field(l, 'reason', `Why issue as ${l.issued} instead of ${brand}? (shown to the donor)`, 'min-w-[16rem] flex-1', { maxLength: 200 })}
                  {l.reason.trim().length < 5 && <span className="text-xs text-destructive">A reason is required</span>}
                </div>
              )}
              {errors[i] && <p className="text-xs text-destructive">Coupon {i + 1}: {errors[i]}</p>}
            </li>
          );
        })}
      </ul>
      {canWrite && over > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-background p-2">
          <span className="text-xs font-medium">Platform top-up {money(over)}</span>
          <Input className="h-8 min-w-[16rem] flex-1" maxLength={300} value={topupReason} placeholder="Reason (shown to the donor as “CouponDonation added …”)" onChange={(e) => setTopupReason(e.target.value)} />
        </div>
      )}
      {canWrite && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" className="h-8" disabled={lines.length >= 50} onClick={() => setLines((ls) => [...ls, {
            key: crypto.randomUUID(), value: toIssue > 0 ? String(toIssue) : '', redeemed: false, saved: null, editing: true, clear: false, type: 'code', ...blank,
            valueExp: '', instructions: '', issued: brand, reason: '',
          }])}><Plus className="mr-1 h-3.5 w-3.5" />Add coupon</Button>
          <Button size="sm" variant="ghost" className="h-8" disabled={busy} onClick={() => { setLines(toLines(rows)); setTopupReason(''); }}>Reset</Button>
          <Button size="sm" className="h-8" disabled={busy || !valid} onClick={save}>{busy ? 'Saving…' : 'Save'}</Button>
          {over > 0 && !topupOk && <span className="text-xs text-destructive">Over-issuing needs a top-up reason</span>}
        </div>
      )}
      {canWrite && lines.map((l) => l.id && !l.saved && !l.redeemed && Number(l.value) === l.origValue && !(l.code || l.number || l.url)
        ? <div key={`s-${l.key}`} className="mt-2"><StockPick couponId={l.id} brand={brand} value={l.origValue!} fundraiserId={fundraiserId} onDone={onDone} /></div> : null)}
    </div>
  );
}

export function FundraiserCouponsTab({ fundraiserId, canWrite, donationId }: { fundraiserId: string; canWrite: boolean; donationId?: string }) {
  const q = useQuery({ queryKey: ['adm-fr-coupons', fundraiserId], queryFn: () => rpc<Row[]>('admin_fundraiser_coupons', { _fundraiser_id: fundraiserId }) });
  const [openKey, setOpenKey] = useState<string | null>(null);
  const dirty = useRef(false);
  const toggle = (k: string, open: boolean) => {
    if (dirty.current && !confirm('You have unsaved coupon changes. Discard them?')) return;
    dirty.current = false;
    setOpenKey(open ? k : null);
  };
  const rows = (q.data ?? []).filter((r) => !donationId || r.donation_id === donationId);

  if (q.isLoading) return <p className="py-6 text-center text-sm text-muted-foreground">Loading coupons…</p>;
  if (q.error) return <div className="py-6 text-center text-sm text-destructive">{(q.error as Error).message} <button className="ml-2 text-primary" onClick={() => q.refetch()}>Retry</button></div>;
  if (!rows.length) return <p className={donationId ? 'mt-1 text-xs text-muted-foreground' : 'py-6 text-center text-sm text-muted-foreground'}>{donationId ? 'No coupons for this donation yet.' : 'No coupons yet. Coupons appear here once a donation to this fundraiser is completed.'}</p>;

  const groups = new Map<string, Row[]>();
  for (const r of rows) { const k = `${r.donation_id}|${r.store_name}`; groups.set(k, [...(groups.get(k) ?? []), r]); }
  const toIssue = [...groups.values()].reduce((s, g) => s + Math.max(0, Number(g[0].group_target.allocated) + Number(g[0].group_target.topup) - Number(g[0].group_target.issued)), 0);

  return (
    <div className="space-y-3">
      {!donationId && <FundraiserReceiptsAdmin fundraiserId={fundraiserId} canWrite={canWrite} />}
      {!donationId && (
        <p className="text-xs text-muted-foreground">
          Issue any mix of amounts up to what the donor gave. Codes are locked so only the organizer (and audited staff) can see them; the organizer is emailed once per new coupon (never with the details).
          {toIssue > 0.004 && <strong className="ml-1 font-medium text-foreground">{money(toIssue)} still to issue.</strong>}
        </p>
      )}
      {[...groups.entries()].map(([k, g]) => (
        <CouponGroupEditor key={k} fundraiserId={fundraiserId} donationId={g[0].donation_id} brand={g[0].store_name} donationAt={g[0].donation_at} rows={g}
          canWrite={canWrite} open={openKey === k} onToggle={(o) => toggle(k, o)} onDirty={(d) => { dirty.current = d; }} onDone={() => q.refetch()} />
      ))}
    </div>
  );
}
