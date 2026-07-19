import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentFeaturedStory, featuredStories } from '@/data/featuredStories';

import hurricaneReliefImg from '@/assets/featured/hurricane-relief.webp';

const imageMap: Record<string, string> = {
  'hurricane-relief': hurricaneReliefImg,
};

const storyKeyToId: Record<string, string> = {
  'hurricane-relief': 'featured-3',
};

export function useFeaturedStories() {
  return useQuery({
    queryKey: ['featured-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_stories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurrentFeaturedStory() {
  const { data: dbStories, isLoading } = useFeaturedStories();

  if (dbStories && dbStories.length > 0) {
    const weekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % dbStories.length;
    const s = dbStories[weekIndex];
    return {
      story: {
        id: storyKeyToId[s.story_key] || `featured-${s.display_order + 1}`,
        storyKey: s.story_key,
        name: s.name,
        location: s.location,
        image: imageMap[s.story_key] || '',
        story: s.short_story,
        headline: s.headline,
        amountRaised: Number(s.amount_raised),
        goal: Number(s.goal),
        donorsCount: s.donors_count,
      },
      isLoading,
    };
  }

  // Fallback to local data
  const local = getCurrentFeaturedStory();
  return {
    story: {
      id: local.id,
      storyKey: local.storyKey,
      name: local.name,
      location: local.location,
      image: local.image,
      story: local.story,
      headline: local.headline,
      amountRaised: local.amountRaised,
      goal: local.goal,
      donorsCount: local.donorsCount,
    },
    isLoading,
  };
}
