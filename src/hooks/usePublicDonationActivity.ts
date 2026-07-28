import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicDonation {
  id: string;
  displayName: string;
  amount: number;
  brand: string | null;
  createdAt: string;
}

export interface PublicDonationStats {
  donationsCount: number;
  totalRaised: number;
}

/** Human "2m ago" style label from an ISO timestamp. */
export function relativeTime(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 45) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

/**
 * Real donation activity for the public homepage.
 *
 * Everything here comes from completed donations in the database — nothing is
 * generated or padded. When there are no donations yet, `stats` is zeroed and
 * `recent` is empty so the UI can show an honest empty state.
 */
export function usePublicDonationActivity() {
  const [stats, setStats] = useState<PublicDonationStats | null>(null);
  const [recent, setRecent] = useState<PublicDonation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [statsRes, recentRes] = await Promise.all([
        supabase.rpc('get_public_donation_stats'),
        supabase.rpc('get_recent_public_donations', { _limit: 8 }),
      ]);
      if (cancelled) return;

      const row = Array.isArray(statsRes.data) ? statsRes.data[0] : statsRes.data;
      if (!statsRes.error && row) {
        setStats({
          donationsCount: Number((row as any).donations_count) || 0,
          totalRaised: Number((row as any).total_raised) || 0,
        });
      }

      if (!recentRes.error && Array.isArray(recentRes.data)) {
        setRecent(
          (recentRes.data as any[]).map((d) => ({
            id: d.id,
            displayName: d.display_name,
            amount: Number(d.amount) || 0,
            brand: d.brand_partner ?? null,
            createdAt: d.created_at,
          })),
        );
      }

      setLoading(false);
    };

    load();
    const poll = setInterval(load, 60_000);

    const channel = supabase
      .channel('public-donation-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'donations' },
        () => setTimeout(load, 4000),
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats, recent, loading };
}
