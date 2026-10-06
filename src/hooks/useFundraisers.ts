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
      return await Promise.all(rows.map(async (row) => {
        const [totals, organizer, recent] = await Promise.all([
          supabase.rpc('get_fundraiser_totals' as never, { _fundraiser_id: row.id } as never).abortSignal(controller.signal),
          supabase.rpc('get_fundraiser_organizer' as never, { _fundraiser_id: row.id } as never).abortSignal(controller.signal),
          supabase.rpc('get_fundraiser_donations' as never, { _fundraiser_id: row.id, _limit: 1, _order: 'recent' } as never).abortSignal(controller.signal),
        ]);
        const failed = [totals, organizer, recent].find(result => result.error);
        if (failed?.error) throw failed.error;
        const totalRow = (totals.data as Array<{ total_raised: number; donations_count: number }> | null)?.[0];
        const organizerRow = (organizer.data as Array<{ display_name: string }> | null)?.[0];
        const recentRow = (recent.data as Array<{ created_at: string }> | null)?.[0];
        return {
          ...row,
          live_raised: Number(totalRow?.total_raised ?? 0),
          live_donations_count: Number(totalRow?.donations_count ?? 0),
          organizer_name: organizerRow?.display_name,
          latest_donation_at: recentRow?.created_at ?? null,
        } as Fundraiser;
      }));
      } finally { window.clearTimeout(timeout); }
    },
    retry: 1,
    retryDelay: 500,
    refetchInterval: () => document.hidden ? false : 30_000,
    refetchIntervalInBackground: false,
  });
}
