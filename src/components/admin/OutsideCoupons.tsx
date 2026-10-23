import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminDirtyGuard } from '@/hooks/useAdminDirtyGuard';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Mail, Plus } from 'lucide-react';
import { sb, rpc, fmtDate, usd } from '@/lib/adminApi';
import { callFn } from '@/lib/serverActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable, StatusBadge } from '@/components/admin/DataTable';
import { toast } from '@/hooks/use-toast';
import { issuableBrandNames } from '@/data/brandLogos';

type Outside = {
  id: string; source_id: string; store_name: string; value: number; status: string; code_hint: string | null; revealed_at: string | null; used_at: string | null;
  source_label: string | null; donor_name: string | null; donor_email: string | null; is_anonymous: boolean; confirmation_sent_at: string | null; confirmation_count: number; created_at: string;
};
type DonorMode = 'existing' | 'new' | 'none';

export function OutsideCoupons({ fundraiserId, canWrite }: { fundraiserId: string; canWrite: boolean }) {
  const { user } = useAuth();
  const q = useQuery({ queryKey: ['adm-outside', user?.id, fundraiserId], queryFn: () => rpc<Outside[]>('admin_outside_coupons', { _fundraiser_id: fundraiserId }) });
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
    <div className="space-y-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">From other sources</h3>
          <p className="text-xs text-muted-foreground">Coupons received outside a site donation. They don't change the raised amount or donor count.</p>
        </div>
        {canWrite && <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />Add outside coupon</Button>}
      </div>
      {q.error && <div className="text-sm text-destructive">{(q.error as Error).message}<Button size="sm" variant="outline" onClick={() => q.refetch()}>Retry</Button></div>}
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
      {open && <AddOutsideDialog key={user?.id + fundraiserId} fundraiserId={fundraiserId} onClose={() => setOpen(false)} onDone={() => { setOpen(false); q.refetch(); }} />}
    </div>
  );
}

