import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Publishable key — safe to ship in the browser.
const STRIPE_PK = 'pk_live_51Sgpd8J31hV93H57cYNzxS3qIaQRG6hNu0irdovdYksI1zggjevvwbyjtSYjPvMZmlkiMlMUaXkH3iMcpfshJSXd00ebX6jSVQ';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { Stripe?: any; Square?: any } }

const scriptCache: Record<string, Promise<void>> = {};
function loadScript(src: string) {
  if (!scriptCache[src]) {
    scriptCache[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { delete scriptCache[src]; reject(new Error('Could not load the secure payment form.')); };
      document.head.appendChild(s);
    });
  }
  return scriptCache[src];
}

export interface DonationPayload {
  amount: number;
  brandName: string;
  brandId: string;
  brandAllocations: { brand: string; brandId: string; percent: number; amount: number }[];
  userId: string | null;
  userEmail: string | null;
  fundraiserId: string | null;
}

interface Props {
  provider: 'square' | 'stripe';
  payload: DonationPayload;
  onCancel: () => void;
}

export function OnPagePayment({ provider, payload, onCancel }: Props) {
  return provider === 'stripe'
    ? <StripeEmbedded payload={payload} onCancel={onCancel} />
    : <SquareInline payload={payload} onCancel={onCancel} />;
}

function Frame({ title, children, onCancel, busy }: { title: string; children: React.ReactNode; onCancel: () => void; busy?: boolean }) {
  return (
    <div className="space-y-4" data-testid="onpage-payment">
      <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
        <Lock className="w-4 h-4 text-primary" /> {title}
      </div>
      {children}
      <Button variant="ghost" size="lg" className="w-full" onClick={onCancel} disabled={busy}>
        Back to payment options
      </Button>
    </div>
  );
}

function StripeEmbedded({ payload, onCancel }: { payload: DonationPayload; onCancel: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let checkout: any; let cancelled = false;
    (async () => {
      try {
        await loadScript('https://js.stripe.com/v3/');
        const { data, error } = await supabase.functions.invoke('create-stripe-checkout', { body: { ...payload, embedded: true } });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        if (!data?.clientSecret) throw new Error('Stripe did not return a payment form.');
        const stripe = window.Stripe(STRIPE_PK);
        checkout = await stripe.initEmbeddedCheckout({ clientSecret: data.clientSecret });
        if (cancelled) { checkout.destroy(); return; }
        checkout.mount(mountRef.current);
        setLoading(false);
      } catch (e) {
        if (!cancelled) { setError(e instanceof Error ? e.message : 'Unable to load payment form.'); setLoading(false); }
      }
    })();
    return () => { cancelled = true; try { checkout?.destroy(); } catch { /* noop */ } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Frame title="Secure payment by Stripe" onCancel={onCancel}>
      {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      <div ref={mountRef} className="rounded-xl overflow-hidden" />
    </Frame>
  );
}

function SquareInline({ payload, onCancel }: { payload: DonationPayload; onCancel: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const gpayRef = useRef<HTMLDivElement>(null);
  const cardObj = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charge = async (sourceId: string) => {
    setBusy(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-square-payment', { body: { ...payload, sourceId } });
      if (data?.error) throw new Error(data.error);
      if (error) {
        let msg = 'Payment failed. Please try again.';
        try { const b = await (error as any).context?.json(); if (b?.error) msg = b.error; } catch { /* noop */ }
        throw new Error(msg);
      }
      window.location.assign(`/donation-success?amount=${payload.amount}&meals=${payload.amount * 2}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed.');
      setBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false; let gpay: any;
    (async () => {
      try {
        const { data: cfg, error } = await supabase.functions.invoke('payment-config');
        if (error || !cfg?.squareApplicationId) throw new Error('Square is not available right now.');
        await loadScript(cfg.squareSandbox ? 'https://sandbox.web.squarecdn.com/v1/square.js' : 'https://web.squarecdn.com/v1/square.js');
        const payments = window.Square.payments(cfg.squareApplicationId, cfg.squareLocationId);
        const card = await payments.card();
        if (cancelled) { card.destroy(); return; }
        await card.attach(cardRef.current);
        cardObj.current = card;
        setReady(true);
        // Google Pay (optional — silently skipped if the device/browser doesn't support it)
        try {
          const req = payments.paymentRequest({ countryCode: 'US', currencyCode: 'USD', total: { amount: payload.amount.toFixed(2), label: 'Donation' } });
          gpay = await payments.googlePay(req);
          if (!cancelled && gpayRef.current) {
            await gpay.attach(gpayRef.current);
            gpayRef.current.onclick = async () => {
              const r = await gpay.tokenize();
              if (r.status === 'OK') charge(r.token);
            };
          }
        } catch { /* not supported */ }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load payment form.');
      }
    })();
    return () => { cancelled = true; try { cardObj.current?.destroy(); gpay?.destroy(); } catch { /* noop */ } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const payCard = async () => {
    if (!cardObj.current) return;
    setError(null);
    const r = await cardObj.current.tokenize();
    if (r.status === 'OK') charge(r.token);
    else setError(r.errors?.[0]?.message || 'Please check your card details.');
  };

  return (
    <Frame title="Secure payment by Square" onCancel={onCancel} busy={busy}>
      <div ref={gpayRef} />
      {!ready && !error && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      <div ref={cardRef} />
      {error && <p className="text-center text-sm text-destructive" role="alert">{error}</p>}
      <Button size="lg" className="w-full" onClick={payCard} disabled={!ready || busy}>
        {busy
          ? <span className="flex items-center"><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</span>
          : <span className="flex items-center">Donate ${payload.amount}<Heart className="w-4 h-4 ml-2" /></span>}
      </Button>
    </Frame>
  );
}
