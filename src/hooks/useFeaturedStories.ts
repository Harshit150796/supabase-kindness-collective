import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentFeaturedStory, featuredStories } from '@/data/featuredStories';

import childrensHopeImg from '@/assets/featured/childrens-hope.webp';
import ruralFamilyImg from '@/assets/featured/rural-family-support.webp';
import hurricaneReliefImg from '@/assets/featured/hurricane-relief.webp';
import childrenOfHeroesImg from '@/assets/featured/children-of-heroes.jpeg';

const imageMap: Record<string, string> = {
  'childrens-hope': childrensHopeImg,
  'rural-family': ruralFamilyImg,
  'hurricane-relief': hurricaneReliefImg,
  'children-of-heroes': childrenOfHeroesImg,
};

const storyKeyToId: Record<string, string> = {
  'childrens-hope': 'featured-1',
  'rural-family': 'featured-2',
  'hurricane-relief': 'featured-3',
  'children-of-heroes': 'featured-4',
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
