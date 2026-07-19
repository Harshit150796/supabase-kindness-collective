import hurricaneReliefImg from '@/assets/featured/hurricane-relief.webp';

export interface FeaturedStory {
  id: string;
  storyKey: string;
  name: string;
  location: string;
  image: string;
  story: string;
  amountRaised: number;
  goal: number;
  donorsCount: number;
  headline: string;
}

export const featuredStories: FeaturedStory[] = [
  {
    id: 'featured-3',
    storyKey: 'hurricane-relief',
    name: 'Hurricane Helene Relief',
    location: 'Asheville, NC',
    image: hurricaneReliefImg,
    story: 'After Hurricane Helene devastated communities in North Carolina, donors helped families rebuild with grocery support and essential supplies when they needed it most.',
    amountRaised: 21300,
    goal: 25000,
    donorsCount: 312,
    headline: 'Families rebuilt after Hurricane Helene with grocery support',
  },
];

export function getCurrentFeaturedStory(): FeaturedStory {
  const weekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % featuredStories.length;
  return featuredStories[weekIndex];
}
