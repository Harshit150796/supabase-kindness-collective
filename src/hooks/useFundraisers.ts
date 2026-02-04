import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FundraiserImage {
  id: string;
  image_url: string;
  is_primary: boolean;
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
  status: string;
  created_at: string;
  fundraiser_images?: FundraiserImage[];
}

export function useFundraisers(options?: { limit?: number; category?: string }) {
  return useQuery({
    queryKey: ['fundraisers', 'active', options?.category, options?.limit],
    queryFn: async () => {
      let query = supabase
        .from('fundraisers')
        .select(`
          id, title, story, category, monthly_goal, amount_raised, donors_count, 
          unique_slug, cover_photo_url, country, status, created_at,
          fundraiser_images (id, image_url, is_primary)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

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

      return (data || []) as Fundraiser[];
    },
  });
}
