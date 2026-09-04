import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ImpactStats {
  total_raised: number;
  total_donations: number;
  total_coupons: number;
  active_fundraisers: number;
}

/** Real platform figures, straight from the ledger. */
export function useImpactStats() {
  return useQuery({
    queryKey: ['impact-stats'],
    queryFn: async (): Promise<ImpactStats> => {
      const { data, error } = await supabase.rpc('get_impact_stats');
      if (error) throw error;
      const row: any = Array.isArray(data) ? data[0] : data;
      return {
        total_raised: Number(row?.total_raised) || 0,
        total_donations: Number(row?.total_donations) || 0,
        total_coupons: Number(row?.total_coupons) || 0,
        active_fundraisers: Number(row?.active_fundraisers) || 0,
      };
    },
    staleTime: 60_000,
  });
}

/** Admin-editable voucher goal (cms_content: spotlight_goal_vouchers). */
export function useVoucherGoal(fallback = 1000) {
  const { data } = useQuery({
    queryKey: ['cms-content-key', 'spotlight_goal_vouchers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_content')
        .select('content_value')
        .eq('content_key', 'spotlight_goal_vouchers')
        .maybeSingle();
      if (error) throw error;
      return data?.content_value ?? null;
    },
    staleTime: 300_000,
  });
  const parsed = Number(data);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export interface SpotlightCampaign {
  title: string;
  slug: string;
  goal: number;
  raised: number;
  image: string | null;
}

/**
 * The campaign featured in the spotlight bar. Admins pick it by slug via
 * cms_content (`spotlight_fundraiser_slug`); otherwise we fall back to the
 * active campaign with the most raised so far.
 */
export function useSpotlightCampaign() {
  return useQuery({
    queryKey: ['spotlight-campaign'],
    queryFn: async (): Promise<SpotlightCampaign | null> => {
      const { data: setting } = await supabase
        .from('cms_content')
        .select('content_value')
        .eq('content_key', 'spotlight_fundraiser_slug')
        .maybeSingle();

      const slug = setting?.content_value?.trim() || '';
      const select =
        'title, unique_slug, monthly_goal, amount_raised, cover_photo_url, fundraiser_images (image_url, is_primary, display_order)';

      const pick = (row: any): SpotlightCampaign => {
        const images = (row.fundraiser_images || []) as Array<{
          image_url: string;
          is_primary: boolean | null;
          display_order: number;
        }>;
        const primary =
          images.find((i) => i.is_primary)?.image_url ||
          [...images].sort((a, b) => a.display_order - b.display_order)[0]?.image_url ||
          null;
        return {
          title: row.title,
          slug: row.unique_slug,
          goal: Number(row.monthly_goal) || 0,
          raised: Number(row.amount_raised) || 0,
          image: row.cover_photo_url || primary,
        };
      };

      if (slug) {
        const { data } = await supabase
          .from('fundraisers')
          .select(select)
          .eq('unique_slug', slug)
          .eq('status', 'active')
          .maybeSingle();
        if (data) return pick(data);
      }

      const { data: top } = await supabase
        .from('fundraisers')
        .select(select)
        .eq('status', 'active')
        .order('amount_raised', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      return top ? pick(top) : null;
    },
    staleTime: 120_000,
  });
}
