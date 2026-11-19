import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { heroDonations } from '@/lib/heroDonations';

export interface FallingDonation {
  id: string;
  donorName: string;
  amount: number;
}

export function useFallingDonations() {
  const [donations, setDonations] = useState<FallingDonation[]>([]);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      try {
        const { data, error } = await supabase.rpc('get_hero_donations', { _limit: 20 });
        if (mounted) setDonations(error ? [] : heroDonations(data));
      } catch {
        if (mounted) setDonations([]);
      }
    };
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 30_000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return donations;
}
