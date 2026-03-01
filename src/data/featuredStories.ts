import childrensHopeImg from '@/assets/featured/childrens-hope.webp';
import ruralFamilyImg from '@/assets/featured/rural-family-support.webp';
import hurricaneReliefImg from '@/assets/featured/hurricane-relief.webp';
import childrenOfHeroesImg from '@/assets/featured/children-of-heroes.jpeg';

export interface FeaturedStory {
  id: string;
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
    id: 'featured-1',
    name: "Children's Hope Program",
    location: 'Poland',
    image: childrensHopeImg,
    story: 'Thanks to generous donors, children in conflict-affected areas are finding joy and normalcy through play, therapy, and community support activities.',
    amountRaised: 12400,
    goal: 18000,
    donorsCount: 187,
    headline: "Children in conflict zones received hope through play and support",
  },
  {
    id: 'featured-2',
    name: 'Rural Family Support',
    location: 'Haiti',
    image: ruralFamilyImg,
    story: 'Families in rural Haiti are receiving essential food supplies and grocery coupons, helping them through some of the most difficult times they have ever faced.',
    amountRaised: 8750,
    goal: 15000,
    donorsCount: 134,
    headline: "Families in rural Haiti received essential food support",
  },
  {
    id: 'featured-3',
    name: 'Hurricane Helene Relief',
    location: 'North Carolina, USA',
    image: hurricaneReliefImg,
    story: 'After Hurricane Helene devastated communities in North Carolina, donors helped families rebuild with grocery support and essential supplies when they needed it most.',
    amountRaised: 21300,
    goal: 25000,
    donorsCount: 312,
    headline: "Families rebuilt after Hurricane Helene with grocery support",
  },
  {
    id: 'featured-4',
    name: 'Children of Heroes',
    location: 'Ukraine',
    image: childrenOfHeroesImg,
    story: 'Children of fallen heroes in Ukraine are receiving nutrition, education supplies, and community care — ensuring they are never forgotten.',
    amountRaised: 16800,
    goal: 20000,
    donorsCount: 245,
    headline: "Children of fallen heroes received nutrition and care",
  },
];

export function getCurrentFeaturedStory(): FeaturedStory {
  const weekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % 4;
  return featuredStories[weekIndex];
}
