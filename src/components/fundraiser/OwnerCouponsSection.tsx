import { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Eye, EyeOff, ImagePlus, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { brandLogoFor } from '@/data/brandLogos';
import { callFn } from '@/lib/serverActions';
import { exportRedacted, loadReceipt, type Box } from '@/lib/receiptImage';
import { ReceiptRedactor } from '@/components/fundraiser/ReceiptRedactor';
import type { OwnerCoupon } from '@/components/fundraiser/DonationCouponList';

const CATEGORIES = ['Groceries', 'Meals', 'Baby supplies', 'Household', 'Transportation', 'Health', 'Other'];
const logoFor = (brand: string) => brandLogoFor(brand);
const kind = (t?: string | null) => t === 'gift_card' ? 'gift card' : t === 'prepaid_card' || t === 'prepaid_link' ? 'prepaid card' : 'coupon';
const group4 = (n: string) => n.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
const when = (iso: string) => format(new Date(iso), "MMM d, yyyy 'at' h:mm a");

type Revealed = {
  code: string | null; redemption_url: string | null; revealed_at: string; first?: boolean; type: string; card_exp: string | null; value_expires_on: string | null;
  instructions: string | null; issued_brand: string; cvv_purged?: boolean; secrets: { code?: string; pin?: string; number?: string; cvv?: string; name?: string; zip?: string };
};

export function OwnerCouponsSection({ coupons, isOwner, onChanged }: { coupons: OwnerCoupon[]; isOwner: boolean; onChanged: () => void }) {
  const [revealed, setRevealed] = useState<Record<string, Revealed>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [usedFor, setUsedFor] = useState<OwnerCoupon | null>(null);

  const groups = useMemo(() => {
    const m = new Map<string, OwnerCoupon[]>();
    for (const c of coupons) { const b = c.issued_brand || c.store_name; m.set(b, [...(m.get(b) ?? []), c]); }
    return [...m.entries()];
  }, [coupons]);

  const reveal = async (c: OwnerCoupon) => {
    setBusy(c.id);
    const { data, error } = await callFn<Revealed>('coupon-secrets', { action: 'owner_reveal', coupon_id: c.id });
    setBusy(null);
    if (error || !data) { toast({ title: 'Could not reveal this code', description: error === 'Coupon being prepared' ? 'This coupon is still being prepared.' : 'Please try again.', variant: 'destructive' }); return; }
    setRevealed((r) => ({ ...r, [c.id]: data }));
    if (data.first) onChanged();
  };
  const copy = async (id: string, code: string) => {
    try { await navigator.clipboard.writeText(code); setCopied(id); setTimeout(() => setCopied(null), 1500); } catch { /* blocked */ }
  };

  return (
    <section id="coupons" className="scroll-mt-24 rounded-2xl bg-card p-5 sm:p-6">
      <h2 className="font-display text-2xl font-normal text-foreground">Coupons</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isOwner ? 'Coupons your fundraiser received. Codes stay hidden until you reveal them.' : 'Coupon statuses for this fundraiser. Codes are visible to the fundraiser owner only.'}
      </p>
      {!coupons.length ? (
        <p className="mt-6 text-sm text-muted-foreground">No coupons yet. They appear here once a donation is completed.</p>
      ) : (
        <div className="mt-5 space-y-6">
          {groups.map(([brand, list]) => (
            <div key={brand}>
              <div className="mb-2 flex items-center gap-2">
                {logoFor(brand) && <img src={logoFor(brand)!} alt="" className="h-6 w-6 rounded bg-background object-contain p-0.5" />}
                <h3 className="font-medium text-foreground">{brand}</h3>
                <span className="text-xs text-muted-foreground">${list.reduce((s, c) => s + Number(c.value ?? 0), 0)} total</span>
              </div>
              <ul className="divide-y divide-border">
                {list.map((c) => {
                  const r = revealed[c.id];
                  const receivedAt = r?.revealed_at ?? c.revealed_at;
                  return (
                    <li key={c.id} className="py-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-foreground">${Number(c.value ?? 0)} {kind(c.credential_type)}{c.card_last4 && !r ? <span className="ml-2 text-xs font-normal text-muted-foreground">•••• {c.card_last4}</span> : null}</span>
                        <span className="text-xs text-muted-foreground">
                          {c.used_at ? `Used · ${when(c.used_at)}` : receivedAt ? `Received · ${when(receivedAt)}` : c.can_reveal || (!isOwner && ['claimed', 'reserved', 'redeemed'].includes(c.status)) ? 'Ready' : 'Coupon being prepared'}
                        </span>
                      </div>
                      {isOwner && c.can_reveal && !r && (
                        <Button size="sm" variant="outline" className="mt-2" disabled={busy === c.id} onClick={() => reveal(c)}>
                          {busy === c.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Eye className="mr-1 h-3.5 w-3.5" />}Reveal code
                        </Button>
                      )}
                      {!isOwner && ['claimed', 'reserved', 'redeemed'].includes(c.status) && <p className="mt-1 text-xs text-muted-foreground">Code visible to the fundraiser owner</p>}
                      {r && <RevealedDetails r={r} copied={copied} onCopy={(k, v) => copy(`${c.id}-${k}`, v)} idPrefix={c.id} onHide={() => setRevealed((x) => { const n = { ...x }; delete n[c.id]; return n; })} />}
                      {c.used_at && (c.used_category || c.used_note) && (
                        <p className="mt-1 text-xs text-muted-foreground">{c.used_category}{c.used_category && c.used_note ? ' · ' : ''}{c.used_note ? `“${c.used_note}”` : ''}{c.receipt_count ? ` · ${c.receipt_count} receipt${c.receipt_count > 1 ? 's' : ''}` : ''}</p>
                      )}
                      {isOwner && receivedAt && (
                        <Button size="sm" variant={c.used_at ? 'ghost' : 'default'} className="mt-2" onClick={() => setUsedFor(c)}>
                          {c.used_at ? 'Add a receipt' : 'Used'}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
      {usedFor && <MarkUsedDialog coupon={usedFor} onClose={() => setUsedFor(null)} onDone={() => { setUsedFor(null); onChanged(); }} />}
    </section>
  );
}

function RevealedDetails({ r, copied, onCopy, idPrefix, onHide }: { r: Revealed; copied: string | null; onCopy: (k: string, v: string) => void; idPrefix: string; onHide: () => void }) {
  const s = r.secrets ?? {};
  const fields: { k: string; label: string; v: string; shown?: string }[] = [
    ...(r.code ? [{ k: 'code', label: 'Code', v: r.code }] : []),
    ...(s.code ? [{ k: 'code', label: 'Code', v: s.code }] : []),
    ...(s.number ? [{ k: 'number', label: 'Card number', v: s.number.replace(/\D/g, '') || s.number, shown: /^\d+$/.test(s.number.replace(/[\s-]/g, '')) ? group4(s.number) : s.number }] : []),
    ...(r.card_exp ? [{ k: 'exp', label: 'Expires', v: r.card_exp }] : []),
    ...(s.cvv ? [{ k: 'cvv', label: 'CVV', v: s.cvv }] : []),
    ...(s.pin ? [{ k: 'pin', label: 'PIN', v: s.pin }] : []),
    ...(s.name ? [{ k: 'name', label: 'Name on card', v: s.name }] : []),
    ...(s.zip ? [{ k: 'zip', label: 'Billing ZIP', v: s.zip }] : []),
  ];
  return (
    <div className="mt-2 space-y-2">
      {fields.map((f) => (
        <div key={f.k} className="flex flex-wrap items-center gap-2">
          <span className="w-24 text-xs text-muted-foreground">{f.label}</span>
          <code className="break-all rounded bg-muted px-2 py-1 font-mono text-sm tracking-wide text-foreground">{f.shown ?? f.v}</code>
          <Button size="sm" variant="outline" onClick={() => onCopy(f.k, f.v)}>
            {copied === `${idPrefix}-${f.k}` ? <><Check className="mr-1 h-3.5 w-3.5" />Copied</> : <><Copy className="mr-1 h-3.5 w-3.5" />Copy</>}
          </Button>
        </div>
      ))}
      {r.cvv_purged && <p className="text-xs text-muted-foreground">For safety, the CVV was deleted 30 days after you first revealed this card.</p>}
      {r.value_expires_on && <p className="text-xs text-muted-foreground">Use by {format(new Date(r.value_expires_on + 'T12:00:00'), 'MMM d, yyyy')}</p>}
      {r.instructions && <p className="text-sm text-foreground">{r.instructions}</p>}
      <div className="flex flex-wrap gap-2">
        {r.redemption_url && <Button size="sm" variant="ghost" asChild><a href={r.redemption_url} target="_blank" rel="noopener noreferrer">{r.type === 'prepaid_link' ? 'Open your card' : 'Redeem'} <ExternalLink className="ml-1 h-3.5 w-3.5" /></a></Button>}
        <Button size="sm" variant="ghost" onClick={onHide}><EyeOff className="mr-1 h-3.5 w-3.5" />Hide</Button>
      </div>
    </div>
  );
}

function MarkUsedDialog({ coupon, onClose, onDone }: { coupon: OwnerCoupon; onClose: () => void; onDone: () => void }) {
  const already = !!coupon.used_at;
  const [category, setCategory] = useState<string>(coupon.used_category ?? '');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<{ bitmap: ImageBitmap; boxes: Box[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const left = 3 - (coupon.receipt_count ?? 0);

  const pick = async (f?: File) => {
    setErr(null);
    if (!f) return;
    try { setPhoto({ bitmap: await loadReceipt(f), boxes: [] }); } catch (e) { setErr((e as Error).message); }
  };

  const save = async () => {
    setSaving(true); setErr(null);
    if (!already) {
      const r = await callFn('impact-actions', { action: 'mark_used', coupon_id: coupon.id, category: category || null, note: note.trim() || null });
      if (r.error) { setSaving(false); setErr(r.error); return; }
    }
    if (photo) {
      try {
        const out = await exportRedacted(photo.bitmap, photo.boxes);
        const r = await callFn('impact-actions', { action: 'upload_receipt', coupon_id: coupon.id, data_base64: out.base64, width: out.width, height: out.height });
        if (r.error) { setSaving(false); setErr(r.error); if (!already) onDone(); return; }
      } catch (e) { setSaving(false); setErr((e as Error).message); return; }
    }
    setSaving(false);
    toast({ title: already ? 'Receipt added' : 'Marked as used', description: 'Your donor will get a short note. Thank you.' });
    onDone();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{already ? 'Add a receipt' : `Mark your $${Number(coupon.value ?? 0)} ${coupon.store_name} coupon as used`}</DialogTitle>
          <DialogDescription>Everything here is optional. Sharing less never affects your help.</DialogDescription>
        </DialogHeader>
        {!already && (
          <div className="space-y-3">
            <div>
              <Label>What was it for? (optional)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>A short note for your donor (optional)</Label>
              <Textarea className="mt-1" maxLength={140} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Groceries for the week" />
              <p className="mt-1 text-right text-xs text-muted-foreground">{note.length}/140</p>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label>Receipt photo (optional)</Label>
          {left <= 0 ? <p className="text-xs text-muted-foreground">You’ve added the maximum of 3 receipts.</p> : !photo ? (
            <label className="flex cursor-pointer items-center gap-2 rounded-md bg-muted px-3 py-3 text-sm text-foreground">
              <ImagePlus className="h-4 w-4" /> Choose a photo (JPEG, PNG or WebP)
              <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
            </label>
          ) : (
            <div className="space-y-2">
              <ReceiptRedactor bitmap={photo.bitmap} boxes={photo.boxes} onChange={(boxes) => setPhoto({ ...photo, boxes })} />
              <Button type="button" size="sm" variant="ghost" onClick={() => setPhoto(null)}><X className="mr-1 h-3.5 w-3.5" />Remove photo</Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Only your donor, you and CouponDonation staff can see receipts. They are never shown on your fundraiser page.</p>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || (already && !photo)}>{saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{already ? 'Upload receipt' : 'Mark as used'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
