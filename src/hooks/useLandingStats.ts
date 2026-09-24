import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LandingStats {
  donations_count: number;
  total_raised: number;
  coupons_created: number;
  coupons_claimed: number;
  active_fundraisers: number;
  brands: { name: string; total: number }[];
}

// One shared request per page load so every section shows identical numbers.
let cache: Promise<LandingStats | null> | null = null;

function fetchStats(): Promise<LandingStats | null> {
  if (!cache) {
    cache = (async () => {
      const { data, error } = await (supabase.rpc as any)('get_landing_stats');
      if (error || !data) {
        cache = null;
        return null;
      }
      const d = data as any;
      return {
        donations_count: Number(d.donations_count) || 0,
        total_raised: Number(d.total_raised) || 0,
        coupons_created: Number(d.coupons_created) || 0,
        coupons_claimed: Number(d.coupons_claimed) || 0,
        active_fundraisers: Number(d.active_fundraisers) || 0,
        brands: (d.brands || []).map((b: any) => ({ name: b.name, total: Number(b.total) || 0 })),
      };
    })();
  }
  return cache;
}

export function useLandingStats() {
  const [stats, setStats] = useState<LandingStats | null>(null);
  useEffect(() => {
    let alive = true;
    fetchStats().then((s) => alive && setStats(s));
    return () => {
      alive = false;
    };
  }, []);
  return stats;
}

export const formatUSD = (n: number) =>
  '$' + Math.round(n).toLocaleString('en-US');
