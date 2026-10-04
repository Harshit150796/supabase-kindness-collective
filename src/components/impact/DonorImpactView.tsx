import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Loader2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { callFn, signInPath } from '@/lib/serverActions';

export type ImpactCoupon = {
  id: string; store_name: string; value: number; status: string; created_at: string;
  revealed_at: string | null; used_at: string | null; used_category: string | null; used_note: string | null;
  receipt_count: number; receipt_requested: boolean;
  issued_brand?: string | null; brand_change_reason?: string | null; credential_type?: string | null;
};
export type DonationImpact = {
  donation_id: string; amount: number; created_at: string; fundraiser_id: string | null;
  fundraiser_title: string | null; fundraiser_slug: string | null; organizer: string | null; coupons: ImpactCoupon[];
  brands?: { brand: string; allocated: number; issued: number; topup: number; topup_reasons: { amount: number; reason: string }[] }[];
};

const kind = (t?: string | null) => t === 'gift_card' ? 'gift card' : t === 'prepaid_card' || t === 'prepaid_link' ? 'prepaid card' : 'coupon';
const usd = (n: number) => `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`;
const d = (iso: string) => format(new Date(iso), "MMM d, yyyy 'at' h:mm a");

function Step({ label, at, done }: { label: string; at?: string | null; done: boolean }) {
  return (
    <li className="flex items-baseline gap-3">
      <span className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${done ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
      <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}{at ? <span className="ml-2 text-xs text-muted-foreground">{d(at)}</span> : !done ? <span className="ml-2 text-xs">pending</span> : null}</span>
    </li>
  );
}

