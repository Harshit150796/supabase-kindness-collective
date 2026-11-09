import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Placement } from '@/lib/homepageLineup';

// homepage_placements is newer than the generated database types, so it is read through this small shape.
type LineupTable = { from: (table: 'homepage_placements') => { select: (columns: string) => PromiseLike<{ data: Placement[] | null; error: Error | null }> } };
const sb = supabase as unknown as LineupTable;

/** The team's homepage lineup (src/lib/homepageLineup.ts). If it can't be read, the homepage simply uses its normal order. */
export function useHomepageLineup(options?: { fresh?: boolean }) {
  return useQuery({
    queryKey: ['homepage-lineup'],
    queryFn: async (): Promise<Placement[]> => {
      const { data, error } = await sb.from('homepage_placements').select('fundraiser_id, position, hidden');
      if (error) throw error;
      return (data ?? []) as Placement[];
    },
    staleTime: options?.fresh ? 0 : 60_000,
    retry: 1,
  });
}
