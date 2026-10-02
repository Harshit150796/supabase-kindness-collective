import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const sb = supabase as any;

/** Real Gold Coins balance from loyalty_cards + own ledger; claims verified-email guest credits on mount. */
export function GoldCoinsBalance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  useEffect(() => {
    if (!user) return;
    sb.rpc('claim_gold_coins').then(({ data }: { data: number }) => { if (data > 0) qc.invalidateQueries({ queryKey: ['gold-coins', user.id] }); });
  }, [user, qc]);
  const { data } = useQuery({
    queryKey: ['gold-coins', user?.id], enabled: !!user,
    queryFn: async () => {
      const [card, ledger] = await Promise.all([
        sb.from('loyalty_cards').select('points_balance').eq('user_id', user!.id).maybeSingle(),
        sb.from('gold_coin_ledger').select('id, coins, entry_type, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
      ]);
      return { balance: Number(card.data?.points_balance ?? 0), recent: (ledger.data ?? []) as { id: string; coins: number; entry_type: string; created_at: string }[] };
    },
  });
  if (!user) return null;
  return (
    <section className="bg-primary/5 p-6" aria-label="Gold Coins">
      <p className="text-sm text-muted-foreground">Gold Coins balance</p>
      <p className="font-display text-5xl tabular-nums">{(data?.balance ?? 0).toLocaleString()}</p>
      <p className="mt-1 text-sm text-muted-foreground">You earn 10 Gold Coins for every $1 donated. New donations are credited within a few minutes.</p>
      {!!data?.recent.length && (
        <ul className="mt-4 space-y-1 text-sm tabular-nums">
          {data.recent.map((r) => <li key={r.id} className="flex justify-between"><span>{r.entry_type === 'reversal' ? 'Refund reversal' : 'Donation credit'} · {new Date(r.created_at).toLocaleDateString()}</span><span>{r.coins > 0 ? '+' : ''}{r.coins}</span></li>)}
        </ul>
      )}
    </section>
  );
}
