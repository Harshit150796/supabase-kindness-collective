export interface StoryUpdate {
  date: string;
  title: string;
  content: string;
}

export interface RecentDonor {
  name: string;
  amount: number;
  message?: string;
  date: string;
  isAnonymous?: boolean;
}

export interface Organizer {
  name: string;
  avatar?: string;
  relationship: string;
}

export interface ImpactStory {
  id: string;
  name: string;
  location: string;
  image: string;
  story: string;
  fullStory: string;
  impact: string;
  category: 'family' | 'child' | 'emergency' | 'community';
  donorsCount: number;
  amountRaised: number;
  goal: number;
  dateHelped?: string;
  verified?: boolean;
  familySize?: number;
  galleryImages?: string[];
  updates?: StoryUpdate[];
  recentDonors?: RecentDonor[];
  brandPartners?: string[];
  organizer?: Organizer;
}

export const impactStories: ImpactStory[] = [
  {
    id: '1',
    name: 'Maria R.',
    location: 'Houston, TX',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
    story: "After losing my job, I struggled to feed my three children. The grocery coupons from CouponDonation helped us get through the hardest months. Now I'm back on my feet and paying it forward.",
    fullStory: `When I lost my job at the manufacturing plant in March, I never imagined how quickly things would spiral. With three children to feed and rent coming due, I felt completely overwhelmed.

My youngest daughter had just started kindergarten, and I couldn't bear the thought of her going to school hungry. I'd always been the provider for my family, and suddenly I found myself facing an impossible choice: pay rent or buy groceries.

A friend from church told me about CouponDonation. I was hesitant at first – accepting help has never been easy for me. But when I saw that I could receive grocery coupons from stores I already knew and trusted, like Walmart and H-E-B, something shifted.

The coupons didn't just provide food. They gave me dignity. I could still walk into a store and shop for my family like any other mother. My children never had to know how close we came to the edge.

Three months later, I found a new job. The first thing I did was set up a monthly donation to CouponDonation. What goes around comes around, and I want to be there for the next mother who finds herself in my shoes.`,
    impact: '3 months of groceries',
    category: 'family',
    donorsCount: 234,
    amountRaised: 1850,
    goal: 2000,
    dateHelped: 'December 2025',
    verified: true,
    familySize: 4,
    galleryImages: [
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&h=600&fit=crop', // mother grocery shopping
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&h=600&fit=crop', // family dinner table
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&h=600&fit=crop' // fresh groceries
    ],
    updates: [
      {
        date: '2025-12-28',
        title: 'Goal almost reached! 🎉',
        content: 'Thanks to everyone who donated. We are so close to our goal and Maria is doing amazing!'
      },
      {
        date: '2025-12-15',
        title: 'First coupons delivered',
        content: 'Maria received her first batch of grocery coupons today. She was so grateful and wanted to say thank you to everyone.'
      },
      {
        date: '2025-12-01',
        title: 'Campaign started',
        content: 'We are launching this campaign to help Maria and her three children get through the winter months.'
      }
    ],
    recentDonors: [
      { name: 'Sarah M.', amount: 50, message: 'Stay strong, Maria! Wishing you and your family the best.', date: '2025-12-27', isAnonymous: false },
      { name: 'Anonymous', amount: 25, date: '2025-12-26', isAnonymous: true },
      { name: 'John D.', amount: 100, message: 'Happy to help a fellow Houstonian!', date: '2025-12-25', isAnonymous: false },
      { name: 'The Williams Family', amount: 75, date: '2025-12-24', isAnonymous: false },
      { name: 'Grace L.', amount: 30, message: 'God bless you and your children.', date: '2025-12-23', isAnonymous: false }
    ],
    brandPartners: ['Walmart', 'H-E-B', 'Target'],
    organizer: {
      name: 'Lisa Thompson',
      relationship: 'Church community member'
    }
  },
  {
    id: '2',
    name: 'The Martinez Family',
    location: 'Phoenix, AZ',
    image: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=400&fit=crop',
    story: "When my husband was hospitalized, medical bills piled up. Thanks to generous donors, we received food delivery coupons that kept our family fed while we focused on his recovery.",
    fullStory: `Life can change in an instant. One day, my husband Carlos was working his construction job like any other day. The next, he was in the ICU with a serious injury.

The medical bills started piling up immediately. Workers' comp was delayed, and we had no idea when – or if – it would come through. Meanwhile, our two teenage sons needed to eat, homework needed to get done, and life had to somehow go on.

I spent every day at the hospital, unable to work my part-time job. Cooking became impossible. We were surviving on vending machine snacks and hospital cafeteria food that we couldn't really afford.

A social worker at the hospital mentioned CouponDonation. Within days, we received DoorDash and Instacart coupons. For the first time in weeks, my boys had real, hot meals. I could grab something nutritious on my way to the hospital.

Carlos is recovering now. It's been a long road, but we're getting there. The food coupons meant I could focus on being by his side instead of worrying about whether our kids were eating properly. That peace of mind was priceless.`,
    impact: '500+ meals delivered',
    category: 'emergency',
    donorsCount: 412,
    amountRaised: 3200,
    goal: 3500,
    dateHelped: 'November 2025',
    verified: true,
    familySize: 4,
    galleryImages: [
      'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=800&h=600&fit=crop', // hospital visit
      'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=800&h=600&fit=crop' // medical recovery
    ],
    updates: [
      {
        date: '2025-11-30',
        title: 'Carlos is home! 🏠',
        content: 'Great news - Carlos was discharged from the hospital today. He still has a long recovery ahead, but being home with family is the best medicine.'
      },
      {
        date: '2025-11-15',
        title: 'Halfway to our goal',
        content: 'We have reached 50% of our fundraising goal. The family is incredibly grateful for every donation.'
      }
    ],
    recentDonors: [
      { name: 'Mike R.', amount: 100, message: 'Praying for a speedy recovery!', date: '2025-11-28', isAnonymous: false },
      { name: 'Anonymous', amount: 50, date: '2025-11-27', isAnonymous: true },
      { name: 'Jennifer K.', amount: 75, date: '2025-11-26', isAnonymous: false }
    ],
    brandPartners: ['DoorDash', 'Instacart', 'Uber Eats'],
    organizer: {
      name: 'Patricia Martinez',
      relationship: 'Wife'
    }
  },
  {
    id: '3',
    name: 'David & Kids',
    location: 'Chicago, IL',
    image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&h=400&fit=crop',
    story: "As a single dad working two jobs, I couldn't always provide healthy meals. The Walmart and Target coupons meant my kids could have fresh fruits and vegetables every week.",
    fullStory: `Being a single dad wasn't in my life plan. When my wife passed away two years ago, I was left to raise our three kids – ages 5, 8, and 11 – on my own.

I work two jobs to keep a roof over our heads. I drive for a delivery service during the day and work warehouse shifts at night. It leaves me exhausted, but bills don't pay themselves.

The problem was food. I'd come home at 6 AM, sleep a few hours, then get the kids ready for school. Cooking nutritious meals? That was a luxury I couldn't afford – in time or money. We lived on fast food and frozen dinners.

When CouponDonation started sending us weekly grocery coupons, everything changed. Suddenly I could afford to buy fresh produce. My mother, who lives nearby, started cooking for us using the groceries I could now provide.

My kids' health improved. Their grades improved. And I finally felt like I was doing right by them. Six months later, I'm still receiving support, and I'm saving money to eventually cut back to just one job. Thank you for giving my family a chance.`,
    impact: 'Weekly groceries for 6 months',
    category: 'child',
    donorsCount: 189,
    amountRaised: 2400,
    goal: 2400,
    dateHelped: 'October 2025',
    verified: true,
    familySize: 4,
    galleryImages: [
      'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=800&h=600&fit=crop', // dad with kids
      'https://images.unsplash.com/photo-1484665754804-74b091211472?w=800&h=600&fit=crop' // kids eating healthy
    ],
    updates: [
      {
        date: '2025-10-31',
        title: 'Goal reached! Thank you! 🎊',
        content: 'We did it! David and his kids now have 6 months of grocery support secured. Thank you to every single donor.'
      },
      {
        date: '2025-10-15',
        title: 'Kids are thriving',
        content: 'David sent us a photo of the kids enjoying a home-cooked meal. Their smiles say it all.'
      }
    ],
    recentDonors: [
      { name: 'The Anderson Family', amount: 150, message: 'From one parent to another - you\'re doing amazing.', date: '2025-10-30', isAnonymous: false },
      { name: 'Robert T.', amount: 50, date: '2025-10-29', isAnonymous: false }
    ],
    brandPartners: ['Walmart', 'Target', 'Kroger'],
    organizer: {
      name: 'Susan Chen',
      relationship: 'Social worker'
    }
  },
  {
    id: '4',
    name: 'Hope Community Center',
    location: 'Atlanta, GA',
    image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=400&fit=crop',
    story: "Our food bank serves 200 families weekly. Partner brand coupons have allowed us to provide not just food, but dignity - families can choose what they need.",
    fullStory: `Hope Community Center has been serving Atlanta's underserved neighborhoods for over 15 years. What started as a small food pantry in a church basement has grown into a comprehensive support center.

We serve over 200 families every week. For years, we operated like a traditional food bank – families would line up, and we'd hand them whatever donations we had received. It worked, but it wasn't ideal. A family might get five cans of beans when what they really needed was baby formula.

CouponDonation changed our model completely. Now, instead of handing out random food items, we distribute coupons from partner retailers. Families can go to their local Walmart, Publix, or Kroger and choose exactly what they need.

The impact on dignity has been profound. Parents no longer have to explain to their kids why they're standing in a food line. Seniors can shop when it's convenient for them, not when our center is open. Families with dietary restrictions can finally get food that works for them.

We've seen a 40% increase in the number of families we can help since partnering with CouponDonation. And the feedback from our community has been overwhelmingly positive. This is the future of food assistance.`,
    impact: '200 families served weekly',
    category: 'community',
    donorsCount: 567,
    amountRaised: 8500,
    goal: 10000,
    dateHelped: 'Ongoing',
    verified: true,
    galleryImages: [
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=600&fit=crop', // community food distribution
      'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=600&fit=crop', // volunteers helping
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=600&fit=crop' // donation boxes
    ],
    updates: [
      {
        date: '2025-12-20',
        title: 'Holiday drive success!',
        content: 'Our holiday food drive was a huge success. We were able to provide holiday meal coupons to over 300 families.'
      },
      {
        date: '2025-11-01',
        title: 'Expanded to new neighborhood',
        content: 'We have opened a satellite location in East Atlanta to reach even more families in need.'
      }
    ],
    recentDonors: [
      { name: 'Atlanta Business Coalition', amount: 500, message: 'Proud to support our community!', date: '2025-12-19', isAnonymous: false },
      { name: 'Anonymous', amount: 100, date: '2025-12-18', isAnonymous: true },
      { name: 'Dr. Michelle Park', amount: 250, date: '2025-12-17', isAnonymous: false }
    ],
    brandPartners: ['Walmart', 'Publix', 'Kroger', 'Costco'],
    organizer: {
      name: 'Rev. James Washington',
      relationship: 'Center Director'
    }
  },
  {
    id: '5',
    name: 'Sarah T.',
    location: 'Denver, CO',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
    story: "After fleeing domestic violence, I had nothing. The clothing and grocery coupons helped me rebuild my life and regain my independence. Forever grateful.",
    fullStory: `I left with nothing but the clothes on my back and my two children. After years of abuse, I finally found the courage to leave. But starting over from zero is harder than anyone can imagine.

The women's shelter gave us a safe place to stay, but resources were limited. I had no job, no money, and no idea how I was going to provide for my kids. The shame and fear were overwhelming.

A counselor at the shelter connected me with CouponDonation. Within a week, I received coupons for groceries, clothing, and household essentials. For the first time since leaving, I felt like I could breathe.

The clothing coupons were especially meaningful. My children had outgrown their clothes, and I needed professional attire for job interviews. Being able to walk into a store and pick out clothes that fit – that felt normal – was incredibly healing.

Six months later, I have my own apartment, a job, and most importantly, my freedom. The coupons bridged the gap between escape and independence. They gave me the runway I needed to rebuild my life.`,
    impact: 'Fresh start package',
    category: 'emergency',
    donorsCount: 156,
    amountRaised: 1200,
    goal: 1500,
    dateHelped: 'January 2026',
    verified: true,
    familySize: 3,
    galleryImages: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', // new apartment
      'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&h=600&fit=crop' // fresh start healthy food
    ],
    updates: [
      {
        date: '2026-01-05',
        title: 'New apartment! 🏠',
        content: 'Sarah and her kids have moved into their own apartment. A fresh start for 2026!'
      }
    ],
    recentDonors: [
      { name: 'Women Supporting Women', amount: 200, message: 'You are so brave. We are rooting for you!', date: '2026-01-04', isAnonymous: false },
      { name: 'Anonymous', amount: 50, date: '2026-01-03', isAnonymous: true }
    ],
    brandPartners: ['Target', 'Kohl\'s', 'Safeway'],
    organizer: {
      name: 'Maria Gonzalez',
      relationship: 'Shelter counselor'
    }
  },
  {
    id: '6',
    name: 'James & Family',
    location: 'Seattle, WA',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    story: "When I was laid off during the holidays, feeding four kids seemed impossible. The holiday meal coupons meant we could still have a proper Christmas dinner together.",
    fullStory: `Tech layoffs hit Seattle hard in 2025. I was one of thousands who received the dreaded email right before Thanksgiving. After 12 years at the same company, I was suddenly unemployed.

With four kids ranging from 6 to 16, the timing couldn't have been worse. My wife works part-time as a teacher's aide, but her salary barely covers our mortgage. The holidays were approaching, and I had no idea how we'd manage.

My oldest daughter had been looking forward to hosting her first Thanksgiving at our house for her new college friends. When she found out about my job loss, she immediately offered to cancel. I couldn't let that happen.

CouponDonation provided us with holiday meal coupons – enough for both Thanksgiving and Christmas dinners. We were able to put on a spread that rivaled any year before. My daughter's friends had no idea we were struggling.

I'm still job hunting, but the support from CouponDonation has taken the pressure off. My kids are fed, and I can focus on finding the right next opportunity instead of panicking about our next meal.`,
    impact: 'Holiday meals for 4 kids',
    category: 'family',
    donorsCount: 298,
    amountRaised: 1650,
    goal: 1800,
    dateHelped: 'December 2025',
    verified: true,
    familySize: 6,
    galleryImages: [
      'https://images.unsplash.com/photo-1543353071-087092ec393a?w=800&h=600&fit=crop', // holiday dinner
      'https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=800&h=600&fit=crop' // family Christmas
    ],
    updates: [
      {
        date: '2025-12-26',
        title: 'Christmas was saved! 🎄',
        content: 'James and his family had a wonderful Christmas dinner together. The kids were thrilled with the feast.'
      },
      {
        date: '2025-11-28',
        title: 'Thanksgiving success',
        content: 'The family hosted a beautiful Thanksgiving dinner. James\' daughter was so happy to have her friends over.'
      }
    ],
    recentDonors: [
      { name: 'Seattle Tech Community', amount: 300, message: 'We take care of our own. Best of luck with the job search!', date: '2025-12-25', isAnonymous: false },
      { name: 'Anonymous', amount: 75, date: '2025-12-24', isAnonymous: true }
    ],
    brandPartners: ['Costco', 'Whole Foods', 'Fred Meyer'],
    organizer: {
      name: 'James Wilson',
      relationship: 'Self'
    }
  },
  {
    id: '7',
    name: 'Sunshine After School',
    location: 'Miami, FL',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=400&fit=crop',
    story: "We run an after-school program for 50 underprivileged children. The snack and meal coupons ensure no child goes hungry while learning and growing with us.",
    fullStory: `Sunshine After School started in my living room five years ago with just three kids. Today, we serve 50 children from low-income families in Miami's Little Haiti neighborhood.

Our program runs from 3 PM to 7 PM, bridging the gap between school dismissal and when parents get off work. We provide homework help, tutoring, arts and crafts, and most importantly – snacks and dinner.

For many of our kids, the meals they get at Sunshine are their only reliable nutrition of the day. School lunch is one thing, but evenings and weekends are a struggle for food-insecure families.

Before CouponDonation, we relied entirely on donated food – whatever we could get. Some days we had plenty; other days, not so much. The inconsistency was stressful for both staff and kids.

Now, with weekly grocery coupons, we can plan proper menus. We can buy fresh fruits and vegetables, lean proteins, and whole grains. The kids are healthier, more focused, and their academic performance has improved dramatically.

Our goal is to expand to serve 100 children by next year. With continued support from donors like you, we know we can make it happen.`,
    impact: '50 children fed daily',
    category: 'child',
    donorsCount: 423,
    amountRaised: 4200,
    goal: 5000,
    dateHelped: 'Ongoing',
    verified: true,
    galleryImages: [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop', // kids learning
      'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&h=600&fit=crop', // after school activities
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&h=600&fit=crop' // children eating snacks
    ],
    updates: [
      {
        date: '2025-12-15',
        title: 'Winter program expanded',
        content: 'We are now offering winter break programming! Kids will continue to receive meals and activities during the holiday break.'
      },
      {
        date: '2025-10-01',
        title: 'New tutoring partnership',
        content: 'We have partnered with local college students to provide free tutoring services to all our kids.'
      }
    ],
    recentDonors: [
      { name: 'Miami Education Foundation', amount: 1000, message: 'Thank you for everything you do for our community\'s children.', date: '2025-12-14', isAnonymous: false },
      { name: 'Chef Marcus', amount: 150, message: 'Happy to support feeding the next generation!', date: '2025-12-13', isAnonymous: false }
    ],
    brandPartners: ['Publix', 'Winn-Dixie', 'Trader Joe\'s'],
    organizer: {
      name: 'Angela Baptiste',
      relationship: 'Program Founder'
    }
  },
  {
    id: '8',
    name: 'Rosa M.',
    location: 'San Antonio, TX',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
    story: "As an elderly widow on fixed income, choosing between medicine and food was my reality. These coupons lifted that burden and gave me peace of mind.",
    fullStory: `I turned 78 this year. My husband passed away three years ago, and I've been living alone ever since. My Social Security check barely covers my rent and utilities, leaving very little for anything else.

I have diabetes and high blood pressure. The medications are expensive, even with Medicare. Every month, I faced the same terrible choice: do I buy my pills or do I buy groceries?

I started skipping doses to save money. I'd cut my pills in half, stretch them out as long as I could. My doctor noticed my health declining but I was too embarrassed to tell her why.

My neighbor told me about CouponDonation. She helped me apply, and soon I was receiving weekly grocery coupons from H-E-B. For the first time in years, I could afford both food AND medicine.

The coupons aren't charity in the way that made me uncomfortable. I still go to the store, choose my own food, and check out like anyone else. I can buy the fresh mangoes I love and the tortillas I make from scratch. I feel like myself again.

My health has stabilized. My doctor is pleased with my progress. And I no longer lie awake at night wondering how I'll survive the month. Thank you for giving me back my peace of mind.`,
    impact: '6 months of groceries',
    category: 'family',
    donorsCount: 187,
    amountRaised: 2100,
    goal: 2100,
    dateHelped: 'November 2025',
    verified: true,
    familySize: 1,
    galleryImages: [
      'https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=800&h=600&fit=crop', // senior at home
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop' // medication and health
    ],
    updates: [
      {
        date: '2025-11-30',
        title: 'Goal reached! 🎉',
        content: 'Rosa now has 6 months of grocery support. Her health has improved significantly since she can afford both food and medicine.'
      },
      {
        date: '2025-11-01',
        title: 'Campaign launched',
        content: 'Rosa\'s neighbor helped set up this campaign to support her during these challenging times.'
      }
    ],
    recentDonors: [
      { name: 'Meals for Seniors Initiative', amount: 300, message: 'No senior should have to choose between food and medicine.', date: '2025-11-29', isAnonymous: false },
      { name: 'Anonymous', amount: 100, date: '2025-11-28', isAnonymous: true }
    ],
    brandPartners: ['H-E-B', 'Walmart', 'CVS'],
    organizer: {
      name: 'Carmen Flores',
      relationship: 'Neighbor and friend'
    }
  },
  // Featured stories — detail page entries
  {
    id: 'featured-1',
    name: "Children's Hope Program",
    location: 'Poland',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=400&fit=crop',
    story: 'Children in conflict-affected areas are finding joy and normalcy through play, therapy, and community support activities.',
    fullStory: `In the heart of Poland, near the Ukrainian border, the Children's Hope Program has been providing a safe haven for displaced children since early 2024. What started as a small community effort in a local school gymnasium has grown into a comprehensive support network serving over 300 children weekly.

The program offers structured play therapy sessions, art workshops, and educational activities designed to help children process trauma and rebuild a sense of normalcy. Trained counselors work alongside volunteers to create an environment where kids can just be kids — laughing, playing, and learning without fear.

Local families have opened their homes as host families, and community donations have funded everything from art supplies to warm winter clothing. The grocery coupons provided through our platform ensure that both the children and their host families have access to nutritious meals.

One mother shared: "My daughter hadn't smiled in months after we fled. The first day at the program, she came home singing. That sound was everything."

The program has expanded to three locations across southeastern Poland, and plans are underway to open a fourth center. With continued donor support, we aim to serve 500 children by end of 2026.`,
    impact: 'Play therapy and nutrition for 300+ children',
    category: 'child',
    donorsCount: 187,
    amountRaised: 12400,
    goal: 18000,
    dateHelped: 'Ongoing since 2024',
    verified: true,
    galleryImages: [
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&h=600&fit=crop',
    ],
    updates: [
      { date: '2026-02-20', title: 'Third center opened! 🎉', content: 'We opened our third location in Rzeszów, now serving over 300 children across southeastern Poland.' },
      { date: '2026-01-10', title: 'Winter clothing drive success', content: 'Donors provided warm coats, gloves, and boots for all 250 children in the program.' },
      { date: '2025-11-15', title: 'Art therapy expansion', content: 'New art therapy sessions launched with professional therapists. Children are showing remarkable progress.' },
    ],
    recentDonors: [
      { name: 'European Relief Fund', amount: 500, message: 'For every child who deserves to play and learn.', date: '2026-02-25', isAnonymous: false },
      { name: 'Anonymous', amount: 100, date: '2026-02-22', isAnonymous: true },
      { name: 'Anna K.', amount: 75, message: 'Wishing strength to all the families.', date: '2026-02-18', isAnonymous: false },
      { name: 'The Nowak Family', amount: 200, date: '2026-02-15', isAnonymous: false },
    ],
    brandPartners: ['Biedronka', 'Lidl', 'Carrefour'],
    organizer: { name: 'Katarzyna Wiśniewska', relationship: 'Program Director' },
  },
  {
    id: 'featured-2',
    name: 'Rural Family Support',
    location: 'Haiti',
    image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=400&fit=crop',
    story: "Families in rural Haiti are receiving essential food supplies and grocery coupons, helping them through the most difficult times they've ever faced.",
    fullStory: `In the remote villages of Haiti's Grand'Anse department, access to food has always been a challenge. But after multiple hurricanes and ongoing economic instability, many families found themselves on the brink of starvation.

Our Rural Family Support initiative partners with local community leaders to identify the families most in need. Rather than shipping food — which is expensive and often doesn't match local diets — we work with regional markets and vendors to distribute coupons that families can redeem for rice, beans, cooking oil, fresh produce, and other staples they actually want and need.

Jean-Pierre, a father of five, told us: "Before the coupons, I would walk three hours to find work, only to earn enough for one meal. Now my children eat every day. I can focus on rebuilding our farm."

The program currently supports 134 families across 8 villages. Each family receives monthly coupons equivalent to $65 in groceries — enough to feed a family of four for the month. Local vendors benefit too, keeping the economic impact within the community.

We've also introduced agricultural training workshops, teaching families sustainable farming techniques so they can eventually grow their own food. 23 families have already started small vegetable gardens with seeds provided through the program.`,
    impact: 'Monthly groceries for 134 families',
    category: 'family',
    donorsCount: 134,
    amountRaised: 8750,
    goal: 15000,
    dateHelped: 'Ongoing since 2025',
    verified: true,
    familySize: 4,
    galleryImages: [
      'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=600&fit=crop',
    ],
    updates: [
      { date: '2026-02-10', title: 'Agricultural workshop #3 complete 🌱', content: '23 families now growing their own vegetables. Seed distribution expanded to 3 new villages.' },
      { date: '2026-01-05', title: '134 families supported', content: 'We reached our milestone of 134 families receiving monthly grocery coupons across 8 villages.' },
    ],
    recentDonors: [
      { name: 'Global Food Initiative', amount: 1000, message: 'Empowering communities to feed themselves.', date: '2026-02-08', isAnonymous: false },
      { name: 'Anonymous', amount: 50, date: '2026-02-05', isAnonymous: true },
      { name: 'Pierre L.', amount: 150, message: 'Ayiti cheri — Haiti forever in my heart.', date: '2026-01-30', isAnonymous: false },
    ],
    brandPartners: ['Caribbean Market Network', 'Local Vendors Coalition'],
    organizer: { name: 'Jean-Baptiste Toussaint', relationship: 'Regional Coordinator' },
  },
  {
    id: 'featured-3',
    name: 'Hurricane Helene Relief',
    location: 'North Carolina, USA',
    image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=400&fit=crop',
    story: 'After Hurricane Helene devastated communities in North Carolina, donors helped families rebuild with grocery support and essential supplies when they needed it most.',
    fullStory: `When Hurricane Helene made landfall in western North Carolina in September 2025, it left a trail of destruction that no one in the region had ever seen. Entire neighborhoods were underwater. Roads were impassable. Power was out for weeks.

Our relief team was on the ground within 48 hours. Working with FEMA, local churches, and community organizations, we set up coupon distribution points at emergency shelters across Buncombe, Henderson, and Transylvania counties.

The response from donors was overwhelming. Within the first week, we raised enough to provide grocery coupons to over 300 families. These weren't just any coupons — they were redeemable at stores that were actually open and stocked, including Ingles Markets, Food Lion, and Walmart locations that had restored power.

Mark, a volunteer firefighter who lost his own home while helping others, said: "I spent three days rescuing people from rooftops. When I finally got to a shelter, someone handed me a grocery coupon. I broke down crying. It was the first time someone had taken care of me."

Three months later, the recovery continues. We've transitioned from emergency relief to long-term support, helping families rebuild their pantries as they move from shelters into temporary and permanent housing.`,
    impact: 'Emergency groceries for 300+ families',
    category: 'emergency',
    donorsCount: 312,
    amountRaised: 21300,
    goal: 25000,
    dateHelped: 'September 2025 – Present',
    verified: true,
    galleryImages: [
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=600&fit=crop',
    ],
    updates: [
      { date: '2026-01-15', title: 'Long-term recovery phase begins', content: 'Transitioning from emergency relief to sustained monthly support for 150 families still displaced.' },
      { date: '2025-12-01', title: '$20K milestone reached! 💪', content: 'Incredible donor response — over $20,000 raised and 300+ families served with grocery coupons.' },
      { date: '2025-09-30', title: 'Relief operations launched', content: 'Distribution points established at 12 emergency shelters across 3 counties within 48 hours.' },
    ],
    recentDonors: [
      { name: 'NC Strong Foundation', amount: 2000, message: 'Western NC will rebuild. We stand with you.', date: '2026-01-12', isAnonymous: false },
      { name: 'Anonymous', amount: 250, date: '2026-01-10', isAnonymous: true },
      { name: 'Mark T.', amount: 100, message: 'Fellow first responder here. Stay strong, brother.', date: '2026-01-08', isAnonymous: false },
      { name: 'The Campbell Family', amount: 500, date: '2026-01-05', isAnonymous: false },
    ],
    brandPartners: ['Ingles Markets', 'Food Lion', 'Walmart'],
    organizer: { name: 'Sheriff Tom Bradley', relationship: 'Community Relief Coordinator' },
  },
  {
    id: 'featured-4',
    name: 'Children of Heroes',
    location: 'Ukraine',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=400&fit=crop',
    story: 'Children of fallen heroes in Ukraine are receiving nutrition, education supplies, and community care — ensuring they are never forgotten.',
    fullStory: `Since the full-scale invasion began, thousands of Ukrainian children have lost a parent — mothers and fathers who gave their lives defending their country. These children are heroes in their own right, carrying burdens no child should bear.

The Children of Heroes program was founded by a group of military widows who understood that while the nation mourned, practical support was desperately needed. Many of these families lost their primary breadwinner, plunging them into financial hardship on top of unimaginable grief.

Our partnership provides monthly grocery coupons redeemable at Silpo, ATB, and other major Ukrainian retailers. But the program goes beyond food. We fund school supplies, winter clothing, and after-school activities that give these children a sense of community and belonging.

Olena, mother of 8-year-old Dmytro, shared: "My husband was everything to us. When he didn't come home, I didn't know how we would survive. The grocery coupons mean Dmytro eats well. The after-school program means he has friends who understand. We are not forgotten."

Currently supporting 245 families across Kyiv, Lviv, and Dnipro, the program aims to expand to Odesa and Kharkiv by mid-2026. Every donation directly impacts a child who has already sacrificed more than most of us ever will.`,
    impact: 'Monthly support for 245 hero families',
    category: 'child',
    donorsCount: 245,
    amountRaised: 16800,
    goal: 20000,
    dateHelped: 'Ongoing since 2024',
    verified: true,
    galleryImages: [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=600&fit=crop',
    ],
    updates: [
      { date: '2026-02-14', title: 'Valentine\'s Day celebration ❤️', content: 'Children created cards for their mothers and host families. A beautiful day filled with love and laughter.' },
      { date: '2026-01-20', title: 'Expansion to Dnipro', content: 'Our third city hub is now operational, supporting 45 new families in the Dnipro region.' },
      { date: '2025-12-25', title: 'Holiday gift packages delivered 🎄', content: 'Every child in the program received a gift package with toys, school supplies, and warm clothing.' },
    ],
    recentDonors: [
      { name: 'United for Ukraine', amount: 1500, message: 'Slava Ukraini. We will never forget.', date: '2026-02-12', isAnonymous: false },
      { name: 'Anonymous', amount: 200, date: '2026-02-10', isAnonymous: true },
      { name: 'Oksana M.', amount: 100, message: 'For the children who carry the weight of the world.', date: '2026-02-08', isAnonymous: false },
      { name: 'Diaspora Aid Network', amount: 750, date: '2026-02-05', isAnonymous: false },
    ],
    brandPartners: ['Silpo', 'ATB Market', 'Novus'],
    organizer: { name: 'Iryna Bondarenko', relationship: 'Program Founder & Military Widow' },
  },
];

export const featuredStory = impactStories[0];
