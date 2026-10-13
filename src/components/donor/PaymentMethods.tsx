import { useCallback, useEffect, useRef, useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { loadScript } from '@/components/landing/OnPagePayment';

type SavedCard = { square_card_id: string; brand: string | null; last4: string | null; exp_month: number | null; exp_year: number | null; monthly?: boolean };
type Gift = { id: string; card_id: string | null; status: string; total_cents: number };
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('payment-methods', { body });
  if (error) {
    let b: any = null; try { b = await (error as any).context?.json(); } catch { /* noop */ }
    return b ?? { error: 'Something went wrong. Please try again.' };
  }
  return data;
}

/** Saved cards (kept by Square). Donors can add, remove, and pick the card their monthly gift uses. */
export function PaymentMethods() {
  const { user } = useAuth();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const cardObj = useRef<any>(null);
  const paymentsRef = useRef<any>(null);
  const [formReady, setFormReady] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const d = await call({ action: 'list' });
    setCards(d?.cards ?? []); setGifts(d?.gifts ?? []); setLoading(false);
  }, []);
  useEffect(() => { setCards([]); setGifts([]); if (user) void refresh(); }, [user, refresh]);

  useEffect(() => {
    if (!adding) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: cfg } = await supabase.functions.invoke('payment-config');
        if (!cfg?.squareApplicationId) throw new Error('Card form is unavailable right now.');
        await loadScript(cfg.squareSandbox ? 'https://sandbox.web.squarecdn.com/v1/square.js' : 'https://web.squarecdn.com/v1/square.js');
        const payments = (window as any).Square.payments(cfg.squareApplicationId, cfg.squareLocationId);
        const card = await payments.card();
        if (cancelled) { card.destroy(); return; }
        await card.attach(formRef.current);
        cardObj.current = card; paymentsRef.current = payments; setFormReady(true);
      } catch (e) { toast.error(e instanceof Error ? e.message : 'Card form is unavailable.'); setAdding(false); }
    })();
    return () => { cancelled = true; try { cardObj.current?.destroy(); } catch { /* noop */ } cardObj.current = null; setFormReady(false); };
  }, [adding]);

  const save = async () => {
    if (!cardObj.current) return;
    setBusy('add');
    const r = await cardObj.current.tokenize();
    if (r.status !== 'OK') { setBusy(null); toast.error(r.errors?.[0]?.message ?? 'Please check the card details.'); return; }
    let verificationToken: string | undefined;
    try {
      const v = await paymentsRef.current.verifyBuyer(r.token, { intent: 'STORE', billingContact: { email: user?.email ?? undefined } });
      verificationToken = v?.token;
    } catch { /* verification is optional for some cards */ }
    const d = await call({ action: 'add', sourceId: r.token, verificationToken });
    setBusy(null);
    if (d?.error) { toast.error(d.error); return; }
    toast.success('Card saved'); setAdding(false); void refresh();
  };

  const remove = async (c: SavedCard, force = false) => {
    if (!force && !window.confirm(`Remove ${c.brand ?? 'card'} •••• ${c.last4}?`)) return;
    setBusy(c.square_card_id);
    const d = await call({ action: 'remove', cardId: c.square_card_id, force });
    setBusy(null);
    if (d?.error === 'monthly_in_use') {
      if (window.confirm('Your monthly gift uses this card. Removing it will pause the monthly gift until you pick another card. Remove anyway?')) return remove(c, true);
      return;
    }
    if (d?.error) { toast.error(d.error); return; }
    toast.success('Card removed'); void refresh();
  };

  const useForMonthly = async (giftId: string, cardId: string) => {
    setBusy(giftId);
    const d = await call({ action: 'set_monthly_card', recurringId: giftId, cardId });
    setBusy(null);
    if (d?.error) { toast.error(d.error); return; }
    toast.success('Monthly gift now uses this card'); void refresh();
  };

  if (!user) return null;
  return (
    <Card className="mb-6 rounded-md shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" />Payment methods</CardTitle>
        <CardDescription>Cards are stored securely by Square. We only keep the brand, last 4 digits and expiry.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : cards.length === 0 && !adding ? (
          <p className="text-sm text-muted-foreground">No saved cards yet.</p>
        ) : (
          <ul className="divide-y">
            {cards.map((c) => (
              <li key={c.square_card_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium tabular-nums">{c.brand ?? 'Card'} •••• {c.last4 ?? '----'}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.exp_month && c.exp_year ? `Expires ${String(c.exp_month).padStart(2, '0')}/${String(c.exp_year).slice(-2)}` : ''}
                    {c.monthly ? ' · Used for your monthly gift' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  {gifts.filter((g) => g.card_id !== c.square_card_id && g.status !== 'canceled').map((g) => (
                    <Button key={g.id} size="sm" variant="outline" className="min-h-11" disabled={busy === g.id} onClick={() => useForMonthly(g.id, c.square_card_id)}>
                      Use for {usd.format(g.total_cents / 100)} monthly
                    </Button>
                  ))}
                  <Button size="sm" variant="outline" className="min-h-11" disabled={busy === c.square_card_id} onClick={() => remove(c)}>Remove</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {adding ? (
          <div className="space-y-3">
            <div ref={formRef} />
            {!formReady && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            <p className="text-xs text-muted-foreground">By saving, you allow CouponDonation to charge this card only when you choose to give with it, or for a monthly gift you set up.</p>
            <div className="flex gap-2">
              <Button className="min-h-11" disabled={!formReady || busy === 'add'} onClick={save}>{busy === 'add' ? 'Saving…' : 'Save card'}</Button>
              <Button variant="ghost" className="min-h-11" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="min-h-11" onClick={() => setAdding(true)}>Add a card</Button>
        )}
      </CardContent>
    </Card>
  );
}
