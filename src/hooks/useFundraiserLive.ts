import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicDonation { id: string; display_name: string; is_anonymous: boolean; amount: number; message: string | null; created_at: string }
export interface FundraiserLive {
  totalRaised: number; donationsCount: number; retailers: string[];
  recent: PublicDonation[]; converted: number; redeemed: number; couponsCount: number;
  loaded: boolean; justDonated: PublicDonation | null;
}

const rpc = async <T,>(fn: string, args: Record<string, unknown>) => {
  const { data, error } = await supabase.rpc(fn as never, args as never);
  if (error) throw error;
  return data as unknown as T;
};

export async function fetchFundraiserDonations(fid: string, order: 'recent' | 'top', limit = 50) {
  const rows = await rpc<PublicDonation[]>('get_fundraiser_donations', { _fundraiser_id: fid, _limit: limit, _order: order });
  return (rows ?? []).map((r) => ({ ...r, amount: Number(r.amount) }));
}

/**
 * Live totals computed from completed donations via public read functions.
 * Polls every 30 seconds while the tab is visible — no realtime on payment tables (AGENTS.md).
 */
export function useFundraiserLive(fundraiserId: string | undefined): FundraiserLive {
  const [state, setState] = useState<FundraiserLive>({ totalRaised: 0, donationsCount: 0, retailers: [], recent: [], converted: 0, redeemed: 0, couponsCount: 0, loaded: false, justDonated: null });
  const lastTop = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!fundraiserId) return;
    try {
      const [totals, recent, trail] = await Promise.all([
        rpc<Array<{ total_raised: number; donations_count: number; retailers: string[] }>>('get_fundraiser_totals', { _fundraiser_id: fundraiserId }),
        fetchFundraiserDonations(fundraiserId, 'recent', 5),
        rpc<Array<{ converted: number; redeemed: number; coupons_count: number }>>('get_fundraiser_coupon_trail', { _fundraiser_id: fundraiserId }).catch(() => []),
      ]);
      const t = totals?.[0]; const c = trail?.[0];
      const newest = recent[0];
      const isNew = lastTop.current !== null && newest && newest.id !== lastTop.current;
      lastTop.current = newest?.id ?? '';
      setState((s) => ({
        totalRaised: Number(t?.total_raised ?? 0), donationsCount: Number(t?.donations_count ?? 0), retailers: t?.retailers ?? [],
        recent, converted: Number(c?.converted ?? 0), redeemed: Number(c?.redeemed ?? 0), couponsCount: Number(c?.coupons_count ?? 0),
        loaded: true, justDonated: isNew ? newest : s.justDonated,
      }));
    } catch (e) {
      console.error('fundraiser live load failed', e);
      setState((s) => ({ ...s, loaded: true }));
    }
  }, [fundraiserId]);

  useEffect(() => {
    if (!fundraiserId) return;
    load();
    let timer: number | undefined;
    const start = () => { stop(); timer = window.setInterval(load, 30_000); };
    const stop = () => { if (timer) window.clearInterval(timer); timer = undefined; };
    const onVis = () => { if (document.hidden) stop(); else { load(); start(); } };
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, [fundraiserId, load]);

  useEffect(() => {
    if (!state.justDonated) return;
    const t = window.setTimeout(() => setState((s) => ({ ...s, justDonated: null })), 6000);
    return () => window.clearTimeout(t);
  }, [state.justDonated]);

  return state;
}

export const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
export const usd = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: n % 1 ? 2 : 0 })}`;
