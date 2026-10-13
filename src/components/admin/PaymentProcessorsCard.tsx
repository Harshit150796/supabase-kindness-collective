import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export function PaymentProcessorsCard() {
  const [on, setOn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.from('payment_settings' as never).select('square_enabled').eq('id', 1).maybeSingle()
      .then(({ data }) => setOn((data as { square_enabled: boolean } | null)?.square_enabled ?? null));
  }, []);

  const toggle = async (value: boolean) => {
    const prev = on;
    setOn(value);
    const { error } = await supabase.from('payment_settings' as never).update({ square_enabled: value } as never).eq('id', 1);
    if (error) { setOn(prev); toast.error('Could not save: ' + error.message); }
    else toast.success(`Square turned ${value ? 'on' : 'off'}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="w-5 h-5 text-primary" />Payment processors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {on === null ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor="square_enabled" className="font-medium">Square</Label>
              <Switch id="square_enabled" checked={on} onCheckedChange={toggle} />
            </div>
            <p className="text-xs text-muted-foreground">
              {on ? 'Square handles all payments: card, Apple Pay, Google Pay and Cash App Pay.'
                : 'Checkout is off — donors cannot pay online.'}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
