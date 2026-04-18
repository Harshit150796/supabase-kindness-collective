import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FallingDonation {
  id: string;
  donorName: string;
  amount: number;
}

function nameFromEmail(email: string | null): string {
  if (!email) return 'A generous donor';
  const local = email.split('@')[0];
  const clean = local.replace(/[._-]/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1) + '.';
}

const FALLBACK: FallingDonation[] = [
  { id: 'f1', donorName: 'Sarah M.', amount: 25 },
  { id: 'f2', donorName: 'James K.', amount: 50 },
  { id: 'f3', donorName: 'Priya S.', amount: 10 },
  { id: 'f4', donorName: 'A generous donor', amount: 100 },
  { id: 'f5', donorName: 'Mike R.', amount: 15 },
  { id: 'f6', donorName: 'Emma L.', amount: 75 },
];

export function useFallingDonations() {
  const [donations, setDonations] = useState<FallingDonation[]>(FALLBACK);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from('donations')
        .select('id, amount, donor_email, is_anonymous')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!mounted || error || !data || data.length === 0) return;

      const mapped: FallingDonation[] = data.map((d: any) => ({
        id: d.id,
        donorName: d.is_anonymous ? 'Anonymous' : nameFromEmail(d.donor_email),
        amount: Number(d.amount) || 0,
      }));
      setDonations(mapped);
    })();

    const channel = supabase
      .channel('hero-tree-donations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'donations' },
        (payload: any) => {
          const d = payload.new;
          if (d.status !== 'completed') return;
          const item: FallingDonation = {
            id: d.id,
            donorName: d.is_anonymous ? 'Anonymous' : nameFromEmail(d.donor_email),
            amount: Number(d.amount) || 0,
          };
          setDonations((prev) => [item, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return donations;
}
