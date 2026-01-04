export interface ImpactStory {
  id: string;
  name: string;
  location: string;
  image: string;
  story: string;
  impact: string;
  category: 'family' | 'child' | 'emergency' | 'community';
  donorsCount: number;
  amountRaised: number;
  goal: number;
}

export const impactStories: ImpactStory[] = [
  {
    id: '1',
    name: 'Maria R.',
    location: 'Houston, TX',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
    story: "After losing my job, I struggled to feed my three children. The grocery coupons from CouponDonation helped us get through the hardest months. Now I'm back on my feet and paying it forward.",
    impact: '3 months of groceries',
    category: 'family',
    donorsCount: 234,
    amountRaised: 1850,
    goal: 2000
  },
  {
    id: '2',
    name: 'The Martinez Family',
    location: 'Phoenix, AZ',
    image: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=400&fit=crop',
    story: "When my husband was hospitalized, medical bills piled up. Thanks to generous donors, we received food delivery coupons that kept our family fed while we focused on his recovery.",
    impact: '500+ meals delivered',
    category: 'emergency',
    donorsCount: 412,
    amountRaised: 3200,
    goal: 3500
  },
  {
    id: '3',
    name: 'David & Kids',
    location: 'Chicago, IL',
    image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&h=400&fit=crop',
    story: "As a single dad working two jobs, I couldn't always provide healthy meals. The Walmart and Target coupons meant my kids could have fresh fruits and vegetables every week.",
    impact: 'Weekly groceries for 6 months',
    category: 'child',
    donorsCount: 189,
    amountRaised: 2400,
    goal: 2400
  },
  {
    id: '4',
    name: 'Hope Community Center',
    location: 'Atlanta, GA',
    image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=400&fit=crop',
    story: "Our food bank serves 200 families weekly. Partner brand coupons have allowed us to provide not just food, but dignity - families can choose what they need.",
    impact: '200 families served weekly',
    category: 'community',
    donorsCount: 567,
    amountRaised: 8500,
    goal: 10000
  }
];

export const featuredStory = impactStories[0];
