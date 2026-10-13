import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Row = { id: string; gift_cents: number; tip_cents: number; fee_cents: number; brand_name: string | null; status: string; created_at: string };
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** The donor's monthly gifts, each with a Cancel button. Hidden when there are none. */
export function MonthlyGifts() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setRows([]); return; }
    supabase.from('recurring_donations' as never).select('id, gift_cents, tip_cents, fee_cents, brand_name, status, created_at')
      .neq('status', 'canceled').order('created_at', { ascending: false })
      .then(({ data }) => setRows((data as Row[] | null) ?? []));
  }, [user]);

  const cancel = async (id: string) => {
    if (!window.confirm('Cancel this monthly gift? No further charges will be made.')) return;
    setBusy(id);
    const { data, error } = await supabase.functions.invoke('recurring-actions', { body: { action: 'cancel', id } });
    setBusy(null);
    if (error || data?.error) { toast.error(data?.error ?? 'Could not cancel. Please try again.'); return; }
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success('Monthly gift cancelled');
  };

  if (!rows.length) return null;
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Monthly gift</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium tabular-nums">{usd.format((r.gift_cents + r.tip_cents + r.fee_cents) / 100)} every month</p>
              <p className="text-sm text-muted-foreground">
                {usd.format(r.gift_cents / 100)} to families{r.brand_name ? ` via ${r.brand_name}` : ''}{r.status === 'pending' ? ' · starting after first payment' : ''}
              </p>
            </div>
            <Button variant="outline" size="sm" disabled={busy === r.id} onClick={() => cancel(r.id)}>Cancel</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
