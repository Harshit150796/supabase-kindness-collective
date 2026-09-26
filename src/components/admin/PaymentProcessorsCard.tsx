import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';

type Settings = { square_enabled: boolean; stripe_enabled: boolean };

export function PaymentProcessorsCard() {
  const [s, setS] = useState<Settings | null>(null);

  useEffect(() => {
    supabase.from('payment_settings' as never).select('square_enabled, stripe_enabled').eq('id', 1).maybeSingle()
      .then(({ data }) => setS(data as Settings | null));
  }, []);

  const toggle = async (key: keyof Settings, value: boolean) => {
    if (!s) return;
    const prev = s;
    setS({ ...s, [key]: value });
    const { error } = await supabase.from('payment_settings' as never).update({ [key]: value } as never).eq('id', 1);
    if (error) { setS(prev); toast.error('Could not save: ' + error.message); }
    else toast.success(`${key === 'square_enabled' ? 'Square' : 'Stripe'} turned ${value ? 'on' : 'off'}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="w-5 h-5 text-primary" />Payment processors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!s ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <>
            {(['square_enabled', 'stripe_enabled'] as const).map((k) => (
              <div key={k} className="flex items-center justify-between">
                <Label htmlFor={k} className="font-medium">{k === 'square_enabled' ? 'Square' : 'Stripe'}</Label>
                <Switch id={k} checked={s[k]} onCheckedChange={(v) => toggle(k, v)} />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              {s.square_enabled && s.stripe_enabled ? 'Donors choose between both at checkout.'
                : s.square_enabled || s.stripe_enabled ? 'Donors see a single checkout button.'
                : 'Checkout is off — donors cannot pay online.'}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
