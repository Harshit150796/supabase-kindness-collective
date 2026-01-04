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
  dateHelped: string;
  verified: boolean;
}

export const impactStories: ImpactStory[] = [
  {
    id: '1',
    name: 'Sarah & James',
    location: 'Austin, TX',
    image: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=400&fit=crop',
    story: "Last December, my hours got cut at work right before the holidays. I didn't know how I'd put food on the table for Christmas dinner. A donor sent us a $50 grocery gift card - my kids had no idea we were struggling. That small act meant everything.",
    impact: 'Holiday meals for family of 4',
    category: 'family',
    donorsCount: 156,
    amountRaised: 890,
    goal: 1000,
    dateHelped: 'December 2024',
    verified: true
  },
  {
    id: '2',
    name: 'The Nguyen Family',
    location: 'San Jose, CA',
    image: 'https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=400&h=400&fit=crop',
    story: "When my husband lost his job, we had to choose between rent and groceries. The support we received helped us stock our pantry for two months while he found new work. Our children never missed a meal.",
    impact: '2 months of groceries',
    category: 'family',
    donorsCount: 234,
    amountRaised: 1450,
    goal: 1500,
    dateHelped: 'November 2024',
    verified: true
  },
  {
    id: '3',
    name: 'Marcus T.',
    location: 'Detroit, MI',
    image: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop&crop=face',
    story: "After my wife passed, I was raising three kids alone on a single income. The grocery coupons let me buy fresh produce and healthy food instead of just the cheapest options. My kids are eating better now.",
    impact: 'Weekly groceries for 6 months',
    category: 'child',
    donorsCount: 312,
    amountRaised: 2100,
    goal: 2400,
    dateHelped: 'October 2024',
    verified: true
  },
  {
    id: '4',
    name: 'Linda M.',
    location: 'Nashville, TN',
    image: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=400&h=400&fit=crop&crop=face',
    story: "I'm 72 and living on Social Security. Some months I had to choose between medicine and food. Now I get help with groceries so I can afford both. The kindness of strangers gives me hope.",
    impact: 'Monthly food assistance',
    category: 'emergency',
    donorsCount: 189,
    amountRaised: 980,
    goal: 1200,
    dateHelped: 'January 2025',
    verified: true
  },
  {
    id: '5',
    name: 'Hope Kitchen',
    location: 'Philadelphia, PA',
    image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=400&fit=crop',
    story: "Our community kitchen serves 150 families every week. With donated coupons, we can offer choices - families pick what they need instead of just taking what's available. It preserves their dignity.",
    impact: '150 families weekly',
    category: 'community',
    donorsCount: 567,
    amountRaised: 8500,
    goal: 10000,
    dateHelped: 'Ongoing',
    verified: true
  },
  {
    id: '6',
    name: 'Jessica & Kids',
    location: 'Denver, CO',
    image: 'https://images.unsplash.com/photo-1543342384-1f1350e27861?w=400&h=400&fit=crop',
    story: "As a single mom working two jobs, I barely had time to cook, let alone budget for healthy food. The meal delivery coupons changed everything - my kids finally get balanced dinners even on my busiest days.",
    impact: '500+ meals delivered',
    category: 'child',
    donorsCount: 278,
    amountRaised: 1850,
    goal: 2000,
    dateHelped: 'December 2024',
    verified: true
  },
  {
    id: '7',
    name: 'Robert & Maria',
    location: 'Phoenix, AZ',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop&crop=face',
    story: "After the fire destroyed our apartment, we lost everything. We were staying in a motel with nothing. Donors helped us with restaurant and grocery coupons while we got back on our feet. We'll never forget that kindness.",
    impact: 'Emergency food for 3 weeks',
    category: 'emergency',
    donorsCount: 423,
    amountRaised: 3200,
    goal: 3500,
    dateHelped: 'November 2024',
    verified: true
  },
  {
    id: '8',
    name: 'Second Chance Pantry',
    location: 'Atlanta, GA',
    image: 'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?w=400&h=400&fit=crop',
    story: "We support formerly incarcerated individuals rebuilding their lives. Food insecurity is a huge barrier to reintegration. These coupons help our clients focus on job hunting and family reconnection instead of worrying about their next meal.",
    impact: '85 individuals monthly',
    category: 'community',
    donorsCount: 345,
    amountRaised: 5600,
    goal: 6000,
    dateHelped: 'Ongoing',
    verified: true
  }
];

export const featuredStory = impactStories[0];