/** Per-donation impact timeline. mode 'guest' = read-only token view; messaging needs sign-in. */
export function DonorImpactView({ impact, mode, token, returnTo }: { impact: DonationImpact; mode: 'signed' | 'guest'; token?: string; returnTo?: string }) {
  const [receipts, setReceipts] = useState<Record<string, { id: string; url: string }[]>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [asked, setAsked] = useState<Record<string, boolean>>({});
  const [thanks, setThanks] = useState('');
  const [sending, setSending] = useState(false);

  const showReceipts = async (c: ImpactCoupon) => {
    setLoading(c.id);
    const r = await callFn<{ receipts: { id: string; url: string }[] }>('impact-actions', { action: 'receipt_urls', coupon_id: c.id, ...(mode === 'guest' && token ? { token } : {}) });
    setLoading(null);
    if (r.error) { toast({ title: 'Could not open receipts', description: r.error, variant: 'destructive' }); return; }
    setReceipts((x) => ({ ...x, [c.id]: r.data?.receipts ?? [] }));
  };
  const ask = async (c: ImpactCoupon) => {
    setLoading(`ask-${c.id}`);
    const r = await callFn('impact-actions', { action: 'ask_receipt', coupon_id: c.id });
    setLoading(null);
    if (r.error) { toast({ title: 'Request not sent', description: r.error, variant: r.blocked ? 'destructive' : undefined }); if (!r.blocked) setAsked((a) => ({ ...a, [c.id]: true })); return; }
    setAsked((a) => ({ ...a, [c.id]: true }));
    toast({ title: 'Request sent', description: 'The recipient can choose whether to share. We won’t ask again.' });
  };
  const sendThanks = async () => {
    if (!impact.fundraiser_id || !thanks.trim()) return;
    setSending(true);
    const r = await callFn('send-message', { fundraiser_id: impact.fundraiser_id, body: thanks.trim(), ref_donation_id: impact.donation_id });
    setSending(false);
    if (r.error) { toast({ title: 'Message not sent', description: r.error, variant: 'destructive' }); return; }
    setThanks('');
    toast({ title: 'Thank-you sent', description: 'You can see replies in Messages.' });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Your ${Number(impact.amount)} donation · {format(new Date(impact.created_at), 'MMM d, yyyy')}</p>
        {impact.fundraiser_title && <p className="font-display text-xl text-foreground">{impact.fundraiser_title}{impact.organizer ? <span className="text-base text-muted-foreground"> · {impact.organizer}</span> : null}</p>}
      </div>
      {!impact.coupons.length && <p className="text-sm text-muted-foreground">Your coupons are being prepared.</p>}
      {(impact.brands ?? []).map((b) => {
        const left = Math.round((Number(b.allocated) + Number(b.topup) - Number(b.issued)) * 100) / 100;
        return (b.topup > 0 || left > 0.004) ? (
          <div key={b.brand} className="space-y-1 text-sm text-muted-foreground">
            {left > 0.004 && <p>{usd(left)} of your {b.brand} gift is being prepared.</p>}
            {(b.topup_reasons ?? []).map((t, i) => <p key={i}>CouponDonation added {usd(t.amount)} to your {b.brand} gift: {t.reason}</p>)}
          </div>) : null;
      })}
      <ul className="space-y-4">
        {impact.coupons.map((c) => (
          <li key={c.id} className="rounded-xl bg-muted/40 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-2xl text-foreground">${Number(c.value)}</span>
              <span className="text-sm font-medium text-foreground">{c.issued_brand || c.store_name} {kind(c.credential_type)}</span>
            </div>
            {c.issued_brand && c.issued_brand.toLowerCase() !== c.store_name.toLowerCase() && (
              <p className="mt-1 text-sm text-muted-foreground">You chose {c.store_name}; it was issued as a {c.issued_brand} {kind(c.credential_type)}{c.brand_change_reason ? ` because ${c.brand_change_reason.replace(/^because\s+/i, '').replace(/\.$/, '')}` : ''}.</p>
            )}
            <ol className="mt-3 space-y-1.5 text-sm">
              <Step label="Donated" at={impact.created_at} done />
              <Step label="Coupon created" at={c.created_at} done />
              <Step label="Received" at={c.revealed_at} done={!!c.revealed_at} />
              <Step label="Used" at={c.used_at} done={!!c.used_at} />
            </ol>
            {(c.used_category || c.used_note) && (
              <p className="mt-3 text-sm text-foreground">{c.used_category && <strong className="font-medium">Used for {c.used_category.toLowerCase()}</strong>}{c.used_note && <span className="block font-display text-base italic">“{c.used_note}”</span>}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {c.receipt_count > 0 && (
                <Button size="sm" variant="outline" onClick={() => showReceipts(c)} disabled={loading === c.id}>
                  {loading === c.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Receipt className="mr-1 h-3.5 w-3.5" />}View receipt{c.receipt_count > 1 ? 's' : ''}
                </Button>
              )}
              {mode === 'signed' && c.revealed_at && !c.receipt_count && (
                c.receipt_requested || asked[c.id]
                  ? <span className="text-xs text-muted-foreground">Receipt requested — sharing is up to the recipient.</span>
                  : <Button size="sm" variant="ghost" onClick={() => ask(c)} disabled={loading === `ask-${c.id}`}>Ask for a receipt</Button>
              )}
            </div>
            {receipts[c.id]?.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {receipts[c.id].map((r) => <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"><img src={r.url} alt="Receipt shared by the recipient" className="w-full rounded-md object-contain" /></a>)}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <div id="thanks" className="scroll-mt-24 space-y-2">
        <p className="text-sm font-medium text-foreground">Send a thank-you</p>
        {mode === 'signed' ? (
          <>
            <Textarea rows={3} maxLength={2000} value={thanks} onChange={(e) => setThanks(e.target.value)} placeholder="A few kind words for the organizer" />
            <Button size="sm" onClick={sendThanks} disabled={sending || !thanks.trim()}>{sending && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}Send</Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">To send a message, <Link className="text-primary" to={signInPath(returnTo ?? '/my-impact')}>sign in</Link> with the email you donated with.</p>
        )}
      </div>
    </div>
  );
}
