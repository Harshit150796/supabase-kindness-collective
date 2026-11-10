import { useQuery, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fundraiserRetryPolicy } from '@/lib/landingPresentation';
import { rankFundraisers } from '@/lib/fundraiserRanking';

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
  is_example?: boolean;
  featured_order?: number | null;
  fundraiser_images?: FundraiserImage[];
  organizer_name?: string;
  live_raised: number;
  live_donations_count: number;
  latest_donation_at?: string | null;
}

/** How many open fundraisers are read before ranking, so a well-supported older one isn't cut off by a limit. */
const RANK_POOL = 300;

/** Category ids, old and new, are plain words; anything else is dropped before it reaches a filter. */
const cleanIds = (ids: string[]) => ids.filter((id) => /^[a-z_]+$/.test(id));

type FundraiserOptions = { limit?: number; category?: string; needs?: string[]; cards?: boolean };

/** Shared by the hook and the homepage's early prefetch. `cards` skips the full story text (cards never show it). */
function fundraisersQuery(options?: FundraiserOptions) {
  const needs = options?.needs?.length ? cleanIds(options.needs) : [];
  return {
    queryKey: ['fundraisers', 'active', options?.category, options?.limit, needs.join(','), options?.cards ? 'cards' : 'full'],
    queryFn: async ({ signal }) => {
      const controller = new AbortController();
      const cancel = () => controller.abort();
      signal.addEventListener('abort', cancel, { once: true });
      if (signal.aborted) cancel();
      const timeout = window.setTimeout(cancel, fundraiserRetryPolicy.attemptTimeout);
      try {
      let query = supabase
        .from('fundraisers')
        .select(`
          id, title, ${options?.cards ? '' : 'story, '}category, monthly_goal, amount_raised, donors_count, 
          unique_slug, cover_photo_url, country, zip_code, status, created_at, is_example, featured_order,
          fundraiser_images (id, image_url, is_primary, display_order)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);

      if (options?.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }

      // A need page lists requests whose first need or any chosen need matches (help_categories).
      if (needs.length) {
        query = query.or(`category.in.(${needs.join(',')}),help_categories.ov.{${needs.join(',')}}`);
      }

      // Ranking happens after the live numbers arrive; the limit applies to the ranked list.
      query = query.limit(Math.max(RANK_POOL, options?.limit ?? 0));

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
      const ranked = rankFundraisers(rows.map((row) => {
        const c = byId.get(row.id);
        return {
          ...row,
          live_raised: Number(c?.total_raised ?? 0),
          live_donations_count: Number(c?.donations_count ?? 0),
          organizer_name: c?.organizer_name ?? undefined,
          latest_donation_at: c?.latest_donation_at ?? null,
        } as Fundraiser;
      }));
      return options?.limit ? ranked.slice(0, options.limit) : ranked;
      } finally { window.clearTimeout(timeout); signal.removeEventListener('abort', cancel); }
    },
    retry: fundraiserRetryPolicy.retry,
    retryDelay: fundraiserRetryPolicy.retryDelay,
    staleTime: 5 * 60_000,
  };
}

export function useFundraisers(options?: FundraiserOptions) {
  return useQuery({
    ...fundraisersQuery(options),
    refetchInterval: () => document.hidden ? false : 30_000,
    refetchIntervalInBackground: false,
  });
}

/** Start the homepage's list as soon as the page opens, before its section scrolls into view. */
export function prefetchHomepageFundraisers(client: QueryClient) {
  return client.prefetchQuery(fundraisersQuery({ cards: true }));
}