function AddOutsideDialog({ fundraiserId, onClose, onDone }: { fundraiserId: string; onClose: () => void; onDone: () => void }) {
  const { user } = useAuth();
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
  const [step, setStep] = useState(0);
  const [donorSearch, setDonorSearch] = useState('');
  const [donorPage, setDonorPage] = useState(0);
  const [stockPage, setStockPage] = useState(0);
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  useAdminDirtyGuard(!!(brand || code || pin || link || value || source || name || email || stockId));
  const close = () => { if (!saving && (brand || code || pin || link || value || source || name || email || stockId) && !window.confirm('Discard this unsaved coupon?')) return; if (!saving) onClose(); };
  useEffect(() => { setStockPage(0); setStockId(''); setSelectedStock(null); }, [brand]);

  const donors = useQuery({ queryKey: ['adm-outside-donors', user?.id, fundraiserId, donorSearch, donorPage], enabled: mode === 'existing',
    queryFn: () => rpc<{ rows: any[]; total: number }>('admin_source_donors', { _fundraiser: fundraiserId, _search: donorSearch, _limit: 10, _offset: donorPage * 10 }) });
  const stock = useQuery({ queryKey: ['adm-outside-stock', user?.id, brand, stockPage], enabled: fromStock,
    queryFn: () => rpc<{ rows: any[]; total: number }>('admin_stock_picker', { _brand: brand.trim(), _limit: 10, _offset: stockPage * 10 }) });
  const picked = selectedDonor;
  const donorEmail = mode === 'new' ? email.trim() : mode === 'existing' ? picked?.email ?? '' : '';

  const save = async () => {
    if (saving) return;
    setErr(null);
    if (!fromStock && !brand.trim()) return setErr('Choose or type a brand.');
    if (fromStock && !stockId) return setErr('Pick a stock code.');
    if (!fromStock && !(Number(value) > 0)) return setErr('Enter an amount.');
    if (!fromStock && !code.trim() && !link.trim()) return setErr('Enter a code or a redemption link.');
    if (mode === 'new' && email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setErr('Enter a valid donor email.');
    if (mode === 'existing' && !picked) return setErr('Choose a donor.');
    if (link.trim() && !/^https:\/\//i.test(link.trim())) return setErr('Redemption links must start with https://.');
    if (!fromStock && code.trim() && code.trim().length < 3) return setErr('Code must contain at least 3 characters.');
    if (!fromStock && !Number.isFinite(Number(value))) return setErr('Enter a valid amount.');
    setSaving(true);
    const r = await callFn<{ organizer_emailed: number; donor_emailed: boolean; donor_error?: string }>('coupon-secrets', {
      action: 'admin_add_outside', fundraiser_id: fundraiserId, brand: (fromStock ? selectedStock?.store_name : brand.trim()) || null,
      stock_id: fromStock ? stockId : null, value: fromStock ? null : Math.round(Number(value) * 100) / 100,
      code: fromStock ? null : code.trim() || null, pin: fromStock ? null : pin.trim() || null, redemption_url: fromStock ? null : link.trim() || null,
      value_expires_on: fromStock ? null : expiry || null, source_label: source.trim() || null,
      donor: mode === 'none' ? {} : mode === 'new' ? { name: name.trim() || null, email: email.trim() || null, anonymous: anon } : { name: picked?.name, email: picked?.email, user_id: picked?.user_id, anonymous: anon },
      email_donor: emailDonor && !!donorEmail, email_organizer: emailOrg,
    });
    setSaving(false);
    if (r.error) return setErr(r.error);
    toast({ title: 'Outside coupon added', description: [r.data?.organizer_emailed ? 'Organizer emailed.' : null, r.data?.donor_emailed ? 'Donor confirmation sent.' : r.data?.donor_error && emailDonor && donorEmail ? `Donor email: ${r.data.donor_error}` : null].filter(Boolean).join(' ') || 'Saved.' });
    onDone();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add outside coupon</DialogTitle>
          <DialogDescription>{['Coupon details', 'Donor and source', 'Review and confirm'][step]}</DialogDescription>
        </DialogHeader>
        <ol className="flex gap-4 text-xs text-muted-foreground">{['Coupon', 'Donor/source', 'Review'].map((label, i) => <li key={label} className={step === i ? 'font-medium text-primary' : ''}>{i + 1}. {label}</li>)}</ol>
        <div className="space-y-4 text-sm">
          {step === 0 && <>
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
              <DataTable columns={[{ key: 'stock', header: 'Available stock', cell: (r: any) => <span>{r.store_name} · {usd(r.value)} · {r.code_hint || '••••'}</span> }, { key: 'pick', header: '', cell: (r: any) => <Button size="sm" variant={stockId === r.id ? 'default' : 'outline'} onClick={() => { setStockId(r.id); setSelectedStock(r); }}>{stockId === r.id ? 'Selected' : 'Select'}</Button> }]} rows={stock.data?.rows} total={stock.data?.total} loading={stock.isLoading} error={stock.error ? (stock.error as Error).message : null} onRetry={() => stock.refetch()} page={stockPage} pageSize={10} onPage={setStockPage} rowKey={(r: any) => r.id} empty="No matching stock." />
              {selectedStock && <p className="mt-2 text-xs text-primary">Selected: {selectedStock.store_name} · {usd(selectedStock.value)}</p>}
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
          </>}
          {step === 1 && <>
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
              <div className="space-y-2"><Input aria-label="Search existing donors" placeholder="Search donor name or email" value={donorSearch} onChange={(e) => { setDonorSearch(e.target.value); setDonorPage(0); }} />
              <DataTable columns={[{ key: 'donor', header: 'Donor', cell: (r: any) => <div>{r.name || 'Guest'}<p className="text-xs text-muted-foreground">{r.email || 'No email'}</p></div> }, { key: 'pick', header: '', cell: (r: any) => <Button size="sm" variant={existing === r.key ? 'default' : 'outline'} onClick={() => { setExisting(r.key); setSelectedDonor(r); }}>{existing === r.key ? 'Selected' : 'Select'}</Button> }]} rows={donors.data?.rows} total={donors.data?.total} loading={donors.isLoading} error={donors.error ? (donors.error as Error).message : null} onRetry={() => donors.refetch()} page={donorPage} pageSize={10} onPage={setDonorPage} rowKey={(r: any) => r.key} empty="No donors match." />
              {picked && <p className="text-xs text-primary">Selected: {picked.name || picked.email || 'Guest'}</p>}</div>
            )}
            {mode !== 'none' && <label className="flex items-center gap-2"><Checkbox checked={anon} onCheckedChange={(v) => setAnon(!!v)} />Keep this donor anonymous</label>}
          </div>

          </>}
          {step === 2 && <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2"><dt className="text-muted-foreground">Brand</dt><dd>{fromStock ? selectedStock?.store_name : brand}</dd><dt className="text-muted-foreground">Value</dt><dd>{usd(fromStock ? selectedStock?.value : Number(value))}</dd><dt className="text-muted-foreground">Credential</dt><dd>{fromStock ? 'Stock · ••••' : code ? 'Code · ••••' : 'Hosted link · hidden'}</dd><dt className="text-muted-foreground">Source</dt><dd>{source || 'Not recorded'}</dd><dt className="text-muted-foreground">Donor</dt><dd className="break-words">{mode === 'none' ? 'No donor' : mode === 'new' ? name || email || 'Unnamed donor' : picked?.name || picked?.email}{anon && ' · anonymous'}</dd></dl>}
          {step > 0 && <div className="space-y-2 rounded-md bg-muted/50 p-3">
            <label className="flex items-center gap-2"><Checkbox checked={emailDonor && !!donorEmail} disabled={!donorEmail} onCheckedChange={(v) => setEmailDonor(!!v)} />Email the donor a confirmation{donorEmail ? ` (${donorEmail})` : ' — needs an email address'}</label>
            <label className="flex items-center gap-2"><Checkbox checked={emailOrg} onCheckedChange={(v) => setEmailOrg(!!v)} />Email the organizer that a coupon is ready</label>
          </div>}
          {err && <p className="text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={close} disabled={saving}>Cancel</Button>
          {step > 0 && <Button variant="outline" onClick={() => { setStep(step - 1); setErr(null); }} disabled={saving}>Back</Button>}
          {step < 2 ? <Button onClick={() => { setErr(null); if (step === 0 && ((!fromStock && (!brand.trim() || !(Number(value) > 0) || (!code.trim() && !link.trim()))) || (fromStock && !stockId))) { setErr('Complete the brand, value and credential or choose stock.'); return; } if (step === 1 && mode === 'existing' && !picked) { setErr('Choose an existing donor.'); return; } if (step === 1 && mode === 'new' && email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setErr('Enter a valid email.'); return; } setStep(step + 1); }}>Continue</Button> : <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Confirm and add coupon</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
