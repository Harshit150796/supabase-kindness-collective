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
  dateHelped?: string;
  verified?: boolean;
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
    goal: 2000,
    dateHelped: 'December 2025',
    verified: true
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
    goal: 3500,
    dateHelped: 'November 2025',
    verified: true
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
    goal: 2400,
    dateHelped: 'October 2025',
    verified: true
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
    goal: 10000,
    dateHelped: 'Ongoing',
    verified: true
  },
  {
    id: '5',
    name: 'Sarah T.',
    location: 'Denver, CO',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
    story: "After fleeing domestic violence, I had nothing. The clothing and grocery coupons helped me rebuild my life and regain my independence. Forever grateful.",
    impact: 'Fresh start package',
    category: 'emergency',
    donorsCount: 156,
    amountRaised: 1200,
    goal: 1500,
    dateHelped: 'January 2026',
    verified: true
  },
  {
    id: '6',
    name: 'James & Family',
    location: 'Seattle, WA',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    story: "When I was laid off during the holidays, feeding four kids seemed impossible. The holiday meal coupons meant we could still have a proper Christmas dinner together.",
    impact: 'Holiday meals for 4 kids',
    category: 'family',
    donorsCount: 298,
    amountRaised: 1650,
    goal: 1800,
    dateHelped: 'December 2025',
    verified: true
  },
  {
    id: '7',
    name: 'Sunshine After School',
    location: 'Miami, FL',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=400&fit=crop',
    story: "We run an after-school program for 50 underprivileged children. The snack and meal coupons ensure no child goes hungry while learning and growing with us.",
    impact: '50 children fed daily',
    category: 'child',
    donorsCount: 423,
    amountRaised: 4200,
    goal: 5000,
    dateHelped: 'Ongoing',
    verified: true
  },
  {
    id: '8',
    name: 'Rosa M.',
    location: 'San Antonio, TX',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
    story: "As an elderly widow on fixed income, choosing between medicine and food was my reality. These coupons lifted that burden and gave me peace of mind.",
    impact: '6 months of groceries',
    category: 'family',
    donorsCount: 187,
    amountRaised: 2100,
    goal: 2100,
    dateHelped: 'November 2025',
    verified: true
  }
];

export const featuredStory = impactStories[0];
