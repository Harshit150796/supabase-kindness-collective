import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Mail, Plus } from 'lucide-react';
import { sb, rpc, fmtDate, usd } from '@/lib/adminApi';
import { callFn } from '@/lib/serverActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/admin/DataTable';
import { toast } from '@/hooks/use-toast';
import { issuableBrandNames } from '@/data/brandLogos';

type Outside = {
  id: string; source_id: string; store_name: string; value: number; status: string; code_hint: string | null; revealed_at: string | null; used_at: string | null;
  source_label: string | null; donor_name: string | null; donor_email: string | null; is_anonymous: boolean; confirmation_sent_at: string | null; confirmation_count: number; created_at: string;
};
type DonorMode = 'existing' | 'new' | 'none';

export function OutsideCoupons({ fundraiserId, canWrite }: { fundraiserId: string; canWrite: boolean }) {
  const q = useQuery({ queryKey: ['adm-outside', fundraiserId], queryFn: () => rpc<Outside[]>('admin_outside_coupons', { _fundraiser_id: fundraiserId }) });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const resend = async (r: Outside) => {
    if (!confirm(`Send the confirmation email to ${r.donor_email}${r.confirmation_count ? ' again' : ''}?`)) return;
    setBusy(r.source_id);
    const res = await callFn('coupon-secrets', { action: 'resend_outside_confirmation', source_id: r.source_id });
    setBusy(null);
    toast(res.error ? { title: 'Not sent', description: res.error, variant: 'destructive' } : { title: 'Confirmation sent' });
    q.refetch();
  };

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">From other sources</h3>
          <p className="text-xs text-muted-foreground">Coupons received outside a site donation. They don't change the raised amount or donor count.</p>
        </div>
        {canWrite && <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />Add outside coupon</Button>}
      </div>
      {q.isLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : !q.data?.length ? <p className="text-xs text-muted-foreground">None yet.</p> : (
        <ul className="divide-y divide-border text-sm">
          {q.data.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div>
                <div className="font-medium">{r.store_name} · {usd(r.value)} <span className="ml-1 font-mono text-xs text-muted-foreground">{r.code_hint}</span></div>
                <div className="text-xs text-muted-foreground">
                  {r.source_label ? `${r.source_label} · ` : ''}{r.donor_name || r.donor_email ? `${r.donor_name ?? ''}${r.donor_email ? ` <${r.donor_email}>` : ''}${r.is_anonymous ? ' (anonymous)' : ''}` : 'No donor'} · added {fmtDate(r.created_at)}
                  {r.confirmation_sent_at && ` · emailed ${fmtDate(r.confirmation_sent_at)}${r.confirmation_count > 1 ? ` (${r.confirmation_count}×)` : ''}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={r.used_at ? 'used' : r.revealed_at ? 'received' : r.status} />
                {canWrite && r.donor_email && (
                  <Button size="sm" variant="outline" disabled={busy === r.source_id} onClick={() => resend(r)}>
                    {busy === r.source_id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Mail className="mr-1 h-3.5 w-3.5" />}{r.confirmation_sent_at ? 'Resend' : 'Send'} confirmation
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {open && <AddOutsideDialog fundraiserId={fundraiserId} onClose={() => setOpen(false)} onDone={() => { setOpen(false); q.refetch(); }} />}
    </div>
  );
}

function AddOutsideDialog({ fundraiserId, onClose, onDone }: { fundraiserId: string; onClose: () => void; onDone: () => void }) {
  const [brand, setBrand] = useState('');
  const [fromStock, setFromStock] = useState(false);
  const [stockId, setStockId] = useState('');
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [link, setLink] = useState('');
  const [expiry, setExpiry] = useState('');
  const [source, setSource] = useState('');
  const [mode, setMode] = useState<DonorMode>('new');
  const [existing, setExisting] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [anon, setAnon] = useState(false);
  const [emailDonor, setEmailDonor] = useState(true);
  const [emailOrg, setEmailOrg] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const donors = useQuery({
    queryKey: ['adm-outside-donors', fundraiserId],
    queryFn: async () => {
      const { data, error } = await sb.from('donations').select('donor_id, donor_name, donor_email').eq('fundraiser_id', fundraiserId).eq('status', 'completed').limit(500);
      if (error) throw new Error(error.message);
      const m = new Map<string, { key: string; name: string; email: string | null; user_id: string | null }>();
      for (const d of data ?? []) {
        const k = d.donor_id ?? d.donor_email?.toLowerCase();
        if (k && !m.has(k)) m.set(k, { key: k, name: d.donor_name || d.donor_email || 'Donor', email: d.donor_email, user_id: d.donor_id });
      }
      return [...m.values()];
    },
  });
  const stock = useQuery({
    queryKey: ['adm-outside-stock', brand], enabled: fromStock,
    queryFn: async () => {
      let qq = sb.from('coupons').select('id, store_name, value, code_hint, value_expires_on').eq('status', 'in_stock').is('donation_id', null).order('created_at').limit(100);
      if (brand.trim()) qq = qq.ilike('store_name', brand.trim());
      const { data, error } = await qq;
      if (error) throw new Error(error.message);
      return data as { id: string; store_name: string; value: number; code_hint: string | null }[];
    },
  });
  const picked = useMemo(() => donors.data?.find((d) => d.key === existing), [donors.data, existing]);
  const donorEmail = mode === 'new' ? email.trim() : mode === 'existing' ? picked?.email ?? '' : '';

  const save = async () => {
    setErr(null);
    if (!fromStock && !brand.trim()) return setErr('Choose or type a brand.');
    if (fromStock && !stockId) return setErr('Pick a stock code.');
    if (!fromStock && !(Number(value) > 0)) return setErr('Enter an amount.');
    if (!fromStock && !code.trim() && !link.trim()) return setErr('Enter a code or a redemption link.');
    if (mode === 'new' && email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setErr('Enter a valid donor email.');
    if (mode === 'existing' && !picked) return setErr('Choose a donor.');
    setSaving(true);
    const r = await callFn<{ organizer_emailed: number; donor_emailed: boolean; donor_error?: string }>('coupon-secrets', {
      action: 'admin_add_outside', fundraiser_id: fundraiserId, brand: brand.trim() || null,
      stock_id: fromStock ? stockId : null, value: fromStock ? null : Math.round(Number(value) * 100) / 100,
      code: fromStock ? null : code.trim() || null, pin: fromStock ? null : pin.trim() || null, redemption_url: fromStock ? null : link.trim() || null,
      value_expires_on: fromStock ? null : expiry || null, source_label: source.trim() || null,
      donor: mode === 'none' ? {} : mode === 'new' ? { name: name.trim() || null, email: email.trim() || null, anonymous: anon } : { name: picked!.name, email: picked!.email, user_id: picked!.user_id, anonymous: anon },
      email_donor: emailDonor && !!donorEmail, email_organizer: emailOrg,
    });
    setSaving(false);
    if (r.error) return setErr(r.error);
    toast({ title: 'Outside coupon added', description: [r.data?.organizer_emailed ? 'Organizer emailed.' : null, r.data?.donor_emailed ? 'Donor confirmation sent.' : r.data?.donor_error && emailDonor && donorEmail ? `Donor email: ${r.data.donor_error}` : null].filter(Boolean).join(' ') || 'Saved.' });
    onDone();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add outside coupon</DialogTitle>
          <DialogDescription>For coupons received from somewhere other than a site donation. Any brand, any donor.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <Label>Brand</Label>
            <Input className="mt-1" list="outside-brands" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Pick from the list or type any brand" maxLength={80} />
            <datalist id="outside-brands">{[...new Set(issuableBrandNames)].map((b) => <option key={b} value={b} />)}</datalist>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant={!fromStock ? 'default' : 'outline'} onClick={() => setFromStock(false)}>Type a new code</Button>
            <Button type="button" size="sm" variant={fromStock ? 'default' : 'outline'} onClick={() => setFromStock(true)}>Pick from stock</Button>
          </div>
          {fromStock ? (
            <div>
              <Label>Stock code {brand.trim() ? `(${brand.trim()})` : '(all brands)'}</Label>
              <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" value={stockId} onChange={(e) => setStockId(e.target.value)}>
                <option value="">{stock.isLoading ? 'Loading…' : stock.data?.length ? 'Choose a code' : 'No matching stock'}</option>
                {stock.data?.map((s) => <option key={s.id} value={s.id}>{s.store_name} · {usd(s.value)} · {s.code_hint}</option>)}
              </select>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Amount ($)</Label><Input className="mt-1" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 25" /></div>
              <div><Label>Use by (optional)</Label><Input className="mt-1" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div>
              <div><Label>Code</Label><Input className="mt-1 font-mono" value={code} onChange={(e) => setCode(e.target.value)} maxLength={200} autoComplete="off" /></div>
              <div><Label>PIN (optional)</Label><Input className="mt-1 font-mono" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={200} autoComplete="off" /></div>
              <div className="sm:col-span-2"><Label>Redemption link (optional)</Label><Input className="mt-1" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" /></div>
            </div>
          )}
          <div><Label>Where it came from (optional, staff only)</Label><Input className="mt-1" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Church drive, local store" maxLength={120} /></div>

          <div className="space-y-2">
            <Label>Donor</Label>
            <div className="flex flex-wrap gap-2">
              {(['new', 'existing', 'none'] as DonorMode[]).map((m) => (
                <Button key={m} type="button" size="sm" variant={mode === m ? 'default' : 'outline'} onClick={() => setMode(m)}>{m === 'new' ? 'New donor' : m === 'existing' ? 'Existing donor' : 'No donor'}</Button>
              ))}
            </div>
            {mode === 'new' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Donor name" maxLength={120} />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Donor email" maxLength={254} />
              </div>
            )}
            {mode === 'existing' && (
              <select className="w-full rounded-md border border-input bg-background px-3 py-2" value={existing} onChange={(e) => setExisting(e.target.value)}>
                <option value="">{donors.isLoading ? 'Loading…' : donors.data?.length ? 'Choose a donor of this fundraiser' : 'No donors yet'}</option>
                {donors.data?.map((d) => <option key={d.key} value={d.key}>{d.name}{d.email && d.email !== d.name ? ` <${d.email}>` : ''}</option>)}
              </select>
            )}
            {mode !== 'none' && <label className="flex items-center gap-2"><Checkbox checked={anon} onCheckedChange={(v) => setAnon(!!v)} />Keep this donor anonymous</label>}
          </div>

          <div className="space-y-2 rounded-md bg-muted/50 p-3">
            <label className="flex items-center gap-2"><Checkbox checked={emailDonor && !!donorEmail} disabled={!donorEmail} onCheckedChange={(v) => setEmailDonor(!!v)} />Email the donor a confirmation{donorEmail ? ` (${donorEmail})` : ' — needs an email address'}</label>
            <label className="flex items-center gap-2"><Checkbox checked={emailOrg} onCheckedChange={(v) => setEmailOrg(!!v)} />Email the organizer that a coupon is ready</label>
            <p className="text-xs text-muted-foreground">Emails never include the code. The donor gets a short thank-you with a link to the fundraiser page.</p>
          </div>
          {err && <p className="text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Add coupon</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
