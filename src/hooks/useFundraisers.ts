import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FundraiserImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface Fundraiser {
  id: string;
  title: string;
  story: string;
  category: string;
  monthly_goal: number;
  amount_raised: number;
  donors_count: number;
  unique_slug: string;
  cover_photo_url: string | null;
  country: string | null;
  zip_code: string | null;
  status: string;
  created_at: string;
  fundraiser_images?: FundraiserImage[];
  organizer_name?: string;
  live_raised: number;
  live_donations_count: number;
  latest_donation_at?: string | null;
}

export function useFundraisers(options?: { limit?: number; category?: string }) {
  return useQuery({
    queryKey: ['fundraisers', 'active', options?.category, options?.limit],
    queryFn: async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      try {
      let query = supabase
        .from('fundraisers')
        .select(`
          id, title, story, category, monthly_goal, amount_raised, donors_count, 
          unique_slug, cover_photo_url, country, zip_code, status, created_at,
          fundraiser_images (id, image_url, is_primary, display_order)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);

      if (options?.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching fundraisers:', error);
        throw error;
      }

      const rows = (data || []) as Omit<Fundraiser, 'live_raised' | 'live_donations_count'>[];
      if (rows.length === 0) return [] as Fundraiser[];
      // One batched, privacy-safe request for every card's live numbers.
      const cards = await supabase
        .rpc('get_fundraiser_cards' as never, { _ids: rows.map(r => r.id) } as never)
        .abortSignal(controller.signal);
      if (cards.error) throw cards.error;
      const byId = new Map(((cards.data as Array<{ fundraiser_id: string; total_raised: number; donations_count: number; organizer_name: string | null; latest_donation_at: string | null }> | null) ?? []).map(c => [c.fundraiser_id, c]));
      return rows.map((row) => {
        const c = byId.get(row.id);
        return {
          ...row,
          live_raised: Number(c?.total_raised ?? 0),
          live_donations_count: Number(c?.donations_count ?? 0),
          organizer_name: c?.organizer_name ?? undefined,
          latest_donation_at: c?.latest_donation_at ?? null,
        } as Fundraiser;
      });
      } finally { window.clearTimeout(timeout); }
    },
    retry: 1,
    retryDelay: 500,
    refetchInterval: () => document.hidden ? false : 30_000,
    refetchIntervalInBackground: false,
  });
}
